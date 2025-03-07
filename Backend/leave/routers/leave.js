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
const Designation = require('../../users/models/designation');

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

    const noOfDaysByYear = {};
    let totalRequiredDays = 0; 
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

    // Check balance for each year
    const userLeaves = new Map();
    for (const year of Object.keys(datesByYear)) {
      let userLeave = await UserLeave.findOne({
        where: { userId, leaveTypeId, year },
        transaction,
      });

      if (!userLeave) {
        userLeave = await UserLeave.create({
          userId,
          leaveTypeId,
          year,
          noOfDays: 0,
          leaveBalance: 0,
          takenLeaves: 0,
        }, { transaction });
      }

      userLeaves.set(year, {
        instance: userLeave,
        balance: userLeave.leaveBalance,
      });

      const requiredDays = noOfDaysByYear[year];
      totalRequiredDays += requiredDays; 
      if (userLeave.leaveBalance < requiredDays && !isLOP) {
        await transaction.rollback();
        return res.json({ message: `Insufficient leave balance for year ${year}` });
      }
    }

    // Create leave records
    const leave = await Leave.create({
      userId,
      leaveTypeId,
      startDate: startDate,
      endDate: endDate,
      noOfDays: totalRequiredDays,
      notes,
      fileUrl,
      status: 'Requested',
      leaveDates,
    }, { transaction });
    // Send notifications and emails
  
    const not = await handleNotificationsAndEmails(req, res, leave, transaction, 'employee', 'Create');
    await transaction.commit();
    res.json({
      not: not,
      message: 'Leave processed successfully',
      leave,
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback(); // Rollback only if the transaction is not finished
    }
    res.json({error: error.message });
  }
});

router.patch('/updateemployeeleave/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const leaveId = req.params.id;
    const { userId, leaveTypeId, leaveDates, notes, fileUrl, startDate, endDate } = req.body;

    // Validate required fields
    if (!userId || !leaveTypeId || !leaveDates) {
      await transaction.rollback();
      return res.json({ message: 'Missing required fields: userId, leaveTypeId, and leaveDates are mandatory.' });
    }

    // Get existing leave
    const existingLeave = await Leave.findByPk(leaveId, { transaction });
    if (!existingLeave) {
      await transaction.rollback();
      return res.json({ message: `Leave not found with id=${leaveId}` });
    }

    // Revert previous balance if not LOP
    const existingLeaveType = await LeaveType.findByPk(existingLeave.leaveTypeId, { transaction });
    if (existingLeaveType.leaveTypeName !== 'LOP') {
      const existingDatesByYear = {};
      existingLeave.leaveDates.forEach(date => {
        const year = new Date(date.date).getFullYear();
        if (!existingDatesByYear[year]) existingDatesByYear[year] = [];
        existingDatesByYear[year].push(date);
      });

      for (const [year, dates] of Object.entries(existingDatesByYear)) {
        const userLeave = await UserLeave.findOne({
          where: { 
            userId: existingLeave.userId, 
            leaveTypeId: existingLeave.leaveTypeId,
            year: parseInt(year)
          },
          transaction
        });
        
        if (userLeave) {
          userLeave.leaveBalance += existingLeave.noOfDays;
          await userLeave.save({ transaction });
        }
      }
    }
    // Process new leave request
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.json({ message: 'User not found' });
    }

    const newLeaveType = await LeaveType.findByPk(leaveTypeId, { transaction });
    if (!newLeaveType) {
      await transaction.rollback();
      return res.json({ message: 'Leave type not found' });
    }

    // Calculate days per year
    const datesByYear = {};
    leaveDates.forEach(date => {
      const year = new Date(date.date).getFullYear();
      if (!datesByYear[year]) datesByYear[year] = [];
      datesByYear[year].push(date);
    });

    const noOfDaysByYear = {};
    Object.entries(datesByYear).forEach(([year, dates]) => {
      noOfDaysByYear[year] = dates.reduce((acc, date) => {
        if (date.session1 && date.session2) return acc + 1;
        if (date.session1 || date.session2) return acc + 0.5;
        return acc;
      }, 0);
    });

    // Check balance for each year
    for (const [year, days] of Object.entries(noOfDaysByYear)) {
      const userLeave = await UserLeave.findOne({
        where: { userId, leaveTypeId, year: parseInt(year) },
        transaction,
      });

      if (!userLeave) {
        await transaction.rollback();
        return res.json({ message: `No leave record found for year ${year}` });
      }

      if (userLeave.leaveBalance < days && newLeaveType.leaveTypeName !== 'LOP') {
        await transaction.rollback();
        return res.json({ message: `Insufficient leave balance for year ${year}` });
      }
    }

    const updatedLeave = await updateLeaveRecord({
      leaveId: req.params.id,
      userId,
      leaveTypeId,
      dates: leaveDates,
      notes,
      fileUrl,
      status: 'Requested',
      transaction,
    });

    // Create new leave record
    // const newLeave = await Leave.create({
    //   userId,
    //   leaveTypeId,
    //   startDate,
    //   endDate,
    //   noOfDays: leaveDates.length,
    //   notes,
    //   fileUrl,
    //   status: 'Requested',
    //   leaveDates,
    // }, { transaction });

    // Update UserLeave records


    // Send notifications and emails
    const not = await handleNotificationsAndEmails(req, res, updatedLeave, transaction, 'employee', 'Update');

    await transaction.commit();

    res.json({
      not: not,
      message: 'Leave updated successfully',
      leave: updatedLeave,
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback(); // Rollback only if the transaction is not finished
    }
    res.json({message: error.message });
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
      userId: userId,
      status: { [Op.ne]: 'Locked' } // Add this line to filter out 'Locked' status
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
        { model: User, as: 'user', attributes: ['name', 'empNo'], required: true},
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'leaveTypeName'] }
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

router.get('/userlocked/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.json({ message: 'User not found' });
    }

    let whereClause = {
      userId: userId,
      status: 'Locked'
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
          attributes: ['name', 'empNo'],
          required: true,
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['leaveTypeName'],
          required: true,
        }
      ],
      where: {
        [Op.and]: [
          {
            status: {
              [Op.ne]: 'Locked' // Filter to exclude records where status is 'Locked'
            }
          },
          searchTerm
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
        ]
      }
    });

    const totalCount = await Leave.count({
      where: {
        status: {
          [Op.ne]: 'Locked' // Ensure the count also respects the status filter
        }
      }
    });

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

router.get('/findlocked', async (req, res) => {
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
          attributes: ['name', 'empNo'],
          required: true,
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['leaveTypeName'],
          required: true,
        }
      ],
      where: {
        [Op.and]: [
          {
            status: 'Locked'
          },
          searchTerm
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
        ]
      }
    });

    const totalCount = await Leave.count({
      where: {
        status: 'Locked'
      }
    });

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
      return res.json({ message: 'Missing required fields' });
    }

    // Fetch leave type
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId }, transaction });
    if (!leaveType) {
      await transaction.rollback();
      return res.json({ message: 'Leave type not found' });
    }

    // Sort leaveDates by date
    const sortedLeaveDates = [...leaveDates].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group leave dates by year
    const datesByYear = new Map();
    for (const dateObj of sortedLeaveDates) {
      const dateYear = new Date(dateObj.date).getFullYear().toString();
      if (!datesByYear.has(dateYear)) {
        datesByYear.set(dateYear, []);
      }
      datesByYear.get(dateYear).push(dateObj);
    }

    // Track UserLeave balances and used days per year
    const userLeaves = new Map(); // { year: { instance, balance } }
    let totalBalanceDays = 0;

    // Check if the leave type is LOP
    const isLOP = leaveType.leaveTypeName === 'LOP';

    // Initialize leaves array to store created leave records
    let leaves;

    // Calculate required days for each date
    for (const [year, dates] of datesByYear) {
      let totalDays = 0;
      for (const dateObj of dates) {
        const requiredDays = await calculateDays(dateObj);
        totalDays += requiredDays;
      }

      // Initialize UserLeave for the current year
      let userLeave = await UserLeave.findOne({
        where: { userId, leaveTypeId, year },
        transaction,
      });

      if (!userLeave) {
        userLeave = await UserLeave.create({
          userId,
          leaveTypeId,
          year,
          noOfDays: 0,
          leaveBalance: 0,
          takenLeaves: 0,
        }, { transaction });
      }

      userLeaves.set(year, {
        instance: userLeave,
        balance: userLeave.leaveBalance,
      });

      // Check if the balance is sufficient
      if (userLeave.leaveBalance < totalDays && !isLOP) {
        await transaction.rollback();
        return res.json({ message: `Insufficient leave balance for year ${year}` });
      }

      totalBalanceDays += totalDays;
    }

    // Create leave records for each year
    for (const [year, dates] of datesByYear) {
      const { instance: userLeave } = userLeaves.get(year);
      userLeave.takenLeaves += totalBalanceDays;
      if(!isLOP){
        userLeave.leaveBalance -= totalBalanceDays;
      }
      await userLeave.save({ transaction });

      // Create leave record for this year
      const leave = await createLeaveRecord({
        userId,
        leaveTypeId,
        dates: dates,
        notes: notes,
        fileUrl,
        status,
        transaction,
      });
      leaves = leave
    }

    // Prepare leaveDetails for response
    const leaveDetails = [];
    for (const [year, { instance: userLeave }] of userLeaves) {
      leaveDetails.push({
        year,
        balanceUsed: totalBalanceDays,
        balanceLeaves: userLeave.leaveBalance,
        leaveType: leaveType.leaveTypeName
      });
    }

    // Commit transaction and send response
    const not = await handleNotificationsAndEmails(req, res, leaves, transaction, 'emergency', 'Create');
    await transaction.commit();
    res.json({
      not: not,
      message: 'Leave processed successfully',
      totalBalanceDays,
      leaves, // Include the created leave records in the response
      details: leaveDetails // Include leave details in the response
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.json({ message: error.message });
  }
});

router.patch('/updateemergencyLeave/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;
    // Validate required fields
    if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
      await transaction.rollback();
      return res.json({ message: 'Missing required fields' });
    }

    // Fetch leave type within transaction
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId }, transaction });
    if (!leaveType) {
      await transaction.rollback();
      return res.json({ message: 'Leave type not found' });
    }
    // Fetch existing leave record
    const existingLeave = await Leave.findByPk(req.params.id, { transaction });
    if (!existingLeave) {
      await transaction.rollback();
      return res.json({ message: 'Leave record not found' });
    }

    // Fetch existing UserLeave record for the old leave
    const oldYear = new Date(existingLeave.startDate).getFullYear().toString();
    const oldUL = await UserLeave.findOne({ where: { userId: existingLeave.userId, leaveTypeId: existingLeave.leaveTypeId, 
      year: oldYear }, transaction });
    if (oldUL) {
      oldUL.takenLeaves -= existingLeave.noOfDays;
      oldUL.leaveBalance += existingLeave.noOfDays;
      await oldUL.save({ transaction });
    }

    // Sort leaveDates by date
    const sortedLeaveDates = [...leaveDates].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group leave dates by year
    const datesByYear = new Map();
    for (const dateObj of sortedLeaveDates) {
      const dateYear = new Date(dateObj.date).getFullYear().toString();
      if (!datesByYear.has(dateYear)) {
        datesByYear.set(dateYear, []);
      }
      datesByYear.get(dateYear).push(dateObj);
    }

    // Track UserLeave balances per year
    const userLeaves = new Map();

    // Check balance for each year
    for (const [year, dates] of datesByYear) {
      let totalDays = 0;
      for (const dateObj of dates) {
        const requiredDays = await calculateDays(dateObj);
        totalDays += requiredDays;
      }

      // Get or create UserLeave for the year
      let userLeave = await UserLeave.findOne({
        where: { userId, leaveTypeId, year },
        transaction,
      });

      if (!userLeave) {
        userLeave = await UserLeave.create({
          userId,
          leaveTypeId,
          year,
          noOfDays: 0,
          leaveBalance: 0,
          takenLeaves: 0,
        }, { transaction });
      }

      userLeaves.set(year, {
        instance: userLeave,
        balance: userLeave.leaveBalance,
      });
      
      // Check if the balance is sufficient
      if (userLeave.leaveBalance < totalDays && leaveType.leaveTypeName !== 'LOP') {
        await transaction.rollback();
        return res.json({ message: `Insufficient leave balance for year ${year}` });
      }
    }

    // Update UserLeave records
    // for (const [year, { instance: userLeave, balance }] of userLeaves) {
    //   userLeave.takenLeaves += balance - userLeave.leaveBalance;
    //   userLeave.leaveBalance = balance;
    //   await userLeave.save({ transaction });
    // }

    // Update leave records
    const updatedLeave = await updateLeaveRecord({
      leaveId: req.params.id,
      userId,
      leaveTypeId,
      dates: sortedLeaveDates,
      notes,
      fileUrl,
      status: status,
      transaction,
    });

    const not = await handleNotificationsAndEmails(req, res, updatedLeave, transaction, 'emergency', 'Update');
    await transaction.commit();
    res.json({ leaves: [updatedLeave], not, message: 'Leave updated successfully', });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    res.send(error.message);
  }
});

// --------------------------------------------GET BY ID------------------------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id, {
      include: [
        {
          model: LeaveType, as: 'leaveType',
          attributes: ['id', 'leaveTypeName'],
        },
        {
          model: User, as: 'user', include :[
            { model: UserPersonal, as:'userpersonal', attributes: ['reportingMangerId']}
          ],
          attributes: ['name'],
        },
      ],
    });
    
    if (leave) {
      res.send(leave);
    } else {
      res.json({ message: `Leave not found` });
    }
  } catch (error) {
    res.send(error.message)
  }
});

router.delete('/untakenLeaveDelete/:id', authenticateToken, async (req, res) => {
  let transaction;
  try {
    const leaveId = req.params.id;

    // Start a transaction to ensure atomicity
    transaction = await sequelize.transaction();

    const leave = await Leave.findByPk(leaveId, {
      include: {
        model: LeaveType,
        as: 'leaveType',
      },
      transaction, // Pass the transaction to the query
    });

    if (!leave) {
      await transaction.rollback(); // Rollback the transaction if leave is not found
      return res.send('Leave not found');
    }

    const leaveDays = leave.noOfDays;
    const key = leave.fileUrl;

    // Delete the file from S3 if it exists
    const fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    if (fileKey) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };
      await s3.deleteObject(deleteParams).promise();
    }

    // Update UserLeave records if the leave status is 'Approved' or 'AdminApproved'
    if (leave.status === 'Approved' || leave.status === 'AdminApproved') {
      const leaveStartYear = new Date(leave.startDate).getFullYear();
      const leaveEndYear = new Date(leave.endDate).getFullYear();

      // If the leave spans multiple years, update UserLeave records for each year
      for (let year = leaveStartYear; year <= leaveEndYear; year++) {
        const userLeave = await UserLeave.findOne({
          where: {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year: year // Assuming you have a 'year' field in UserLeave
          },
          transaction, // Pass the transaction to the query
        });

        if (userLeave) {
          if (leave.leaveType.leaveTypeName === 'LOP') {
            userLeave.takenLeaves -= leaveDays;
          } else {
            userLeave.takenLeaves -= leaveDays;
            userLeave.leaveBalance += leaveDays;
          }
          await userLeave.save({ transaction }); // Save with transaction
        }
      }

      // Handle notifications and emails for 'emergency' type
      await handleNotificationsAndEmails(req, res, leave, transaction, 'emergency', 'delete');
    } else {
      // Handle notifications and emails for 'employee' type
      await handleNotificationsAndEmails(req, res, leave, transaction, 'employee', 'delete');
    }

    // Delete the leave record
    await leave.destroy({ transaction });

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.status(204).send('Leave deleted and balance updated successfully');
  } catch (error) {
    // Rollback the transaction in case of any error
    if (transaction) await transaction.rollback();
    res.status(500).send(error.message);
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
    res.send(data);
  } catch (error) {
    res.send(error.message);
  }
});
// --------------------------------------------------HELPING FUNCTIONS-------------------------------------------------------------------------
async function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

async function handleNotificationsAndEmails(req, res, leave, transaction, type, mes) {
  let message = [];
  const userPos = await UserPosition.findOne({
    where: { userId: req.body.userId ? req.body.userId : leave.userId },
    include: [{ model: User, attributes: ['name'] }],
    transaction,
  });
  if (!userPos) {
    message.push('Employment details are not added for the employee');
    return message;
  }

  // for (const leave of leaves) {
    const lt = await LeaveType.findByPk( leave.leaveTypeId );
    
    if(!lt) message.push(`LeaveType with ID ${leave.leaveTypeId} is not existing`)
    // Handle Reporting Manager
    const rmId = await getRMId(req.body.userId ? req.body.userId : leave.userId);
    if (Number.isInteger(rmId)) {
      createNotification({
        id: rmId,
        me: `leave request has been ${mes}d by ${req.user.name}.`,
        route: `/login/leave/open/${leave.id}`
      });
    } else {
      message.push(rmId);
    }

    if (type === 'employee') {
      const hrId = await getHRId();
      
      if (Number.isInteger(hrId)) {
        createNotification({
          id: hrId,
          me: `leave request has been ${mes}d by ${req.user.name}.`,
          route: `/login/leave/open/${leave.id}`
        });
      } else {
        message.push('HR Admin not found');
      }
    } else {
      createNotification({
        id: req.body.userId ? req.body.userId : leave.userId,
        me: `leave request has been ${mes}d by ${req.user.name}.`,
        route: `/login/leave/open/${leave.id}`
      });
    }

    // Handle Team Leads
    try {
      const teamLeadIds = await getTeamLeads(req.body.userId ? req.body.userId : leave.userId);
      if (Array.isArray(teamLeadIds)) {
        for (const tlId of teamLeadIds) {
          createNotification({
            id: tlId,
            me: `leave request has been ${mes}d by ${req.user.name}.`,
            route: `/login/leave/${leave.id}`
          });
        }
      } else {
        message.push('Failed to get team leads mail');
      }
    } catch (error) {
      message.push(`Team lead error: ${error.message}`);
    }

    // Email handling
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hrEmail;
    let name;
    if (type === 'employee') {
      const hr = await getHREmail();
      
      hrEmail = hr.mail;
      
      if (!emailRegex.test(hrEmail)) {
        message.push(`Invalid HR email: ${hrEmail}`);
      }else{
        name = hr.name;
      }
    } else {
      hrEmail = userPos.officialMailId;
      name = userPos.user.name;
      if (!hrEmail) {
        message.push(`Official mail missing for ${userPos.user.name}`);
      }
      console.log(name);
      
    }

    // Email sending logic
    try {
      const rm = await getReportingManagerEmailForUser(req.body.userId ? req.body.userId : leave.userId);
      let reportingManagerEmail = rm.email
      let operationalManagerEmail = await getOMEmail();
      let cc = [];
      if (!emailRegex.test(reportingManagerEmail)) {
        message.push(`Invalid reporting manager email: ${reportingManagerEmail}`);
        reportingManagerEmail = hrEmail;
      }else{
        cc.push(hrEmail)
        name = rm.name
        console.log(name);
        
      }

      if (!emailRegex.test(operationalManagerEmail)) {
        message.push(`Invalid operational manager email: ${operationalManagerEmail}`);
      }else{
        cc.push(operationalManagerEmail)
      }
      // Get team lead emails
      const teamLeadEmails = await getTeamLeadEmails(req.body.userId ? req.body.userId : leave.userId);
      if (Array.isArray(teamLeadEmails)) {
        cc.push(teamLeadEmails.filter(email => emailRegex.test(email)))
      }
      const emailHtml = `
        <p>Dear ${name},</p>
        <p>Leave Request has been successfully ${mes}d by ${req.user.name}.</p>
        <ul>
          <li>Type: ${lt.leaveTypeName}</li>
          <li>Dates: ${await formatDate(leave.startDate)} to ${await formatDate(leave.endDate)}</li>
          <li>Reason: ${leave.notes}</li>
          <li>Days: ${leave.noOfDays}</li>
          <li>Status: ${leave.status}</li>
        </ul>
      `;
      
      await sendEmail(
        req.headers.authorization?.split(' ')[1],
        config.email.userAddUser,
        config.email.userAddPass,
        reportingManagerEmail,
        `Leave Application ${mes}d - ${lt.leaveTypeName}`,
        emailHtml, // Make sure emailHtml is defined
        [],
        cc
      );
    } catch (emailError) {
      message.push(`Email failed: ${emailError.message}`);
    }
  // }

  return message; // Return the collected messages array
}

async function getHREmail() {
    const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
    
    if (!hrAdminRole) {
      return ({mail: 'HR Admin role not found'});
    }
    const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
    if (!hrAdminUser) {
      return ({mail: 'HR Admin user not found'});
    }
    const userPosition = await UserPosition.findOne({ where: { userId: hrAdminUser.id } });
    if (!userPosition || !userPosition.officialMailId) {
      return ({mail: 'Official Mail Id not found for HR Admin', name: hrAdminUser.name});
    }
    return {mail: userPosition.officialMailId, name: hrAdminUser.name};
}

async function getOMEmail() {
  const om = await Designation.findOne({ where: { designationName: 'OPERATIONS MANAGER' } });
  if (!om) {
    return ('Operational Manager role is not found');
  }
  const omUserPos = await UserPosition.findOne({ where: { designationId: om.id } });
  if (!omUserPos) {
    return ('Operational Manager user is not found');
  }

  return omUserPos.officialMailId;
}
  
async function getReportingManagerEmailForUser(userId) {
    try {
        const userPersonal = await UserPersonal.findOne({
        include: [{model: User, as: 'user', attributes: ['name']}],
        where: { userId },
        attributes: ['reportingMangerId'],
        });
        if (!userPersonal) {
          return ({email: `Personal details are not added`});
        }

        const reportingMangerId = userPersonal?.reportingMangerId;

        if (!reportingMangerId) {
          return ({email: `No reporting manager found for user ${userPersonal.user.name}`});
        }

        const reportingManagerPosition = await UserPosition.findOne({
          include: [{model: User, attributes: ['name']}],
          where: { userId: reportingMangerId },
          attributes: ['officialMailId'],
        });
        
        if (reportingManagerPosition && reportingManagerPosition.officialMailId) {
          return {email: reportingManagerPosition.officialMailId, name: reportingManagerPosition.user.name};
        } else {
          return ({email: `Official mail is not added for reportingManger ${reportingManagerPosition.user.name}`});
        }
    } catch (error) {
        return {email: error.message};
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
      attributes: ['reportingMangerId'], include: { model: User, as: 'user', attributes: ['name']}
      });
      if (!userPersonal || !userPersonal?.reportingMangerId) {
        return ( `Reporting manager is not found`);
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
    return tlIds;

    // if(!tlEmails.length) return ("Official MailId is not added for TLs");
} catch (error) {
    return error.message;
}
}

async function calculateDays(dateObj) {
  return (dateObj.session1 ? 0.5 : 0) + (dateObj.session2 ? 0.5 : 0);
}

async function createLeaveRecord({ userId, leaveTypeId, dates, notes, fileUrl, status, transaction }) {
  if (dates.length === 0) return null;
  
  const sortedDates = dates.sort((a, b) => new Date(a.date) - new Date(b.date));

  const daysArray = await Promise.all(dates.map(date => calculateDays(date)));
  const noOfDays = daysArray.reduce((sum, days) => sum + days, 0);
  return await Leave.create({
    userId,
    leaveTypeId,
    startDate: sortedDates[0].date,
    endDate: sortedDates[sortedDates.length - 1].date,
    noOfDays: noOfDays,
    notes,
    fileUrl,
    status,
    leaveDates: dates,
  }, { transaction });
}

async function updateLeaveRecord({ leaveId, userId, leaveTypeId, dates, notes, fileUrl, status, transaction }) {
  const leave = await Leave.findByPk(leaveId, { transaction });
  if (!leave) throw new Error('Leave not found');
  
  // Get the old leave details
  // Calculate new leave details
  const daysArray = await Promise.all(dates.map(date => calculateDays(date)));
  const newNoOfDays = daysArray.reduce((sum, days) => sum + days, 0);
  const newYear = new Date(dates[0].date).getFullYear().toString();
  
  const newUL = await UserLeave.findOne({ where: { userId, leaveTypeId, year: newYear }, transaction });
  
  if (newUL) {
    newUL.takenLeaves += newNoOfDays;
    newUL.leaveBalance -= newNoOfDays;
    await newUL.save({ transaction });
    
  }

  // Update the leave record
  leave.userId = userId;
  leave.leaveTypeId = leaveTypeId;
  leave.startDate = dates[0].date;
  leave.endDate = dates[dates.length - 1].date;
  leave.noOfDays = newNoOfDays;
  leave.notes = notes;
  leave.fileUrl = fileUrl;
  leave.leaveDates = dates;
  leave.status = status;

  await leave.save({ transaction });
  // Update UserLeave records
  // await updateUserLeaveRecords(userId, oldLeaveTypeId, leaveTypeId, oldNoOfDays, newNoOfDays, dates, transaction);

  return leave;
}

// -----------------------------------------------------CALENDAR-------------------------------------------------------------------------
router.get('/all/totalleaves', async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [
        {
          model: LeaveType, as: 'leaveType',
          attributes: ['id', 'leaveTypeName'],
        },
        {
          model: User, as: 'user',
          attributes: ['name']
        }
      ]
    });

    res.json(leaves);
  } catch (error) {
    res.json({ error: error.message });
  }
});


// ------------------------------------------------FILE UPLOAD--------------------------------------------------------------------------
router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send({ message: 'No file uploaded' });
    }

    const customFileName = req.body.name || req.file.originalname;
    const sanitizedFileName = customFileName.replace(/[^a-zA-Z0-9]/g, '_');

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `Leave/documents/${Date.now()}_${sanitizedFileName}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const data = await s3.upload(params).promise();

    const fileUrl = data.Location ? data.Location : '';
    const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;

    res.send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key
    });
  } catch (error) {
    res.send({ message: error.message });
  }
});

router.patch('/updateLeaveFileUrl/:leaveId', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.leaveId;
    const fileUrl = req.body.fileUrl;

    if (!leaveId || !fileUrl) {
      return res.send({ message: 'Leave ID and File URL are required' });
    }

    const result = await Leave.update(
      { fileUrl: fileUrl },
      { where: { id: leaveId } }
    );

    if (result[0] === 0) {
      return res.send({ message: 'Leave request not found or already updated' });
    }


    const userId = req.user.id;
    const userName = req.user.name;

    const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
    if (!hrAdminRole) {
      return res.send({ message: 'HR Admin role not found' });
    }


    const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
    if (!hrAdminUser) {
      return res.send({ message: 'HR Admin user not found' });
    }

    const hrAdminId = hrAdminUser.id;
    const userPersonal = await UserPersonal.findOne({
      where: { userId },
      attributes: ['reportingMangerId'],
    });

    if (!userPersonal || !userPersonal.reportingMangerId) {
      return res.send({ message: `No reporting manager found for userId ${userId}` });
    }

    const reportingManagerId = userPersonal.reportingMangerId;

    const id = reportingManagerId;
    const me = `Medical Certificate uploaded by ${userName} with id ${leaveId}`;
    const route = `/login/leave/view/${leaveId}`;
    createNotification({ id, me, route });

    return res.send({ message: 'Leave file URL updated and notifications sent' });
  } catch (error) {
    return res.send({ message: error.message });
  }
});  

// ------------------------------------------------------------------APPROVAL--------------------------------------------------------
router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body;

  try {
    // Fetch the leave request with associated user and leave type details
    const leave = await Leave.findByPk(leaveId, {
      include: [
        { model: User, attributes: ['name', 'email'], as: 'user' },
        { model: LeaveType, attributes: ['leaveTypeName'], as: 'leaveType' }
      ]
    });

    if (!leave) {
      return res.send({message: 'Leave request not found'});
    }

    const userId = leave.userId;
    const userPos = await UserPosition.findOne({
      where: { userId: userId },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);

    if (!leaveType) {
      return res.send({ message: 'Leave type not found' });
    }

    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Fetch HR, Reporting Manager, and Team Leads emails
    const hrEmail = await getHREmail().mail;
    const rmEmail = (await getReportingManagerEmailForUser(leave.userId)).email;
    const teamLeads = await getTeamLeadEmails(leave.userId);
    const omMail = await getOMEmail();

    const ccRecipients = [hrEmail, rmEmail, ...teamLeads, omMail].filter(email => email);

    // Handle LOP leave type
    if (leaveType.leaveTypeName === 'LOP') {
      // Update the takenLeave for the requested year(s)
      if (startYear === endYear) {
        // Leave spans a single year
        const userLeave = await UserLeave.findOne({
          where: {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year: startYear,
          },
        });
    
        if (!userLeave) {
          return res.status(404).send('User leave record not found for the requested year');
        }
    
        // Update takenLeave for the year
        userLeave.takenLeaves += leave.noOfDays;
        await userLeave.save();
      } else {
        // Leave spans multiple years
        const endOfStartYear = new Date(startYear, 11, 31);
        const startOfEndYear = new Date(endYear, 0, 1);
    
        const daysInStartYear = calculateDays(startDate, endOfStartYear);
        const daysInEndYear = calculateDays(startOfEndYear, endDate);
    
        const userLeaveStartYear = await UserLeave.findOne({
          where: {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year: startYear,
          },
        });
    
        const userLeaveEndYear = await UserLeave.findOne({
          where: {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year: endYear,
          },
        });
    
        if (!userLeaveStartYear || !userLeaveEndYear) {
          return res.send('User leave record not found for one or both years');
        }
    
        // Update takenLeave for both years
        userLeaveStartYear.takenLeaves += daysInStartYear;
        userLeaveEndYear.takenLeaves += daysInEndYear;
    
        await userLeaveStartYear.save();
        await userLeaveEndYear.save();
      }
    
      // Approve the leave
      leave.status = 'Approved';
      leave.adminNotes = adminNotes;
      await leave.save();
    
      // Send notifications
      let id = userId;
      const me = `${leave.user.name}'s Leave Request Approved by ${req.user.name}`;
      const route = `/login/leave/open/${leave.id}`;
    
      createNotification({ id, me, route });
    
      const hrId = await getHRId();
      console.log(hrId, "hridhridhridhridhridhrid");
      
      if (Number.isInteger(hrId)) {
        let id = hrId;
        createNotification({ id, me, route });
      }
    
      const rmId = await getRMId(leave.userId);
      console.log(rmId, "rmIdrmIdrmIdrmIdrmIdrmIdrmId");
      
      if (Number.isInteger(rmId)) {
        let id = rmId;
        createNotification({ id, me, route });
      }
    
      // Send email
      const emailSubject = `Leave Request is Approved`;
      const fromEmail = config.email.userAddUser;
      const emailPassword = config.email.userAddPass;
      const html = `
        <p>Dear ${leave.user.name},</p>
        <p>This is to inform you that ${req.user.name} has approved your ${leaveType.leaveTypeName},</p>
        <p>with note ${adminNotes}.</p>
        <p>Please review the leave application at your earliest convenience.</p>
        <p>If you have any questions or need further details, feel free to reach out.</p>
      `;
      const attachments = [];
      const token = req.headers.authorization?.split(' ')[1];
      try {
        await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject, html, attachments, ccRecipients);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    
      return res.send({ message: 'Leave approved successfully as LOP', leave });
    }

    // Handle non-LOP leave types
    let userLeaveStartYear, userLeaveEndYear;
    let daysInStartYear, daysInEndYear;

    if (startYear === endYear) {
      userLeaveStartYear = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: startYear
        }
      });

      if (!userLeaveStartYear) {
        return res.send('User leave record not found for the start year');
      }

      if (userLeaveStartYear.leaveBalance < leave.noOfDays) {
        return res.json({
          message: `Insufficient leave balance for the year ${startYear}`,
          openNoteDialog: true,
          lowLeaveMessage: "Insufficient leave balance",
        });
      }

      userLeaveStartYear.leaveBalance -= leave.noOfDays;
      userLeaveStartYear.takenLeaves += leave.noOfDays;
      await userLeaveStartYear.save();
    } else {
      const endOfStartYear = new Date(startYear, 11, 31);
      const startOfEndYear = new Date(endYear, 0, 1);

      daysInStartYear = calculateDays(startDate, endOfStartYear);
      daysInEndYear = calculateDays(startOfEndYear, endDate);

      userLeaveStartYear = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: startYear
        }
      });

      userLeaveEndYear = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: endYear
        }
      });

      if (!userLeaveStartYear || !userLeaveEndYear) {
        return res.send('User leave record not found for one or both years');
      }

      if (userLeaveStartYear.leaveBalance < daysInStartYear || userLeaveEndYear.leaveBalance < daysInEndYear) {
        return res.json({
          message: 'Insufficient leave balance for one or both years',
          openNoteDialog: true,
          lowLeaveMessage: "Insufficient leave balance",
        });
      }

      userLeaveStartYear.leaveBalance -= daysInStartYear;
      userLeaveStartYear.takenLeaves += daysInStartYear;
      await userLeaveStartYear.save();

      userLeaveEndYear.leaveBalance -= daysInEndYear;
      userLeaveEndYear.takenLeaves += daysInEndYear;
      await userLeaveEndYear.save();
    }

    // Approve the leave
    leave.status = 'Approved';
    leave.adminNotes = adminNotes;
    await leave.save();

    // Send notification and email
    const id = userId;
    const me = `${leave.user.name}'s Leave Request Approved by ${req.user.name}`;
    const route = `/login/leave`;

    createNotification({ id, me, route });

    const emailSubject = `Leave Request is Approved`;
    const fromEmail = config.email.userAddUser;
    const emailPassword = config.email.userAddPass;
    const html = `
      <p>Dear ${leave.user.name},</p>
      <p>This is to inform you that ${req.user.name} has approved your ${leaveType.leaveTypeName},</p>
      <p>with note ${adminNotes}.</p>
      <p>Please review the leave application at your earliest convenience.</p>
      <p>If you have any questions or need further details, feel free to reach out.</p>
    `;
    const attachments = [];
    const token = req.headers.authorization?.split(' ')[1];
    try {
      await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject, html, attachments, ccRecipients);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// --------------------------------------------------------------REJECT--------------------------------------------------------------
router.put('/rejectLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body;

  try {
    const leave = await Leave.findByPk(leaveId, {include: [
      {model: User, attributes: ['name'], as: 'user'}, {model: LeaveType, attributes: ['leaveTypeName'], as: 'leaveType'}
    ]});
    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }

    if (leave.status === 'Approved' || leave.status === 'AdminApproved') {
      const ul = await UserLeave.findOne({ where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId } });
      if (ul) {
        ul.leaveBalance += leave.noOfDays;
        ul.takenLeaves -= leave.noOfDays;
        await ul.save();
      }
    }
    leave.status = 'Rejected';
    leave.adminNotes = adminNotes;
    await leave.save();

    let id = leave.userId;
    const userPos = await UserPosition.findOne({ 
      where: { userId: id }, 
      include: [{ model: User, attributes: ['name']}
    ]})
    const me = `${leave.user.name} Leave Request Rejected by ${req.user.name}`;
    const route = `/login/leave/open/${leave.id}`;

    createNotification({ id, me, route });

    const hrId = getHRId()
    if(Number.isInteger(hrId)){
      let id = hrId;
      createNotification({ id, me, route });
    }

    const rmId = getRMId(leave.userId)
    if(Number.isInteger(hrId)){
      let id = rmId;
      createNotification({ id, me, route });
    }

    const hrEmail = await getHREmail().mail
    const rmEmail = (await getReportingManagerEmailForUser(leave.userId)).email
    const teamLeads = await getTeamLeadEmails(leave.userId);
    const omMail = await getOMEmail();
    const ccRecipients = [ hrEmail, rmEmail, teamLeads, omMail ].filter(email => email); 
    const emailSubject = `Leave Request is Rejected`;
    const fromEmail = config.email.userAddUser;
    const emailPassword = config.email.userAddPass;
    const html = `
      <p>Dear ${leave.user.name},</p>
      <p>This is to inform you that ${req.user.name} has rejected your ${leave.leaveType.leaveTypeName},</p>
      <p>with notes ${adminNotes}.</p>
      <p>Please review the leave application at your earliest convenience.</p>
      <p>If you have any questions or need further details, feel free to reach out.</p>
    `;
    const attachments = []
    const token = req.headers.authorization?.split(' ')[1];
    try {
      await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject , html, attachments, ccRecipients);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    res.send({ message: 'Leave rejected successfully', leave });
  } catch (error) {
    res.send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});

// ------------------------------------------------------FOR RM-----------------------------------------------------------------------
router.get('/findbyrm/:reportingManagerId', async (req, res) => {
  try {
      const { reportingManagerId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const limit = parseInt(pageSize, 10);
      const offset = (parseInt(page, 10) - 1) * limit;
      const leaves = await Leave.findAll({
          limit,
          offset,
          include: [
              {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name'],
                  required: true, // Ensure only leaves with users are included
                  include: [
                      {
                          model: UserPersonal,
                          as: 'userpersonal',
                          attributes: ['id', 'reportingMangerId'],
                          required: true, // Ensure only userPersonal entries that match are included
                          where: { reportingMangerId: parseInt(reportingManagerId, 10) },
                      },
                  ],
              },
              {
                model: LeaveType, attributes: ['leaveTypeName']
              }
          ],
          where: {status: 'Requested'}
      });
      let totalCount;
      totalCount = await Leave.count({
        limit,
        offset,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name'],
                required: true, // Ensure only leaves with users are included
                include: [
                    {
                        model: UserPersonal,
                        as: 'userpersonal',
                        attributes: ['id', 'reportingMangerId'],
                        required: true, // Ensure only userPersonal entries that match are included
                        where: { reportingMangerId: parseInt(reportingManagerId, 10) },
                    },
                ],
            },
        ],          
        where: {status: 'Requested'}
      });
      
      const response = {
        count: totalCount,
        items: leaves,
      };
      res.json(response);
  } catch (error) {
      res.send(error.message);
  }
});

// --------------------------------------------------------REPORT----------------------------------------------------------------
router.get('/all/report', async (req, res) => {
  try {
    const { year, pageSize, page, search } = req.query;

    if (!year) {
      return res.json({ error: 'Year is required for fetching reports.' });
    }

    if (pageSize != 'undefined' && page != 'undefined') {
      limit = pageSize;
      offset = (page - 1) * pageSize;
    }

    // Fetch all leave data for the given year
    const leaves = await Leave.findAll({
      where: {
        status: {
          [Op.or]: ['Approved', 'AdminApproved'],
        },
        startDate: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lt]: new Date(`${+year + 1}-01-01`), // Year range filter
        },
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'url'] },
        { model: LeaveType, attributes: ['id', 'leaveTypeName'], as: 'leaveType' },
      ],
    });

    // Group leave data by employees
    const employeeData = {};
    leaves.forEach((leave) => {
      const userId = leave.userId;
      const leaveTypeName = leave.leaveType?.leaveTypeName || 'Unknown Leave';
      const leaveDates = leave.leaveDates || [];

      // Initialize employee if not present
      if (!employeeData[userId]) {
        employeeData[userId] = {
          id: userId,
          name: leave.user.name,
          url: leave.user.url,
          leaveDetails: {},
        };  
      }
      // Initialize leave type if not present
      if (!employeeData[userId].leaveDetails[leaveTypeName]) {
        employeeData[userId].leaveDetails[leaveTypeName] = {
          type: leaveTypeName,
          monthlyData: Array(12).fill(0), // Initialize 12 months
          total: 0,
        };
      }

      // Calculate leave days and group by month
      leaveDates.forEach((date) => {
        const leaveDate = new Date(date.date);
        if (leaveDate.getFullYear() === parseInt(year, 10)) {
          const monthIndex = leaveDate.getMonth(); // 0 = January, 11 = December
          const leaveForDay = date.session1 && date.session2 ? 1 : date.session1 || date.session2 ? 0.5 : 0;

          // Update monthly data and total
          employeeData[userId].leaveDetails[leaveTypeName].monthlyData[monthIndex] += leaveForDay;
          employeeData[userId].leaveDetails[leaveTypeName].total += leaveForDay;
        }
      });
    });

    // Convert leaveDetails object to an array
    let result = Object.values(employeeData).map((employee) => ({
      ...employee,
      leaveDetails: Object.values(employee.leaveDetails),
    }));

    if (search && search !== 'undefined') {
      const searchTerm = search.replace(/\s+/g, '').trim().toLowerCase();
      result = result.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm)
      );
    }

    if (search && search !== 'undefined') {
      const searchTerm = search.replace(/\s+/g, '').trim().toLowerCase();
      result = result.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm)
      );
    }

    const total = result.length;
    const paginatedResult = result.slice(offset, offset + limit);

    // Send the response
    res.status(200).json({result: paginatedResult,  total: total});
  } catch (error) {
    res.send(error.message);
  }
});

// ---------------------------------------------------------------LEAVE BALNCE--------------------------------------------------
router.get('/leaveBalance/:leaveId', authenticateToken, async (req, res) => {
  const leaveId = req.params.leaveId;

  try {
    // Fetch the leave request
    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.send( 'Leave request not found' );
    }

    // Fetch the leave type
    const leaveType = await LeaveType.findByPk(leave.leaveTypeId);

    if (!leaveType) {
      return res.send('Leave type not found' );
    }

    // Handle LOP (Leave Without Pay) scenario
    if (leaveType.leaveTypeName === 'LOP') {
      return res.json({
        isSufficient: true,
        leaveType: 'LOP',
        message: 'LOP leave does not require leave balance check.',
      });
    }

    // Fetch user leave balance
    const userLeave = await UserLeave.findOne({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId,
      },
    });

    if (!userLeave) {
      return res.json({
        isSufficient: false,
        leaveType: leaveType.leaveTypeName,
        message: 'No leave balance record found for this leave type.',
      });
    }
    
    // Check if leave balance is sufficient
    const isSufficient = userLeave.leaveBalance >= leave.noOfDays;
    res.json({
      isSufficient,
      leaveType: leaveType.leaveTypeName,
      leaveBalance: userLeave.leaveBalance,
      requiredDays: leave.noOfDays,
      message: isSufficient
        ? 'Leave balance is sufficient.'
        : 'Insufficient leave balance.',
    });
  } catch (error) {
    res.send(error.message);
  }
});
module.exports = router;