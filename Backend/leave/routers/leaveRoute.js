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
  
// router.get('/approveLeave/:id', async (req, res) => {
//   const leaveId = req.params.id;
//   try {

//     const leave = await Leave.findByPk(leaveId);
//     const userId = leave.userId
//     if (!leave) {
//       return res.send({ message: 'Leave request not found' });
//     }

//     leave.status = 'Approved';
//     await leave.save();

//   const id = userId;
//   const me = `Leave Request Approved with id ${leave.id}`;
//   const route = `/login/leave`;

//   createNotification({ id, me, route });

//   res.send(`
//         <html>
//           <body>
//             <script>
//               alert('Leave Approved: The leave has been approved successfully.');
//               window.close(); // Optional: close the tab after showing the alert
//             </script>
//           </body>
//         </html>
//       `);
//   } catch (error) {
//     res.send(`<h1>Error</h1><p>${error.message}</p>`);
//   }
// });

router.get('/rejectLeave/:id', async (req, res) => {
  const leaveId = req.params.id;
  try {
    const leave = await Leave.findByPk(leaveId);
    const userId = leave.userId;

    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }


    leave.status = 'Rejected';
    await leave.save();

    const id = userId;
    const me = `Leave Request Rejected with id ${leave.id}`;
    const route = `/login/leave`;

    createNotification({ id, me, route });
    res.send(`
          <html>
            <body>
              <script>
                alert('Leave Rejected: The leave has been rejected successfully.');
                window.close(); // Optional: close the tab after showing the alert
              </script>
            </body>
          </html>
        `);
  } catch (error) {
    res.send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

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

// function calculateLeaveDays(leaveDates) {
//   let totalDays = 0;

//   // Ensure leaveDates is an array
//   if (!Array.isArray(leaveDates)) {
//     return totalDays;
//   }

//   // Iterate through each date object
//   leaveDates.forEach(date => {
//     // Check if session1 and session2 properties exist
//     if (date.session1 !== undefined && date.session2 !== undefined) {
//       if (date.session1 && date.session2) {
//         totalDays += 1; // Full day leave
//       } else if (date.session1 || date.session2) {
//         totalDays += 0.5; // Half day leave
//       }
//     }
//   });

//   return totalDays;
// }

router.post('/emergencyLeave', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;

    // Validate required fields
    if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
      await transaction.rollback();
      return res.status(400).send('Missing required fields');
    }

    // Fetch leave type within transaction
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId }, transaction });
    if (!leaveType) {
      await transaction.rollback();
      return res.status(404).send('Leave type not found');
    }

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
        totalLopDays += calculateDays(dateObj);
        continue;
      }

      // Calculate required days for current date
      const requiredDays = calculateDays(dateObj);
      let remainingDays = requiredDays;

      // Allocate to balance if possible
      if (balance >= remainingDays) {
        balanceDates.push(dateObj);
        userLeaves.get(dateYear).balance -= remainingDays;
        totalBalanceDays += remainingDays;
      } else {
        // Split sessions between balance and LOP
        const { balancePart, lopPart } = splitSessions(dateObj, balance);
        
        if (balancePart) {
          balanceDates.push(balancePart);
          totalBalanceDays += calculateDays(balancePart);
          userLeaves.get(dateYear).balance -= calculateDays(balancePart);
        }
        
        if (lopPart) {
          lopDates.push(lopPart);
          totalLopDays += calculateDays(lopPart);
        }
      }
    }

    // Update UserLeave records
    for (const [year, { instance, balance }] of userLeaves) {
      if (instance) {
        instance.leaveBalance = balance;
        instance.takenLeaves += (instance.leaveBalance - balance);
        await instance.save({ transaction });
      } else if (balance < 0) {
        await UserLeave.create({
          userId,
          leaveTypeId,
          year,
          leaveBalance: balance,
          takenLeaves: -balance,
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
      const lopLeave = await createLeaveRecord({
        userId,
        leaveTypeId: lopLeaveType.id,
        dates: lopDates,
        notes: `${notes} (Excess converted to LOP)`,
        fileUrl,
        status,
        transaction,
      });
      leaves.push(lopLeave);
    }

    // Send notifications and emails
    await handleNotificationsAndEmails(req, res, leaves, transaction);

    await transaction.commit();
    res.json({ leaves });
  } catch (error) {
    await transaction.rollback();
    res.status(500).send(error.message);
  }
});

async function handleNotificationsAndEmails(req, res, leaves, transaction) {
  const userPos = await UserPosition.findOne({
    where: { userId: req.body.userId },
    include: [{ model: User, attributes: ['name'] }],
    transaction,
  });
  console.log(userPos);
  
  if (!userPos) return;
  for (const leave of leaves) {
    const lt = await LeaveType.findByPk(leave.leaveTypeId, { transaction });
    createNotification({
      id: req.body.userId,
      me: `Leave Request Submission`,
      route: `/login/leave/${leave.id}`
    });

    const emailHtml = `
    <p>Dear ${userPos.user.name},</p>
    <p>Your leave request has been submitted:</p>
    <ul>
      <li>Type: ${lt.leaveTypeName}</li>
      <li>Dates: ${leave.startDate} to ${leave.endDate}</li>
      <li>Days: ${leave.noOfDays}</li>
      <li>Status: ${leave.status}</li>
    </ul>
  `;
  try {
    await sendEmail(
      req.headers.authorization?.split(' ')[1],
      config.email.userAddUser,
      config.email.userAddPass,
      userPos.officialMailId,
      `Leave Application - ${lt.leaveTypeName}`,
      emailHtml,
      []
    );
  } catch (emailError) {
    console.error('Email error:', emailError);
  }
  }
}

// Helper functions
function calculateDays(dateObj) {
  return (dateObj.session1 ? 0.5 : 0) + (dateObj.session2 ? 0.5 : 0);
}

function splitSessions(dateObj, availableBalance) {
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

router.post('/employeeLeave', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;

    // Fetch email credentials if not provided
    // if (!fromEmail || !appPassword) {
    //   const email = await UserEmail.findOne({ where: { userId: userId, type: 'Official' } });
    //   if (email) {
    //     fromEmail = email.email;
    //     appPassword = email.appPassword;
    //   } else {
    //     await transaction.rollback();
    //     return res.json({ message: 'No email credentials found' });
    //   }
    // }

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
      
      await handleNotificationsAndEmails(req, res, [lopLeave], transaction);
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
    await handleNotificationsAndEmails(req, res, leaves, transaction);

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
// router.post('/employeeLeave', authenticateToken, async (req, res) => {
//   let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status, fromEmail, appPassword } = req.body;

//   // Validate email credentials
//   if (!fromEmail || !appPassword) {
//     const email = await UserEmail.findOne({
//       where: { userId: userId, type: 'Official' }
//     });
//     if (email) {
//       fromEmail = email.email;
//       appPassword = email.appPassword;
//     } else {
//       return res.json({ message: 'No email credentials found for the user' });
//     }
//   }

//   // Validate required fields
//   if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
//     return res.json({ message: 'Missing required fields' });
//   }

//   // Validate user exists
//   const user = await User.findByPk(userId);
//   if (!user) return res.json({ message: 'User not found' });

//   try {
//     // Validate leave type
//     const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
//     if (!leaveType) return res.json({ message: 'Leave type not found' });

//     // Group leave dates by year
//     const leaveDatesByYear = leaveDates.reduce((acc, dateObj) => {
//       const year = dateObj.date ? new Date(dateObj.date).getFullYear() : null;
//       if (year) {
//         acc[year] = acc[year] || [];
//         acc[year].push(dateObj);
//       }
//       return acc;
//     }, {});
//     console.log(leaveDatesByYear);
    
//     let totalNoOfDays = 0;
//     let appliedLeaveDates = [];
//     let lopDates = [];

//     // Process leave dates for each year
//     for (const year of Object.keys(leaveDatesByYear)) {
//       const noOfDays = calculateLeaveDays(leaveDatesByYear[year]);
//       totalNoOfDays += noOfDays;
//       console.log(noOfDays);
      
//       // Find or create UserLeave record for the year
//       let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId, year } });
//       console.log(userLeave);
      
//       if (!userLeave) {
//         userLeave = await UserLeave.create({ 
//           userId, 
//           leaveTypeId, 
//           leaveBalance: leaveType.defaultDays || 0, // Use default days from leave type
//           takenLeaves: 0, 
//           year 
//         });
//       }

//       // Handle LOP and regular leaves differently
//       if (leaveType.leaveTypeName !== 'LOP') {
//         if (userLeave.leaveBalance < noOfDays) {
//           return res.json({ 
//             message: `Insufficient leave balance for ${year}` 
//           });
//         }

//         // Update leave balances
//         userLeave.leaveBalance -= noOfDays;
//         userLeave.takenLeaves += noOfDays;
//         await userLeave.save();

//         appliedLeaveDates = [...appliedLeaveDates, ...leaveDatesByYear[year]];
//       } else {
//         // Handle LOP leaves
//         const availableBalance = userLeave.leaveBalance;
//         const leaveSplit = splitLeaveDates(leaveDatesByYear[year], availableBalance);
        
//         appliedLeaveDates = [...appliedLeaveDates, ...leaveSplit.leaveDatesApplied];
//         lopDates = [...lopDates, ...(leaveSplit.lopDates || [])];
//       }
//     }

//     // Create leave record
//     const leave = await Leave.create({
//       userId,
//       leaveTypeId: leaveType.id,
//       startDate,
//       endDate,
//       noOfDays: totalNoOfDays,
//       notes,
//       fileUrl,
//       status: status || 'Pending',
//       leaveDates: appliedLeaveDates
//     });

//     // Notify HR and Reporting Manager
//     const [hrAdmin, userPersonal] = await Promise.all([
//       User.findOne({
//         include: [{ model: Role, where: { roleName: 'HR Administrator' } }]
//       }),
//       UserPersonal.findOne({ 
//         where: { userId }, 
//         attributes: ['reportingMangerId', 'officialMailId'] 
//       })
//     ]);

//     const notificationPromises = [];
//     if (hrAdmin) {
//       notificationPromises.push(
//         Notification.create({
//           userId: hrAdmin.id,
//           message: `Leave request submitted by ${user.name}`,
//           isRead: false
//         })
//       );
//     }

//     if (userPersonal?.reportingMangerId) {
//       notificationPromises.push(
//         Notification.create({
//           userId: userPersonal.reportingMangerId,
//           message: `Leave request submitted by ${user.name}`,
//           isRead: false
//         })
//       );
//     }

//     await Promise.all(notificationPromises);

//     // Send confirmation email
//     if (userPersonal?.officialMailId) {
//       const emailSubject = `Leave Request Submission`;
//       const html = `
//         <p>Dear ${user.name},</p>
//         <p>Your leave request has been submitted:</p>
//         <ul>
//           <li>Type: ${leaveType.leaveTypeName}</li>
//           <li>Dates: ${startDate} to ${endDate}</li>
//           <li>Days: ${totalNoOfDays}</li>
//           <li>Status: ${leave.status}</li>
//         </ul>
//       `;

//       try {
//         await sendEmail(
//           req.headers.authorization?.split(' ')[1],
//           fromEmail,
//           appPassword,
//           userPersonal.officialMailId,
//           emailSubject,
//           html,
//           []
//         );
//       } catch (emailError) {
//         console.error('Failed to send leave email:', emailError);
//       }
//     }

//     return res.json({
//       message: 'Leave request submitted successfully',
//       leaveId: leave.id,
//       appliedDays: appliedLeaveDates,
//       lopDays: lopDates
//     });

//   } catch (error) {
//     console.error('Error in leave request submission:', error);
//     return res.status(500).json({ 
//       message: 'Error processing leave request',
//       error: error.message
//     });
//   }
// });

// router.post('/employeeLeave', authenticateToken, async (req, res) => {
//   let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status, fromEmail, appPassword } = req.body;

//   if (!fromEmail || !appPassword) {
//     const email = await UserEmail.findOne({
//       where: { userId: userId, type: 'Official' }
//     });
//     if (email) {
//       fromEmail = email.email;
//       appPassword = email.appPassword;
//     } else {
//       return res.json({ message: 'No email credentials found for the user' });
//     }
//   }

//   if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
//     return res.json({ message: 'Missing required fields' });
//   }

//   const user = await User.findByPk(userId);
//   if (!user) return res.json({ message: 'User not found' });

//   try {
//     const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
//     if (!leaveType) return res.json({ message: 'Leave type not found' });

//     const leaveDatesByYear = leaveDates.reduce((acc, dateObj) => {
//       const year = dateObj.date ? new Date(dateObj.date).getFullYear() : null;
//       if (year) {
//         acc[year] = acc[year] || [];
//         acc[year].push(dateObj);
//       }
//       return acc;
//     }, {});

//     let totalNoOfDays = 0;
//     let appliedLeaveDates = [];
//     let lopDates = [];

//     for (const year of Object.keys(leaveDatesByYear)) {
//       const noOfDays = calculateLeaveDays(leaveDatesByYear[year]);
//       totalNoOfDays += noOfDays;

//       let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId, year } });

//       if (!userLeave) {
//         userLeave = await UserLeave.create({ userId, leaveTypeId, leaveBalance: 1, takenLeaves: 0, year });
//       }

//       if (leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays) {
//         return res.json({ message: `Exceeds available leave balance for ${year}` });
//       }

//       if (leaveType.leaveTypeName !== 'LOP') {
//         const availableLeaveDays = Math.min(userLeave.leaveBalance, noOfDays);
//         const leaveSplit = splitLeaveDates(leaveDatesByYear[year], availableLeaveDays);

//         appliedLeaveDates = [...appliedLeaveDates, ...leaveSplit.leaveDatesApplied];
//         lopDates = [...lopDates, ...(leaveSplit.lopDates || [])];

//         userLeave.leaveBalance -= availableLeaveDays;
//         userLeave.takenLeaves += availableLeaveDays;
//         await userLeave.save();
//       } else {
//         appliedLeaveDates = [...appliedLeaveDates, ...leaveDatesByYear[year]];
//       }
//     }

//     const leave = await Leave.create({
//       userId,
//       leaveTypeId: leaveType.id,
//       startDate,
//       endDate,
//       noOfDays: totalNoOfDays,
//       notes,
//       fileUrl,
//       status,
//       leaveDates: appliedLeaveDates
//     });

//     // Fetch Reporting Manager and HR Admin
//     const hrAdmin = await User.findOne({
//       include: [{ model: Role, where: { roleName: 'HR Administrator' } }]
//     });

//     const userPersonal = await UserPersonal.findOne({ where: { userId }, attributes: ['reportingMangerId'] });

//     if (hrAdmin) {
//       await Notification.create({ userId: hrAdmin.id, message: `Leave request submitted by ${user.name}`, isRead: false });
//     }

//     if (userPersonal?.reportingMangerId) {
//       await Notification.create({ userId: userPersonal.reportingMangerId, message: `Leave request submitted by ${user.name}`, isRead: false });
//     }

//     // Send Email Notification
//     if (userPersonal?.officialMailId) {
//       const emailSubject = `Leave Request Submission`;
//       const html = `
//         <p>Dear ${user.name},</p>
//         <p>Your leave request for ${leaveType.leaveTypeName} has been submitted.</p>
//         <p>Start Date: ${startDate}, End Date: ${endDate}</p>
//         <p>Number of Days: ${totalNoOfDays}</p>
//       `;

//       try {
//         await sendEmail(req.headers.authorization?.split(' ')[1], fromEmail, appPassword, userPersonal.officialMailId, emailSubject, html, []);
//       } catch (emailError) {
//         console.error('Email sending failed:', emailError);
//       }
//     }

//     return res.json({
//       message: `Leave request submitted successfully.`,
//       leaveDatesApplied: appliedLeaveDates,
//       lopDates
//     });

//   } catch (error) {
//     console.error('Error in leave request submission:', error);
//     return res.json({ message: error.message });
//   }
// });

// router.post('/employeeLeave', authenticateToken, async (req, res) => {
//   let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status, fromEmail, appPassword } = req.body;

//   if (!fromEmail || !appPassword) {
//     const email = await UserEmail.findOne({
//       where: { userId: userId, type: 'Official' }
//     });
//     if (email) {
//       fromEmail = email.email;
//       appPassword = email.appPassword;
//     } else {
//       return res.json({ message: 'No email credentials found for the user' });
//     }
//   }

//   if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
//     return res.json({ message: 'Missing required fields' });
//   }

//   const user = await User.findByPk(userId);
//   if (!user) return res.json({ message: 'User not found' });
//   try {
//     const noOfDays = calculateLeaveDays(leaveDates);

//     const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
//     if (!leaveType) return res.json({ message: 'Leave type not found' });

//     const leaveDatesByYear = leaveDates.reduce((acc, dateObj) => {
//       const year = dateObj.date ? new Date(dateObj.date).getFullYear() : null;
//       if (year) {
//         acc[year] = acc[year] || [];
//         acc[year].push(dateObj);
//       }
//       return acc;
//     }, {});
//     console.log(leaveDatesByYear);
//     let totalNoOfDays = 0;
//     let appliedLeaveDates = [];
//     let lopDates = [];
//     for (const year of Object.keys(leaveDatesByYear)) {
//       const noOfDays = calculateLeaveDays(leaveDatesByYear[year]);
//       totalNoOfDays += noOfDays;

//       let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId, year } });
//       console.log(userLeave);
      
//       if (!userLeave) {
//         userLeave = await UserLeave.create({ userId, leaveTypeId, leaveBalance: 0, year, takenLeaves: 0 });
//       }

//       if (leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays) {
//         return res.json({ message: `Exceeds available leave balance for ${year}` });
//       }

//       if (leaveType.leaveTypeName !== 'LOP') {
//         const availableLeaveDays = Math.min(userLeave.leaveBalance, noOfDays);
//         const leaveSplit = splitLeaveDates(leaveDatesByYear[year], availableLeaveDays);

//         appliedLeaveDates = [...appliedLeaveDates, ...leaveSplit.leaveDatesApplied];
//         lopDates = [...lopDates, ...(leaveSplit.lopDates || [])];

//         userLeave.leaveBalance -= availableLeaveDays;
//         userLeave.takenLeaves += availableLeaveDays;
//         await userLeave.save();
//       } else {
//         appliedLeaveDates = [...appliedLeaveDates, ...leaveDatesByYear[year]];
//       }
//     }

//     const leave = await Leave.create({
//       userId,
//       leaveTypeId: leaveType.id,
//       startDate,
//       endDate,
//       noOfDays: totalNoOfDays,
//       notes,
//       fileUrl,
//       status,
//       leaveDates: appliedLeaveDates
//     });

//     // Fetch Reporting Manager and HR Admin
//     const hrAdmin = await User.findOne({
//       include: [{ model: Role, where: { roleName: 'HR Administrator' } }]
//     });

//     const userPersonal = await UserPersonal.findOne({ where: { userId }, attributes: ['reportingMangerId'] });

//     if (hrAdmin) {
//       await Notification.create({ userId: hrAdmin.id, message: `Leave request submitted by ${user.name}`, isRead: false });
//     }

//     if (userPersonal?.reportingMangerId) {
//       await Notification.create({ userId: userPersonal.reportingMangerId, message: `Leave request submitted by ${user.name}`, isRead: false });
//     }

//     // Send Email Notification
//     if (userPersonal?.officialMailId) {
//       const emailSubject = `Leave Request Submission`;
//       const html = `
//         <p>Dear ${user.name},</p>
//         <p>Your leave request for ${leaveType.leaveTypeName} has been submitted.</p>
//         <p>Start Date: ${startDate}, End Date: ${endDate}</p>
//         <p>Number of Days: ${totalNoOfDays}</p>
//       `;

//       try {
//         await sendEmail(req.headers.authorization?.split(' ')[1], fromEmail, appPassword, userPersonal.officialMailId, emailSubject, html, []);
//       } catch (emailError) {
//         console.error('Email sending failed:', emailError);
//       }
//     }

//     return res.json({
//       message: `Leave request submitted successfully.`,
//       leaveDatesApplied: appliedLeaveDates,
//       lopDates
//     });

//   } catch (error) {
//     console.error('Error in leave request submission:', error);
//     return res.json({ message: error.message });
//   }
// });

    // Handle LOP leave type
    // if (leaveType.leaveTypeName === 'LOP') {
    //   const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
    //   if (!emailResult.success) {
    //     return res.json({ message: emailResult.message });
    //   }

    //   await Leave.create({
    //     userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl,
    //     status: status, leaveDates
    //   });

    //   // Fetch HR Admin and Reporting Manager details      
    //   const hrAdmin = await User.findOne({
    //     include: [
    //       {
    //         model: Role,
    //         where: { roleName: 'HR Administrator' }
    //       },
    //     ],
    //   });

    //   const userPersonal = await UserPersonal.findOne({
    //     where: { userId },
    //     attributes: ['reportingMangerId'],
    //   });

    //   if (hrAdmin) {
    //     await Notification.create({
    //       userId: hrAdmin.id,
    //       message: `LOP leave request submitted by ${user.name}`,
    //       isRead: false,
    //     });
    //   }

    //   if (userPersonal?.reportingMangerId) {
    //     await Notification.create({
    //       userId: userPersonal.reportingMangerId,
    //       message: `LOP leave request submitted by ${user.name}`,
    //       isRead: false,
    //     });
    //   }

    //   return res.json({
    //     message: `LOP leave request submitted successfully.`,
    //     leaveDatesApplied: leaveDates,
    //     lopDates: leaveDates
    //   });
    // }

    // const currentYear = new Date().getFullYear();
    // const userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId, year: currentMonthLopDays } });
    // // If no userLeave entry exists, create a new one with a balance of 0
    // if (!userLeave) {
    //   userLeave = await UserLeave.create({
    //     userId,
    //     leaveTypeId: leaveType.id,
    //     leaveBalance: 0,
    //     year: currentYear
    //   });
    // }
    // let leaveBalance = userLeave.leaveBalance;

    // if (leaveBalance === 0) {
    //   return res.json({
    //     message: `Your ${leaveType.leaveTypeName} balance is 0. No leave will be applied.`,
    //   });
    // }

    // if (leaveBalance < noOfDays) {
    //   const availableLeaveDays = leaveBalance;
    //   const lopDays = noOfDays - availableLeaveDays;
    //   const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

    //   const updatedStartDate = leaveDatesApplied[0].date;
    //   const updatedEndDate = leaveDatesApplied[leaveDatesApplied.length - 1].date;

    //   const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
    //   if (!emailResult.success) {
    //     return res.json({ message: emailResult.message });
    //   }
      
    //   await Leave.create({
    //     userId, leaveTypeId: leaveType.id, startDate: updatedStartDate, endDate: updatedEndDate, noOfDays: availableLeaveDays, notes, fileUrl,
    //     status: 'Requested', leaveDates: leaveDatesApplied
    //   });

    //   // Fetch HR Admin and Reporting Manager details      
    //   const hrAdmin = await User.findOne({
    //     include: [
    //       {
    //         model: Role,
    //         where: { roleName: 'HR Administrator' }
    //       },
    //     ],
    //   });
    //   const userPersonal = await UserPersonal.findOne({
    //     where: { userId },
    //     attributes: ['reportingMangerId'],
    //   });

    //   if (hrAdmin) {
    //     await Notification.create({
    //       userId: hrAdmin.id,
    //       message: `Leave request submitted by ${user.name}`,
    //       isRead: false,
    //     });
    //   }

    //   if (userPersonal?.reportingMangerId) {
    //     await Notification.create({
    //       userId: userPersonal.reportingMangerId,
    //       message: `Leave request submitted by ${user.name}`,
    //       isRead: false,
    //     });
    //   }

    //   return res.json({
    //     message: `${availableLeaveDays} days applied as ${leaveType.leaveTypeName}.
    //     ${lopDays} days are beyond balance; apply for LOP separately.`,
    //     leaveDatesApplied,
    //     lopDates: lopDates || []
    //   });
    // }

    // const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
    // if (!emailResult.success) {
    //   return res.json({ message: emailResult.message });
    // }

    // const hrAdmin = await User.findOne({
    //   include: [
    //     {
    //       model: Role,
    //       where: { roleName: 'HR Administrator' }
    //     },
    //   ],
    // });
    
    // const userPersonal = await UserPersonal.findOne({
    //   where: { userId },
    //   attributes: ['reportingMangerId'],
    // });
    
    // // if (!userPersonal || !userPersonal?.reportingMangerId) {
    // //     return res.send(`Reporting manager for user ${user.name} not added`);
    // // }
    
    // // Create notifications for HR Admin and Reporting Manager
    // if (hrAdmin) {
    //   await Notification.create({
    //     userId: hrAdmin.id,
    //     message: `Leave request submitted by ${user.name}`,
    //     isRead: false,
    //   });
    // }

    // if (userPersonal?.reportingMangerId) {
    //   await Notification.create({
    //     userId: userPersonal.reportingMangerId,
    //     message: `Leave request submitted by ${user.name}`,
    //     isRead: false,
    //   });
    // }

    // await Leave.create({
    //   userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl,
    //   status: status, leaveDates
    // });

    // return res.json({
    //   message: `Leave request submitted successfully as ${leaveType.leaveTypeName}.`,
    //   leaveDatesApplied: leaveDates,
    //   lopDates: leaveDates
    // });
//   } catch (error) {
//     console.error('Error in leave request submission:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

function splitLeaveDates(leaveDates, availableLeaveDays) {
  let leaveDatesApplied = [];
  let lopDates = [];
  let appliedDays = 0;

  for (let date of leaveDates) {
    let daysForDate = 0;
    if (date.session1) daysForDate += 0.5;
    if (date.session2) daysForDate += 0.5;
    if (appliedDays + daysForDate <= availableLeaveDays) {
      leaveDatesApplied.push(date);
      appliedDays += daysForDate;
    } else {
      let remainingDays = daysForDate - (availableLeaveDays - appliedDays);
      if (availableLeaveDays - appliedDays > 0) {
        if (date.session1 && availableLeaveDays - appliedDays >= 0.5) {
          leaveDatesApplied.push({ date: date.date, session1: true, session2: false });
          appliedDays += 0.5;
        } else if (date.session2 && availableLeaveDays - appliedDays >= 0.5) {
          leaveDatesApplied.push({ date: date.date, session1: false, session2: true });
          appliedDays += 0.5;
        }
      }
      if (remainingDays > 0) {
        lopDates.push({ date: date.date, session1: date.session1, session2: date.session2 });
      }
    }
  }
  return { leaveDatesApplied, lopDates };
}

async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, token) {
  let hrAdminEmail;
  let reportingManagerEmail;
  
  try {
    hrAdminEmail = await getHREmail();
    reportingManagerEmail = await getReportingManagerEmailForUser(user.id);
  } catch (error) {
    return { success: false, message: error.message };
  }

  if (!Array.isArray(leaveDates)) {
    return { success: false, message: 'leaveDates must be an array' };
  }

  if (!hrAdminEmail || !reportingManagerEmail) {
    return { success: false, message: 'Missing email(s)' };
  }

  const startDateObject = new Date(startDate);
  const endDateObject = new Date(endDate);

  const formattedStartDate = startDateObject.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedEndDate = endDateObject.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const html = `
    <p>A new leave request has been submitted:</p>
    <p>Username: ${user.name}</p>
    <p>Leave Type: ${leaveType.leaveTypeName}</p>
    <p>Start Date: ${formattedStartDate}</p>
    <p>End Date: ${formattedEndDate}</p>
    <p>Notes: ${notes}</p>
    <p>Number of Days: ${noOfDays}</p>
    <p>Leave Dates: ${leaveDates.map(item => {
        const sessionString = [
          item.session1 ? 'session1' : '',
          item.session2 ? 'session2' : ''
        ].filter(Boolean).join(', ');
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}</p>
  `;

  const emailSubject = 'New Leave Request Submitted';
  try {
    await sendEmail(token, fromEmail, appPassword, hrAdminEmail, emailSubject, html, [], reportingManagerEmail);
    return { success: true, message: 'Email sent successfully' };
  } catch (emailError) {
    return { success: false, message: emailError.response };
  }
}

async function sendLeaveUpdateEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword) {
  let hrAdminEmail;
  let reportingManagerEmail;

  try {
    email = await getHREmail();
    ccEmail = await getReportingManagerEmailForUser(user.id);
  } catch (error) {
    return;
  }
  if (!Array.isArray(leaveDates)) {
    throw new Error('leaveDates must be an array');
  }

  if (!hrAdminEmail || !reportingManagerEmail) {
    return;
  }
  const startDateObject = new Date(startDate);
  const endDateObject = new Date(endDate);

  const formattedStartDate = startDateObject.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedEndDate = endDateObject.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const html =  `
    <p>A leave request has been updated:</p>
    <p>Username: ${user.name}</p>
    <p>Leave Type: ${leaveType.leaveTypeName}</p>
    <p> Start Date: ${formattedStartDate}</p>
    <p>End Date: ${formattedEndDate}</p>
    <p> Notes: ${notes}</p>
    <p>Number of Days: ${noOfDays}</p>
    <p>Leave Dates: ${leaveDates.map(item => {
        const sessionString = [
          item.session1 ? 'session1' : '',
          item.session2 ? 'session2' : ''
        ].filter(Boolean).join(', ');
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}</p>
  `
  const emailSubject = 'Leave Request Updated'
  const attachments = 
    {
      filename: file.originalname,
      path: file.path,  
    }
  
    const token = req.headers.authorization?.split(' ')[1];
  try {
    await sendEmail(token, fromEmail, appPassword, email, emailSubject, html, attachments, ccEmail);
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
  }

  // const mailOptions = {
  //   from: process.env.EMAIL_USER,
  //   to: reportingManagerEmail,
  //   cc: hrAdminEmail,
  //   subject: 'New Leave Request Submitted',

  //   html: `
  //   <p>A new leave request has been submitted:</p>
  //   <p>Username: ${user.name}</p>
  //   <p> Leave Type: ${leaveType.leaveTypeName}</p>
  //   <p> Start Date: ${formattedStartDate}</p>
  //   <p>End Date: ${formattedEndDate}</p>
  //   <p> Notes: ${notes}</p>
  //  <p>Number of Days: ${noOfDays}</p>
  //  <p>Leave Dates: ${leaveDates.map(item => {
  //     const sessionString = [
  //       item.session1 ? 'session1' : '',
  //       item.session2 ? 'session2' : ''
  //     ].filter(Boolean).join(', ');
  //     return `${item.date} (${sessionString || 'No sessions selected'})`;
  //   }).join(', ')}</p>
  //   `
  // };

  // return transporter.sendMail(mailOptions);
}

async function getHREmail() {
  const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
  if (!hrAdminRole) {
    throw new Error('HR Admin role not found');
  }
  const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
  if (!hrAdminUser) {
    throw new Error('HR Admin user not found');
  }
  const userPosition = await UserPosition.findOne({ where: { userId: hrAdminUser.id } });
  if (!userPosition || !userPosition.officialMailId) {
    throw new Error ('Official Mail Id not found for HR Admin');
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
      throw new Error ( `No reporting manager found for userId ${userId}`);
    }

 
    const reportingManagerPosition = await UserPosition.findOne({
      where: { userId: reportingMangerId },
      attributes: ['officialMailId'],
    });

    if (reportingManagerPosition && reportingManagerPosition.officialMailId) {
      return reportingManagerPosition.officialMailId;
    } else {
      throw new Error ( `Reporting manager official mail not found for reportingMangerId ${reportingMangerId}`);
    }
  } catch (error) {
    return 'Error fetching reporting manager email';
  }
}

router.patch('/updateemployeeleave/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { userId, leaveTypeId, leaveDates, notes, fileUrl, startDate, endDate } = req.body;
    if (!userId || !leaveTypeId || !leaveDates) {
      return res.json({ message: 'Missing required fields: userId, leaveTypeId, and leaveDates are mandatory.' });
    }

    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) {
      return res.json({ message: 'Leave type not found' });
    }

    const leave = await Leave.findByPk(leaveId);
    if (!leave) {
      return res.json({ message: `Leave not found with id=${leaveId}` });
    }

    const noOfDays = calculateLeaveDays(leaveDates);
    const addedDays = leave.noOfDays || 0;

    let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });
    if (leaveType.leaveTypeName !== 'LOP') {
      if (userLeave && userLeave.leaveBalance < noOfDays) {
        return res.json({ message: 'Exceeds the allotted leave balance' });
      }
    }

    leave.userId = userId;
    leave.leaveTypeId = leaveTypeId;
    leave.noOfDays = noOfDays;
    leave.leaveDates = leaveDates;
    leave.notes = notes || leave.notes;
    leave.fileUrl = fileUrl || leave.fileUrl;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.status = 'Requested'
    await leave.save();

    // Sending notification and email
    const userPos = await UserPosition.findOne({
      where: { userId },
      include: [{ model: User, attributes: ['name'] }],
    });

    // const notificationMessage = `${req.user.name} has updated the leave (${leaveType.leaveTypeName}).`;
    // const notificationRoute = `/login/leave`;
    // createNotification({ id: userId, me: notificationMessage, route: notificationRoute });

    const hrAdmin = await User.findOne({
      include: [
        {
          model: Role,
          where: { roleName: 'HR Administrator' }
        },
      ],
    });

    const userPersonal = await UserPersonal.findOne({
      where: { userId },
      attributes: ['reportingMangerId'],
    });
    
    if (hrAdmin) {
      const id = hrAdmin.id;
      const me = `LOP leave with id ${leave.id}, request updated by ${req.user.name}`;
      const route = `/login/leave`;

      createNotification({ id, me, route });
    }

    if (userPersonal?.reportingMangerId) {
      const id = userPersonal.reportingMangerId;
      const me = `LOP leave with id ${leave.id} request updated by ${req.user.name}`;
      const route = `/login/leave`;

      createNotification({ id, me, route });
    }

    const email = await UserEmail.findOne({
      where: { userId: userId, type: 'Official'}
    });
    fromEmail = email.email;
    appPassword = email.password;

    if (userPos) {
      const emailSubject = 'Leave Application Updated';
      const emailHtml = `
        <p>Dear ${userPos.user.name},</p>
        <p>${req.user.name} has updated your leave (${leaveType.leaveTypeName}).</p>
        <p>Please review the leave application at your earliest convenience.</p>
        <p>Best Regards,</p>
      `;
      const fromEmail = config.email.userAddUser;
      const emailPassword = config.email.userAddPass;

      try {
        
      sendLeaveUpdateEmail(userId, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword)
        // await sendEmail(
        //   req.headers.authorization?.split(' ')[1],
        //   fromEmail,
        //   emailPassword,
        //   userPos.officialMailId,
        //   emailSubject,
        //   emailHtml,
        //   [],
        //   appPassword
        // );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    res.json({ message: 'Leave updated successfully', leave, userLeave });
  } catch (error) {
    res.json({ message: error.message, error: error.message });
  }
});

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

router.patch('/updateemergencyLeave/:id', authenticateToken, async (req, res) => {
  const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;

  if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.json({ message: 'Missing required fields' });
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.json({ message: 'Leave type not found' });
  } catch (error) {
    res.send(error.message)
  }

  const noOfDays = calculateLeaveDays(leaveDates);
  let leave;
  try {
    leave = await Leave.findByPk(req.params.id)
    addedDays = leave.noOfDays
    
    // if(userId !== leave.userId || leaveTypeId !== leave.leaveTypeId || noOfDays !== addedDays){
        let oldUL = await UserLeave.findOne({ where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId } })
        oldUL.takenLeaves -= addedDays;
        oldUL.leaveBalance += addedDays;
        await oldUL.save();
    // }

    try {
      userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });
      if(userLeave){
        if(leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays){
          return res.send("Exceeds the balance allotted leave days")
        }else{
          if (userLeave.noOfDays) { userLeave.leaveBalance -= noOfDays; }
          userLeave.takenLeaves += noOfDays;
          await userLeave.save();
        }
      } else {
        userLeave = await UserLeave.create({
          userId: userId,
          leaveTypeId: leaveTypeId,
          takenLeaves: noOfDays,
        });
      }
  
    } catch (error) {
      res.send(error.message)
    }

    leave.userId = userId,
    leave.leaveTypeId = leaveTypeId,
    leave.noOfDays = noOfDays
    leave.startDate = startDate,
    leave.endDate = endDate,
    leave.noOfDays = noOfDays,
    leave.notes = notes,
    leave.fileUrl = fileUrl,
    leave.leaveDates = leaveDates

    await leave.save();

    const userPos = await UserPosition.findOne({ 
      where: { userId: userId }, 
      include: [{ model: User, attributes: ['name']}
    ]})
    const id = userId;
    const me = `${req.user.name} has updated the ${leaveType.leaveTypeName} with id ${leave.id}`;
    const route = `/login/leave`;

    createNotification({ id, me, route });

    if(userPos){
      const emailSubject = `Leave Application Updation`;
      const fromEmail = config.email.userAddUser;
      const emailPassword = config.email.userAddPass;
      const html = `
        <p>Dear ${userPos.user.name},</p>
        <p>This is to inform you that ${req.user.name} has updated ${leaveType.leaveTypeName}.</p>
        <p>Please review the leave application at your earliest convenience.</p>
        <p>If you have any questions or need further details, feel free to reach out.</p>
      `;
      const attachments = []
      const token = req.headers.authorization?.split(' ')[1];
      try {
        await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject ,html, attachments);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({ leave, userLeave })
  } catch (error) {
    res.send(error.message)
  }

});

router.delete('/untakenLeaveDelete/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;

    const leave = await Leave.findByPk(leaveId, {
      include: {
        model: LeaveType,
        as: 'leaveType',
      },
    });
    
    if (!leave) {
      return res.send('Leave not found');
    }
    const key = leave.fileUrl;
    
    const fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    // try {
      if (fileKey && fileKey != null) {
          
        // Set S3 delete parameters
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey
        };
    
        // Delete the file from S3
        await s3.deleteObject(deleteParams).promise();
      }

    if( leave.status === 'Approved' || leave.status ==='AdminApproved'){
      const userLeave = await UserLeave.findOne({ where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId } });

      if (userLeave) {
        const leaveDays = leave.noOfDays > 0 ? leave.noOfDays : 1;
  
        if (leave.leaveType.leaveTypeName === 'LOP') {
  
          userLeave.takenLeaves -= leaveDays;
        } else {
  
          userLeave.takenLeaves -= leaveDays;
          userLeave.leaveBalance += leaveDays;
        }
        await userLeave.save();
      }
    }

    await leave.destroy();

    res.status(204).send('Leave deleted and balance updated successfully');
  } catch (error) {
    res.send(error.message);
  }
});

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

router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body;

  try {
    const leave = await Leave.findByPk(leaveId, {
      include: [
        { model: User, attributes: ['name'], as: 'user' },
        { model: LeaveType, attributes: ['leaveTypeName'], as: 'leaveType' }
      ]
    });

    if (!leave) {
      return res.send('Leave request not found');
    }

    const userId = leave.userId;
    const userPos = await UserPosition.findOne({
      where: { userId: userId },
      include: [{ model: User, attributes: ['name'] }]
    });

    const leaveType = await LeaveType.findOne({
      where: { id: leave.leaveTypeId }
    });

    if (!leaveType) {
      return res.send({ message: 'Leave type not found' });
    }
    
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Approving LOP leave
    if (leaveType.leaveTypeName === 'LOP') {
      leave.status = 'Approved';
      leave.adminNotes = adminNotes;
      await leave.save();

      const id = userId;
      const me = `Leave Request Approved with id ${leave.id}`;
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
        await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject, html, attachments);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      // Update or create a record for LOP
      if (startYear === endYear) {
        await updateOrCreateUserLeave(leave.userId, leave.leaveTypeId, startYear, leave.noOfDays, true);
      } else {
        const endOfStartYear = new Date(startYear, 11, 31);
        const startOfEndYear = new Date(endYear, 0, 1);

        const daysInStartYear = calculateLeaveDays(startDate, endOfStartYear);
        const daysInEndYear = calculateLeaveDays(startOfEndYear, endDate);

        await updateOrCreateUserLeave(leave.userId, leave.leaveTypeId, startYear, daysInStartYear, true);
        await updateOrCreateUserLeave(leave.userId, leave.leaveTypeId, endYear, daysInEndYear, true);
      }

      return res.send({ message: 'Leave approved successfully as LOP', leave });
    }

    // Handle non-LOP leave
    if (startYear === endYear) {
      const userLeave = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: startYear
        }
      });

      if (!userLeave) {
        return res.send('User leave record not found');
      }
      
      if (userLeave.leaveBalance < leave.noOfDays) {
        return res.json({
          message: 'Insufficient leave balance',
          openNoteDialog: true,
          lowLeaveMessage: "Insufficient leave balance",
        });
      }

      userLeave.leaveBalance -= leaveType.leaveTypeName != 'LOP'? leave.noOfDays : 0;
      userLeave.takenLeaves += leave.noOfDays;
      await userLeave.save();
    } else {
      const endOfStartYear = new Date(startYear, 11, 31);
      const startOfEndYear = new Date(endYear, 0, 1);
      const daysInStartYear = calculateLeaveDays(startDate, endOfStartYear);
      const daysInEndYear = calculateLeaveDays(startOfEndYear, endDate);

      const userLeaveStartYear = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: startYear
        }
      });

      const userLeaveEndYear = await UserLeave.findOne({
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
          message: 'Insufficient leave balance',
          openNoteDialog: true,
          lowLeaveMessage: "Insufficient leave balance",
        });
      }

      userLeaveStartYear.leaveBalance -= leaveType.leaveTypeName != 'LOP'? daysInStartYear : 0;;
      userLeaveStartYear.takenLeaves += daysInStartYear;
      await userLeaveStartYear.save();

      userLeaveEndYear.leaveBalance -= leaveType.leaveTypeName != 'LOP'? daysInEndYear : 0;;
      userLeaveEndYear.takenLeaves += daysInEndYear;
      await userLeaveEndYear.save();
    }

    // Approve the leave
    leave.status = 'Approved';
    leave.adminNotes = adminNotes;
    await leave.save();

    // Send notification and email
    const id = userId;
    const me = `Leave Request Approved with id ${leave.id}`;
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
      await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject, html, attachments);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {
    res.send(error.message);
  }
});

// Helper function to calculate the number of leave days
function calculateLeaveDays(startDate, endDate) {
  const timeDifference = endDate - startDate;
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return daysDifference;
}

// Helper function to update or create a UserLeave record
async function updateOrCreateUserLeave(userId, leaveTypeId, year, noOfDays, isLOP = false) {
  const userLeave = await UserLeave.findOne({
    where: {
      userId: userId,
      leaveTypeId: leaveTypeId,
      year: year
    }
  });

  if (userLeave) {
    userLeave.takenLeaves += noOfDays;
    if (isLOP) {
      userLeave.currentMonthLopDays += noOfDays;
    }
    await userLeave.save();
  } else {
    await UserLeave.create({
      userId: userId,
      leaveTypeId: leaveTypeId,
      year: year,
      noOfDays: 0,
      takenLeaves: noOfDays,
      currentMonthLopDays: isLOP ? noOfDays : 0,
      leaveBalance: 0 // Adjust as per your logic
    });
  }
}

// router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
//   const leaveId = req.params.id;
//   const { adminNotes } = req.body;

//   try {
//     const leave = await Leave.findByPk(leaveId, {include: [
//       {model: User, attributes: ['name'], as: 'user'}, {model: LeaveType, attributes: ['leaveTypeName'], as: 'leaveType'}
//     ]});

//     if (!leave) {
//       return res.send( 'Leave request not found' );
//     }

//     const userId = leave.userId;
//     const userPos = await UserPosition.findOne({ 
//       where: { userId: userId }, 
//       include: [{ model: User, attributes: ['name']}
//     ]})

//     const leaveType = await LeaveType.findOne({
//       where: { id: leave.leaveTypeId }
//     });

//     if (!leaveType) {
//       return res.send({ message: 'Leave type not found' });
//     }

//     const userLeave = await UserLeave.findOne({
//       where: {
//         userId: leave.userId,
//         leaveTypeId: leave.leaveTypeId
//       }
//     });

//     // Approving LOP leave
//     if (leaveType.leaveTypeName === 'LOP') {
//       leave.status = 'Approved';
//       leave.adminNotes = adminNotes;
//       await leave.save();

//       const id = userId;
//       const me = `Leave Request Approved with id ${leave.id}`;
//       const route = `/login/leave`;
  
//       createNotification({ id, me, route });      
      
//       const emailSubject = `Leave Request is Approved`;
//       const fromEmail = config.email.userAddUser;
//       const emailPassword = config.email.userAddPass;
//       const html = `
//         <p>Dear ${leave.user.name},</p>
//         <p>This is to inform you that ${req.user.name} has approved your ${leaveType.leaveTypeName},</p>
//         <p>with note ${adminNotes}.</p>
//         <p>Please review the leave application at your earliest convenience.</p>
//         <p>If you have any questions or need further details, feel free to reach out.</p>
//       `;
//       const attachments = []
//       const token = req.headers.authorization?.split(' ')[1];
//       try {
//         await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject , html, attachments);
//       } catch (emailError) {
//         console.error('Email sending failed:', emailError);
//       }

//       // Update or create a record for LOP
//       if (!userLeave) {
//         await UserLeave.create({
//           userId: leave.userId,
//           leaveTypeId: leave.leaveTypeId,
//           noOfDays: 0,
//           takenLeaves: leave.noOfDays,
//           currentMonthLopDays: leave.noOfDays,
//         });
//       } else {
//         userLeave.takenLeaves += leave.noOfDays;
//         await userLeave.save();
//       }

//       return res.send({ message: 'Leave approved successfully as LOP', leave });
//     }

//     // Checking leave balance for non-LOP leave
//     if (!userLeave) {
//       return res.send( 'User leave record not found' );
//     }

//     if (userLeave.leaveBalance < leave.noOfDays) {
//       return res.status(400).json({
//         message: 'Insufficient leave balance',
//         openNoteDialog: true,
//         lowLeaveMessage: "Insufficient leave balance",
//       });
//     }
//     // await Notification.create({
//     //   userId: userId,
//     //   message: `Leave Request Approved`,
//     //   isRead: false,
//     //   route: '/login/leave'
//     // });

//     const id = userId;
//     const me = `Leave Request Approved with ${leave.id}`;
//     const route = `/login/leave`;

//     createNotification({ id, me, route });
//     const emailSubject = `Leave Request is Approved`;
//     const fromEmail = config.email.userAddUser;
//     const emailPassword = config.email.userAddPass;
//     const html = `
//       <p>Dear ${leave.user.name},</p>
//       <p>This is to inform you that ${req.user.name} has approved your ${leaveType.leaveTypeName},</p>
//       <p>with note ${adminNotes}.</p>
//       <p>Please review the leave application at your earliest convenience.</p>
//       <p>If you have any questions or need further details, feel free to reach out.</p>
//     `;
//     const attachments = []
//     const token = req.headers.authorization?.split(' ')[1];
//     try {
//       await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject , html, attachments);
//     } catch (emailError) {
//       console.error('Email sending failed:', emailError);
//     }

//     // Approving non-LOP leave
//     leave.status = 'Approved';
//     leave.adminNotes = adminNotes;
//     await leave.save();

//     userLeave.leaveBalance -= leave.noOfDays;
//     userLeave.takenLeaves += leave.noOfDays;
//     await userLeave.save();

//     res.send({ message: 'Leave approved successfully', leave });
//   } catch (error) {
//     res.send(error.message );
//   }
// });

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

    const id = leave.userId;
    const userPos = await UserPosition.findOne({ 
      where: { userId: id }, 
      include: [{ model: User, attributes: ['name']}
    ]})

    const me = `Leave Request Rejected with id ${leave.id}`;
    const route = `/login/leave`;
    createNotification({ id, me, route });

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
      await sendEmail(token, fromEmail, emailPassword, userPos.officialMailId, emailSubject , html, attachments);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    res.send({ message: 'Leave rejected successfully', leave });
  } catch (error) {
    res.send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});

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

//--------------------------code by Amina for leave report-----------------

router.get('/all/report', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.json({ error: 'Year is required for fetching reports.' });
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
        { model: User, as: 'user', attributes: ['id', 'name'] },
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
    const result = Object.values(employeeData).map((employee) => ({
      ...employee,
      leaveDetails: Object.values(employee.leaveDetails),
    }));

    // Send the response
    res.status(200).json(result);
  } catch (error) {
    res.send(error.message);
  }
});



// --------------------------------------------------------------------------------------------
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

module.exports = router;