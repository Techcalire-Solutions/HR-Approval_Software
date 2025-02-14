const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const LeaveType = require('../models/leaveType');
const User = require('../../users/models/user');
const UserLeave = require('../models/userLeave');
const Role = require('../../users/models/role');
const UserPersonal = require('../../users/models/userPersonal');
const upload = require('../../utils/leaveDocumentMulter');
const s3 = require('../../utils/s3bucket');
const config = require('../../utils/config');
const UserPosition = require('../../users/models/userPosition');
const { where } = require('sequelize');
const { createNotification } = require('../../app/notificationService');
const { sendEmail } = require('../../app/emailService');
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');
const UserEmail = require('../../users/models/userEmail');
const Notification = require('../../notification/models/notification');
const { resolveHostname } = require('nodemailer/lib/shared');
const TeamLeader = require('../../users/models/teamLeader');

// --------------------------------------------------------LEAVE REQUESTING------------------------------------------------------------
router.post('/employeeLeave', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
      await transaction.rollback();
      return res.json({ message: 'Missing required fields' });
    }

    // Check user and leave type
    const user = await User.findByPk(userId);
    if (!user) {
      await transaction.rollback();
      return res.json({ message: 'User not found' });
    }
    const leaveType = await LeaveType.findByPk(leaveTypeId, { transaction });
    if (!leaveType) {
      await transaction.rollback();
      return res.json({ message: 'Leave type not found' });
    }
    const isLOP = leaveType.leaveTypeName === 'LOP';
    // Group leave dates by year and calculate days
    const datesByYear = {};
    leaveDates.forEach(date => {
      const year = new Date(date.date).getFullYear();
      if (!datesByYear[year]) datesByYear[year] = [];
      datesByYear[year].push(date);
    });
    console.log(datesByYear);
    
    const noOfDaysByYear = {};
    Object.keys(datesByYear).forEach(year => {
      let totalDays = 0; // Inlined logic for calculating leave days
      datesByYear[year].forEach(date => {
        if (date.session1 !== undefined && date.session2 !== undefined) {
          if (date.session1 && date.session2) {
            totalDays += 1; // Full day leave
          } else if (date.session1 || date.session2) {
            totalDays += 0.5; // Half day leave
          }
        }
      });
      noOfDaysByYear[year] = totalDays;
    });

    // Handle LOP leave
    if (isLOP) {
      const lopLeave = await Leave.create({
        userId,
        leaveTypeId,
        startDate: startDate,
        endDate: endDate,
        noOfDays: leaveDates.length,
        notes,
        fileUrl,
        status: 'Requested',
        leaveDates
      }, { transaction });
      
      await handleNotificationsAndEmails(req, res, [lopLeave], transaction, 'employee');
      transaction.commit();
      return res.json({ message: 'LOP leave created', leave: lopLeave });
    }

    // Check balance for each year without updating
    let balanceDaysUsed = 0;
    let lopDays = 0;
    const leaveDetails = [];
    const years = Object.keys(datesByYear);

    for (const year of years) {
      const [userLeave, created] = await UserLeave.findOrCreate({
        where: { userId, leaveTypeId, year },
        defaults: {
          leaveBalance: 0 // Set the default leaveBalance to 0 if a new record is created
        },
        transaction
      });
      const yearDays = noOfDaysByYear[year];
      if (userLeave && userLeave.leaveBalance >= yearDays) {
        // Use the full yearDays from the requested leave type
        balanceDaysUsed += yearDays;
        leaveDetails.push({ year, balanceUsed: yearDays, lopUsed: 0, balanceLeaves: userLeave.leaveBalance, leaveType: leaveType.leaveTypeName });
      } else if (userLeave && userLeave.leaveBalance > 0) {
        // Use available balance and mark the rest as LOP
        const balanceUsed = userLeave.leaveBalance;
        const remaining = yearDays - balanceUsed;

        balanceDaysUsed += balanceUsed;
        lopDays += remaining;
        leaveDetails.push({ year, balanceUsed, lopUsed: remaining, balanceLeaves: userLeave.leaveBalance, leaveType: leaveType.leaveTypeName });
      } else {
        lopDays += yearDays;
        leaveDetails.push({ year, balanceUsed: 0, lopUsed: lopDays, balanceLeaves: userLeave.leaveBalance, leaveType: leaveType.leaveTypeName });
      }
    }

    // Create leave records
    const leaves = [];
    if (balanceDaysUsed > 0) {
      const balanceLeaveDates = leaveDates.filter(date => {
        const year = new Date(date.date).getFullYear().toString();
        const userLeaveForYear = leaveDetails.find(detail => detail.year === year);
        return userLeaveForYear && userLeaveForYear.balanceUsed > 0;
      });
      // Create leave for the requested type (using balance)
      const balanceLeave = await Leave.create({
        userId,
        leaveTypeId,
        startDate: balanceLeaveDates[0].date,
        endDate: balanceLeaveDates[balanceLeaveDates.length - 1].date,
        noOfDays: balanceDaysUsed,
        notes,
        fileUrl,
        status: 'Requested',
        leaveDates: balanceLeaveDates // Assign filtered leaveDates
      }, { transaction });
      leaves.push(balanceLeave);
    }

    if (lopDays > 0) {
      // Filter leaveDates for lopLeave
      const lopLeaveDates = leaveDates.filter(date => {
        const year = new Date(date.date).getFullYear().toString();
        const userLeaveForYear = leaveDetails.find(detail => detail.year === year);
        return userLeaveForYear && userLeaveForYear.lopUsed > 0;
      });

      // Create leave for LOP (remaining days)
      const lopType = await LeaveType.findOne({ where: { leaveTypeName: 'LOP' }, transaction });
      const lopLeave = await Leave.create({
        userId,
        leaveTypeId: lopType.id,
        startDate: lopLeaveDates[0].date,
        endDate: lopLeaveDates[lopLeaveDates.length - 1].date,
        noOfDays: lopDays,
        notes: `${notes} (Auto LOP due to insufficient balance)`,
        fileUrl,
        status: 'Requested',
        leaveDates: lopLeaveDates // Assign filtered leaveDates
      }, { transaction });
      leaves.push(lopLeave);
    }

    // Send notifications and emails
    await handleNotificationsAndEmails(req, res, leaves, transaction, 'employee');

    await transaction.commit(); // Commit the transaction

    res.json({
      message: 'Leave processed',
      details: leaveDetails,
      leaves
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback(); // Rollback only if the transaction is not finished
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// -----------------------------------------------------------GETBYUSERID-------------------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.json({ message: 'User not found' });
    }

    let whereClause = {
      userId: userId
    };
    let limit;
    let offset;


    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;
    }
    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        ...whereClause,
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('leaveTypeName'), ' ', '')),
            { [Op.like]: `%${searchTerm}%` }
          ),
        ],
      };
    }

    const leave = await Leave.findAll({
      order: [['id', 'DESC']],
      limit,
      offset,
      where: whereClause,
      include: [
        {
          model: LeaveType, as: 'leaveType',
          attributes: ['id', 'leaveTypeName'],
        }
      ]
    });


    const totalCount = await Leave.count({ where: whereClause });

    if (req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {

      res.json(leave);
    }
  } catch (error) {
    res.send(error.message);
  }
});

// -----------------------------------------------------------FOR DASHBOARD----------------------------------------------------------
router.get('/find/requested', async (req, res) => {
  try {
    let limit;
    let offset;
  
    if (typeof req.query.pageSize !== 'undefined' && typeof req.query.page !== 'undefined') {
      limit = parseInt(req.query.pageSize, 10);
      offset = (parseInt(req.query.page, 10) - 1) * limit;
    }  
    const leave = await Leave.findAll({
      order: [['id', 'DESC']], where: {status: 'Requested'},
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
          required: true,
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['leaveTypeName'],
          required: true,
        }
      ]
    });
    
    const totalCount = await Leave.count({ where: {status: 'Requested'}});
    
    if (typeof req.query.page !== 'undefined' && typeof req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {
      res.json(leave);
    }
  } catch (error) {
    res.send(error.message);
  }
});

// ------------------------------------------------------------GET ALL----------------------------------------------------------------------
router.get('/find', async (req, res) => {
  try {

    let limit;
    let offset;
  
    if (typeof req.query.pageSize !== 'undefined' && typeof req.query.page !== 'undefined') {
      limit = parseInt(req.query.pageSize, 10);
      offset = (parseInt(req.query.page, 10) - 1) * limit;
    }  
    let searchTerm;
    if (req.query.search !== undefined && req.query.search !== '') {
      searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
    }
    
    const leave = await Leave.findAll({
      order: [['id', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
          required: true,
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['leaveTypeName'],
          required: true,
        }
      ],
      where: searchTerm
        ? {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('user.name'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('leaveType.leaveTypeName'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              )
            ]
          }
        : {} 
    });
    
    const totalCount = await Leave.count();
    
    if (typeof req.query.page !== 'undefined' && typeof req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {
      res.json(leave);
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.post('/emergencyLeave', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;

    // Validate required fields
    if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
      await transaction.rollback();
      return res.send('Missing required fields');
    }

    // Fetch leave type within transaction
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId }, transaction });
    if (!leaveType) {
      await transaction.rollback();
      return res.send('Leave type not found');
    }
    console.log(leaveType);
    
    // Sort leaveDates by date
    const sortedLeaveDates = [...leaveDates].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Initialize collections for balance and LOP leave dates
    const balanceDates = [];
    const lopDates = [];
    let totalBalanceDays = 0;
    let totalLopDays = 0;

    // Track UserLeave balances per year
    const userLeaves = new Map();

    // Process each date individually
    for (const dateObj of sortedLeaveDates) {
      const dateYear = new Date(dateObj.date).getFullYear().toString();
      // Get or create UserLeave for the year
      if (!userLeaves.has(dateYear)) {
        const userLeave = await UserLeave.findOne({
          where: { userId, leaveTypeId, year: dateYear },
          transaction,
        });
        userLeaves.set(dateYear, {
          instance: userLeave,
          balance: userLeave ? userLeave.leaveBalance : 0
        });
      }

      const { instance: userLeave, balance } = userLeaves.get(dateYear);
      const isLOP = leaveType.leaveTypeName === 'LOP';
      if (isLOP) {
        lopDates.push(dateObj);
        totalLopDays += await calculateDays(dateObj);
        continue;
      }

      // Calculate required days for current date
      const requiredDays = await calculateDays(dateObj);
      
      let remainingDays = requiredDays;
      
      // Allocate to balance if possible
      if (balance >= remainingDays) {
        balanceDates.push(dateObj);
        userLeaves.get(dateYear).balance -= remainingDays;
        totalBalanceDays += remainingDays;
      } else {
        // Split sessions between balance and LOP
        const { balancePart, lopPart } = await splitSessions(dateObj, balance);
        
        if (balancePart) {
          balanceDates.push(balancePart);
          totalBalanceDays += await calculateDays(balancePart);
          userLeaves.get(dateYear).balance -= await calculateDays(balancePart);
        }
        
        if (lopPart) {
          lopDates.push(lopPart);
          totalLopDays += await calculateDays(lopPart);
        }
      }
    }

    // Update UserLeave records
    for (const [year, { instance, balance }] of userLeaves) {
      if (instance) {
        instance.leaveBalance = balance;
        instance.takenLeaves += (instance.leaveBalance - balance); // Update taken leaves based on the difference
        await instance.save({ transaction });
        console.log(instance);
        
      } else {
        await UserLeave.create({
          userId,
          leaveTypeId,
          year,
          noOfDays: 0,
          leaveBalance: 0,
          takenLeaves: 0,
        }, { transaction });    
      }
    }

    // Check LOP leave type exists
    const lopLeaveType = await LeaveType.findOne({
      where: { leaveTypeName: 'LOP' },
      transaction,
    });
    if (!lopLeaveType && totalLopDays > 0) {
      await transaction.rollback();
      return res.status(404).send('LOP leave type not found');
    }
    
    // Create leave records
    const leaves = [];
    if (totalBalanceDays > 0) {
      const balanceLeave = await createLeaveRecord({
        userId,
        leaveTypeId: leaveType.id,
        dates: balanceDates,
        notes,
        fileUrl,
        status,
        transaction,
      });
      leaves.push(balanceLeave);
    }

    if (totalLopDays > 0) {
      const isLOPLeave = leaveType.leaveTypeName === 'LOP';
      const lopNotes = isLOPLeave ? notes : `${notes} (Excess converted to LOP)`;
      const lopLeave = await createLeaveRecord({
        userId,
        leaveTypeId: lopLeaveType.id,
        dates: lopDates,
        notes: lopNotes,
        fileUrl,
        status,
        transaction,
      });
      leaves.push(lopLeave);
    }
 
    const not = await handleNotificationsAndEmails(req, res, leaves, transaction, 'emergency');
    await transaction.commit();
    res.json({ leaves, not });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    res.send(error);
  }
});

// ----------------------------------------------------------------LEAVE BALANCE---------------------------------------------------------
router.get('/find/monthlyleavedays', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Get startDate and endDate from query params

    if (!startDate || !endDate) {
      return res.send('startDate and endDate are required');
    }

    const data = await Leave.findAll({
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.literal(`
          CASE
            WHEN "startDate" < '${startDate}' AND "endDate" >= '${startDate}' THEN
              LEAST(EXTRACT(DAY FROM "endDate"::timestamp - '${startDate}'::timestamp) + 1, "noOfDays")
            WHEN "startDate" >= '${startDate}' AND "endDate" <= '${endDate}' THEN
              "noOfDays"
            WHEN "startDate" >= '${startDate}' AND "endDate" > '${endDate}' THEN
              LEAST(EXTRACT(DAY FROM '${endDate}'::timestamp - "startDate"::timestamp) + 1, "noOfDays")
            ELSE
              0
          END
        `)), 'totalLeaveDays']
      ],
      include: [
        {
          model: LeaveType,
          attributes: [],
          where: {
            leaveTypeName: 'LOP'
          }
        }
      ],
      where: {
        [Op.and]: [
          { startDate: { [Op.lte]: endDate } }, // Leave starts on or before endDate
          { endDate: { [Op.gte]: startDate } }  // Leave ends on or after startDate
        ]
      },
      group: ['userId'],
      raw: true,
    });
    console.log(data);
    
    res.send(data);
  } catch (error) {
    res.send(error.message);
  }
});
// --------------------------------------------------HELPING FUNCTIONS-------------------------------------------------------------------------
async function handleNotificationsAndEmails(req, res, leaves, transaction, type) {
  let message = [];
  const userPos = await UserPosition.findOne({
    where: { userId: req.body.userId },
    include: [{ model: User, attributes: ['name'] }],
    transaction,
  });

  if (!userPos) {
    message.push('Employment details are not added for the employee');
    return message; // Return the array directly
  }

  for (const leave of leaves) {
    const lt = await LeaveType.findByPk(leave.leaveTypeId, { transaction });
    
    // Handle Reporting Manager
    const rmId = await getRMId(req.body.userId);
    if (Number.isInteger(rmId)) {
      createNotification({
        id: rmId,
        me: `Leave Request Submission from ${userPos.user.name}`,
        route: `/login/leave/${leave.id}`
      });
    } else {
      message.push(rmId); // Assuming rmId contains error message
    }

    // Handle HR/User notifications
    if (type === 'employee') {
      const hrId = await getHRId();
      if (Number.isInteger(hrId)) {
        createNotification({
          id: hrId,
          me: `Leave Request Submission from ${userPos.user.name}`,
          route: `/login/leave/${leave.id}`
        });
      } else {
        message.push('HR Admin not found');
      }
    } else {
      createNotification({
        id: req.body.userId,
        me: `Leave Request Submission from ${userPos.user.name}`,
        route: `/login/leave/${leave.id}`
      });
    }

    // Handle Team Leads
    try {
      const teamLeadIds = await getTeamLeads(req.body.userId);
      if (Array.isArray(teamLeadIds)) {
        for (const tlId of teamLeadIds) {
          createNotification({
            id: tlId,
            me: `Leave Request Submission from ${userPos.user.name}`,
            route: `/login/leave/${leave.id}`
          });
        }
      } else {
        message.push('Failed to get team leads');
      }
    } catch (error) {
      message.push(`Team lead error: ${error.message}`);
    }

    // Email handling
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hrEmail;

    if (type === 'employee') {
      hrEmail = await getHREmail();
      if (!emailRegex.test(hrEmail)) {
        message.push(`Invalid HR email: ${hrEmail}`);
        continue;
      }
    } else {
      hrEmail = userPos.officialMailId;
      if (!hrEmail) {
        message.push(`Official mail missing for ${userPos.user.name}`);
        continue;
      }
    }

    // Email sending logic
    try {
      const reportingManagerEmail = await getReportingManagerEmailForUser(req.body.userId);
      let cc = [];
      
      // Validate reporting manager email
      if (!emailRegex.test(reportingManagerEmail)) {
        message.push(`Invalid reporting manager email: ${reportingManagerEmail}`);
        continue;
      }

      // Get team lead emails
      const teamLeadEmails = await getTeamLeadEmails(req.body.userId);
      if (Array.isArray(teamLeadEmails)) {
        cc = teamLeadEmails.filter(email => emailRegex.test(email));
      }

      await sendEmail(
        req.headers.authorization?.split(' ')[1],
        config.email.userAddUser,
        config.email.userAddPass,
        reportingManagerEmail,
        `Leave Application - ${lt.leaveTypeName}`,
        emailHtml, // Make sure emailHtml is defined
        [],
        cc
      );
    } catch (emailError) {
      message.push(`Email failed: ${emailError.message}`);
    }
  }

  return message; // Return the collected messages array
}

async function getHREmail() {
    const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
    if (!hrAdminRole) {
      return ('HR Admin role not found');
    }
    const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
    if (!hrAdminUser) {
      return ('HR Admin user not found');
    }
    const userPosition = await UserPosition.findOne({ where: { userId: hrAdminUser.id } });
    if (!userPosition || !userPosition.officialMailId) {
      return ('Official Mail Id not found for HR Admin');
    }
    return userPosition.officialMailId;
}
  
async function getReportingManagerEmailForUser(userId) {
    try {
        const userPersonal = await UserPersonal.findOne({
        where: { userId },
        attributes: ['reportingMangerId'],
        });
        if (!userPersonal || !userPersonal?.reportingMangerId) {
          return ( `Reporting mangaer for user id ${userId} is not found`);
        }

        const reportingMangerId = userPersonal?.reportingMangerId;

        if (!reportingMangerId) {
          return ( `No reporting manager found for userId ${userId}`);
        }

        const reportingManagerPosition = await UserPosition.findOne({
        where: { userId: reportingMangerId },
        attributes: ['officialMailId'],
        });

        if (reportingManagerPosition && reportingManagerPosition.officialMailId) {
          return reportingManagerPosition.officialMailId;
        } else {
          return ( `Reporting manager official mail not found for reportingMangerId ${reportingMangerId}`);
        }
    } catch (error) {
        return 'Error fetching reporting manager email';
    }
}

async function getTeamLeadEmails(userId) {
  try {
      const team = await UserPosition.findOne({ where: { userId } });
      if (!team) {
          return(`No team found for user with ID: ${userId}`);
      }
      const teamId = team.id;
      
      const tls = await TeamLeader.findAll({ 
          where: { teamId }, include: {
            model: User, attributes: ['name'],           
            include: { 
              model: UserPosition, 
              attributes: ['officialMailId'] 
            }
          }
      });
      if (tls.length === 0) {
          return(`No team leads found for team with ID: ${teamId}`);
      }

      const tlEmails = tls.map(tl => tl.user.userPosition?.officialMailId).filter(email => email);
      console.log(tlEmails);
      
      if(!tlEmails.length) return ("Official MailId is not added for TLs");
      return tlEmails;
  } catch (error) {
      return error.message;
  }
}

async function getRMId(userId) {
  try {
    const userPersonal = await UserPersonal.findOne({
      where: { userId },
      attributes: ['reportingMangerId'],
      });
      if (!userPersonal || !userPersonal?.reportingMangerId) {
        return ( `Reporting mangaer for user id ${userId} is not found`);
      }

      const reportingMangerId = userPersonal?.reportingMangerId;

      if (!reportingMangerId) {
        return ( `No reporting manager found for userId ${userId}`);
      }

      return reportingMangerId;
  } catch (error) {
    return error.message
  }
}

async function getHRId() {
  try {
    const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
    if (!hrAdminRole) {
      return ('HR Admin role not found');
    }
    const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
    if (!hrAdminUser) {
      return ('HR Admin user not found');
    }
    return hrAdminUser.id;
  } catch (error) {
    res.send(error.message)
  } 
}

async function getTeamLeads(userId) {
  try {
    const team = await UserPosition.findOne({ where: { userId } });
    if (!team) {
        return(`No team found for user with ID: ${userId}`);
    }
    const teamId = team.id;
    
    const tls = await TeamLeader.findAll({ where: { teamId }, include: {model: User, attributes: ['id']} });
    const tlIds = tls.map(tl => tl.user.id);
    console.log(tlIds);
    
    return tlIds;

    // if(!tlEmails.length) return ("Official MailId is not added for TLs");
} catch (error) {
    return error.message;
}
}

async function calculateDays(dateObj) {
  return (dateObj.session1 ? 0.5 : 0) + (dateObj.session2 ? 0.5 : 0);
}

async function splitSessions(dateObj, availableBalance) {
  const result = { balancePart: null, lopPart: null };
  const reqDays = calculateDays(dateObj);
  
  if (availableBalance <= 0) {
    result.lopPart = dateObj;
    return result;
  }

  // Clone date object to avoid mutation
  const balancePart = { ...dateObj, session1: false, session2: false };
  const lopPart = { ...dateObj, session1: false, session2: false };

  // Allocate sessions to balance first
  if (availableBalance >= 0.5 && dateObj.session1) {
    balancePart.session1 = true;
    availableBalance -= 0.5;
  } else if (dateObj.session1) {
    lopPart.session1 = true;
  }

  if (availableBalance >= 0.5 && dateObj.session2) {
    balancePart.session2 = true;
    availableBalance -= 0.5;
  } else if (dateObj.session2) {
    lopPart.session2 = true;
  }

  // Only add if has sessions
  if (balancePart.session1 || balancePart.session2) result.balancePart = balancePart;
  if (lopPart.session1 || lopPart.session2) result.lopPart = lopPart;

  return result;
}

async function createLeaveRecord({ userId, leaveTypeId, dates, notes, fileUrl, status, transaction }) {
  if (dates.length === 0) return null;
  
  const sortedDates = dates.sort((a, b) => new Date(a.date) - new Date(b.date));
  return await Leave.create({
    userId,
    leaveTypeId,
    startDate: sortedDates[0].date,
    endDate: sortedDates[sortedDates.length - 1].date,
    noOfDays: dates.reduce((sum, date) => sum + calculateDays(date), 0),
    notes,
    fileUrl,
    status,
    leaveDates: dates,
  }, { transaction });
}

module.exports = router;