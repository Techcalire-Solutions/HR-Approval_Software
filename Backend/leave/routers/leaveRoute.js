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

router.get('/find', async (req, res) => {
    try {
  
      let whereClause = {};
      let limit;
      let offset;
  
  
      if (typeof req.query.pageSize !== 'undefined' && typeof req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
      }         
      if (req.query.search && req.query.search.trim() !== '') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('leaveType.leaveTypeName'), ' ', '')),
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
            model: LeaveType,
            as: 'leaveType', // Ensure this matches the alias
            attributes: ['id', 'leaveTypeName'],
            required: false, // Set to true temporarily for debugging
          },
          {
            model: User, as: 'user',
            attributes: ['name'],
          },
        ]
      });
      
      
      const totalCount = await Leave.count({ where: whereClause });
      
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
  
router.get('/approveLeave/:id', async (req, res) => {
  const leaveId = req.params.id;
  try {

    const leave = await Leave.findByPk(leaveId);
    const userId = leave.userId
    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }

    leave.status = 'Approved';
    await leave.save();

  const id = userId;
  const me = `Leave Request Approved`;
  const route = `/login/leave`;

  createNotification({ id, me, route });

  res.send(`
        <html>
          <body>
            <script>
              alert('Leave Approved: The leave has been approved successfully.');
              window.close(); // Optional: close the tab after showing the alert
            </script>
          </body>
        </html>
      `);
  } catch (error) {
    res.send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

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
    const me = `Leave Request Rejected`;
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
    const me = `Medical Certificate uploaded by ${userName}`;
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
          model: LeaveType,
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

router.post('/emergencyLeave', authenticateToken, async (req, res) => {
  const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status } = req.body;
  if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.send('Missing required fields');
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.send('Leave type not found');
  } catch (error) {
    res.send(error.message)
  }

  const noOfDays = calculateLeaveDays(leaveDates);
  
  try {
    userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId }});
    
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

    const userPos = await UserPosition.findOne({ 
      where: { userId: userId }, 
      include: [{ model: User, attributes: ['name']}
    ]})
    
    const id = userId;
    const me = `${req.user.name} has applied for a ${leaveType.leaveTypeName}`;
    const route = `/login/leave`;

    createNotification({ id, me, route });
    if(userPos.officialMailId){
      const emailSubject = `Admin Leave Application Submission`;
      const fromEmail = config.email.userAddUser;
      const emailPassword = config.email.userAddPass;
      const html = `
        <p>Dear ${userPos.user.name},</p>
        <p>This is to inform you that ${req.user.name} has applied for ${leaveType.leaveTypeName}.</p>
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
    }else {
      return res.send("Official email is not added. Leave is added without sending an email notification to the employee.")
    }

    
    let leave;
    try {
      leave = await Leave.create({ userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl, status: status, leaveDates });
    } catch (error) {
      res.send(error.message)
    }


    res.json({ userLeave, leave })
  } catch (error) {
    res.send(error.message)
  }
});

router.post('/employeeLeave', authenticateToken, async (req, res) => {
  let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status, fromEmail, appPassword } = req.body;

  if (!fromEmail || !appPassword) {
    const email = await UserEmail.findOne({
      where: { userId: userId, type: 'Official' }
    });
    fromEmail = email.email;
    appPassword = email.appPassword;
  }

  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.json({ message: 'Missing required fields' });
  }

  const user = await User.findByPk(userId);
  try {
    const noOfDays = calculateLeaveDays(leaveDates);

    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.json({ message: 'Leave type not found' });

    // Handle LOP leave type
    if (leaveType.leaveTypeName === 'LOP') {
      const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
      if (!emailResult.success) {
        return res.json({ message: emailResult.message });
      }

      await Leave.create({
        userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl,
        status: status, leaveDates
      });

      // Fetch HR Admin and Reporting Manager details      
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
        await Notification.create({
          userId: hrAdmin.id,
          message: `LOP leave request submitted by ${user.name}`,
          isRead: false,
        });
      }

      if (userPersonal?.reportingMangerId) {
        await Notification.create({
          userId: userPersonal.reportingMangerId,
          message: `LOP leave request submitted by ${user.name}`,
          isRead: false,
        });
      }

      return res.json({
        message: `LOP leave request submitted successfully.`,
        leaveDatesApplied: leaveDates,
        lopDates: leaveDates
      });
    }

    // For other leave types, check the user's leave balance
    const userLeaves = await UserLeave.findAll({ where: { userId } });
    let userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

    // If no userLeave entry exists, create a new one with a balance of 0
    if (!userLeave) {
      userLeave = await UserLeave.create({
        userId,
        leaveTypeId: leaveType.id,
        leaveBalance: 0,
      });
    }

    let leaveBalance = userLeave.leaveBalance;

    if (leaveBalance === 0) {
      return res.json({
        message: `Your ${leaveType.leaveTypeName} balance is 0. No leave will be applied.`,
      });
    }

    if (leaveBalance < noOfDays) {
      const availableLeaveDays = leaveBalance;
      const lopDays = noOfDays - availableLeaveDays;
      const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

      const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
      if (!emailResult.success) {
        return res.json({ message: emailResult.message });
      }
      
      await Leave.create({
        userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays: availableLeaveDays, notes, fileUrl,
        status: 'Requested', leaveDates: leaveDatesApplied
      });

      // Fetch HR Admin and Reporting Manager details      
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
      // if (!userPersonal) {
      //   return res.send(`Details with id ${userId} not found`);
      // }
      
      // Create notifications for HR Admin and Reporting Manager
      if (hrAdmin) {
        await Notification.create({
          userId: hrAdmin.id,
          message: `Leave request submitted by ${user.name}`,
          isRead: false,
        });
      }

      if (userPersonal?.reportingMangerId) {
        await Notification.create({
          userId: userPersonal.reportingMangerId,
          message: `Leave request submitted by ${user.name}`,
          isRead: false,
        });
      }

      return res.json({
        message: `${availableLeaveDays} days applied as ${leaveType.leaveTypeName}.
        ${lopDays} days are beyond balance; apply for LOP separately.`,
        leaveDatesApplied,
        lopDates: lopDates || []
      });
    }

    const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
    if (!emailResult.success) {
      return res.json({ message: emailResult.message });
    }

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
    
    // if (!userPersonal || !userPersonal?.reportingMangerId) {
    //     return res.send(`Reporting manager for user ${user.name} not added`);
    // }
    
    // Create notifications for HR Admin and Reporting Manager
    if (hrAdmin) {
      await Notification.create({
        userId: hrAdmin.id,
        message: `Leave request submitted by ${user.name}`,
        isRead: false,
      });
    }

    if (userPersonal?.reportingMangerId) {
      await Notification.create({
        userId: userPersonal.reportingMangerId,
        message: `Leave request submitted by ${user.name}`,
        isRead: false,
      });
    }

    await Leave.create({
      userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl,
      status: status, leaveDates
    });

    return res.json({
      message: `Leave request submitted successfully as ${leaveType.leaveTypeName}.`,
      leaveDatesApplied: leaveDates,
      lopDates: leaveDates
    });
  } catch (error) {
    console.error('Error in leave request submission:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// router.post('/employeeLeave', authenticateToken, async (req, res) => {
//   let { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates, status, fromEmail, appPassword } = req.body;

//   if (!fromEmail || !appPassword) {
//     const email = await UserEmail.findOne({
//       where: { userId: userId, type: 'Official' }
//     });
//     fromEmail = email.email;
//     appPassword = email.appPassword;
//   }

//   if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
//     return res.json({ message: 'Missing required fields' });
//   }

//   const user = await User.findByPk(userId);
//   try {
//     const noOfDays = calculateLeaveDays(leaveDates);

//     const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
//     if (!leaveType) return res.json({ message: 'Leave type not found' });

//     const userLeaves = await UserLeave.findAll({ where: { userId } });
//     const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

//     if (!userLeave && leaveType.leaveTypeName !== 'LOP') {
//       return res.json({
//         message: `You do not have ${leaveType.leaveTypeName} leave allotted.`
//       });
//     }else if (!userLeave && leaveType.leaveTypeName === 'LOP') {

//     }

//     let leaveBalance = userLeave.leaveBalance;

//     if (leaveBalance === 0 && leaveType.leaveTypeName !== 'LOP') {
//       return res.json({
//         message: `Your ${leaveType.leaveTypeName} balance is 0. No leave will be applied.`,
//       });
//     }

//     if (leaveBalance < noOfDays && leaveType.leaveTypeName !== 'LOP') {
//       const availableLeaveDays = leaveBalance;
//       const lopDays = noOfDays - availableLeaveDays;
//       const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

//       const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
//       if (!emailResult.success) {
//         return res.json({ message: emailResult.message });
//       }
      
//       await Leave.create({
//         userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays: availableLeaveDays, notes, fileUrl,
//         status: 'Requested', leaveDates: leaveDatesApplied
//       });
//       // const id = userId;
//       // const me = `Leave request submitted`;
//       // const route = `/login/leave`;

//       // createNotification({ id, me, route });

//       // Fetch HR Admin and Reporting Manager details      
//       const hrAdmin = await User.findOne({
//         include: [
//           {
//             model: Role,
//             where: { roleName: 'HR Administrator' }
//           },
//         ],
//       });
//       const userPersonal = await UserPersonal.findOne({
//         where: { userId },
//         attributes: ['reportingMangerId'],
//       });
//       if (!userPersonal) {
//         return `Details with id ${userId} not found`;
//       }
      
//       // Create notifications for HR Admin and Reporting Manager
//       if (hrAdmin) {
//         await Notification.create({
//           userId: hrAdmin.id,
//           message: `Leave request submitted by ${user.name}`,
//           isRead: false,
//         });
//       }

//       if (userPersonal) {
//         await Notification.create({
//           userId: userPersonal.reportingMangerId,
//           message: `Leave request submitted by ${user.name}`,
//           isRead: false,
//         });
//       }

//       return res.json({
//         message: `${availableLeaveDays} days applied as ${leaveType.leaveTypeName}.
//         ${lopDays} days are beyond balance; apply for LOP separately.`,
//         leaveDatesApplied,
//         lopDates: lopDates || []
//       });
//     }

//     const emailResult = await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates, fromEmail, appPassword, req.headers.authorization?.split(' ')[1]);
//     if (!emailResult.success) {
//       return res.json({ message: emailResult.message });
//     }

//     const hrAdmin = await User.findOne({
//       include: [
//         {
//           model: Role,
//           where: { roleName: 'HR Administrator' }
//         },
//       ],
//     });
    
//     const userPersonal = await UserPersonal.findOne({
//       where: { userId },
//       attributes: ['reportingMangerId'],
//     });
    
//     if (!userPersonal || !userPersonal.reportingMangerId) {
//         return res.send( `Reporting manager for user ${user.name} not added`);
//     }
    
//     // Create notifications for HR Admin and Reporting Manager
//     if (hrAdmin) {
//       await Notification.create({
//         userId: hrAdmin.id,
//         message: `Leave request submitted by ${user.name}`,
//         isRead: false,
//       });
//     }

//     if (userPersonal) {
//       await Notification.create({
//         userId: userPersonal.reportingMangerId,
//         message: `Leave request submitted by ${user.name}`,
//         isRead: false,
//       });
//     }

//     await Leave.create({
//       userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl,
//       status: status, leaveDates
//     });

//     return res.json({
//       message: `Leave request submitted successfully as ${leaveType.leaveTypeName}.`,
//       leaveDatesApplied: leaveDates,
//       lopDates: leaveDates
//     });
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
    console.error('Error fetching emails:', error);
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
    console.error('Email sending failed:', emailError);
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
    console.warn('Missing email(s): HR Admin:', !!hrAdminEmail, ', Reporting Manager:', !!reportingManagerEmail);
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
    if (!userPersonal) {
      throw new Error ( `User with id ${userId} not found`);
    }

    const reportingMangerId = userPersonal.reportingMangerId;

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
    console.error('Error fetching reporting manager email:', error);
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
      const me = `LOP leave (${leave.id}) request updated by ${req.user.name}`;
      const route = `/login/leave`;

      createNotification({ id, me, route });
    }

    if (userPersonal?.reportingMangerId) {
      const id = userPersonal.reportingMangerId;
      const me = `LOP leave (${leave.id}) request updated by ${req.user.name}`;
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
    console.error('Error updating leave:', error);
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
          model: LeaveType,
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


function calculateLeaveDays(leaveDates) {
  let totalDays = 0;
  leaveDates.forEach(date => {
    if (date.session1 && date.session2) {
      totalDays += 1;
    } else if (date.session1 || date.session2) {
      totalDays += 0.5;
    }
  });

  return totalDays;
}

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
    const me = `${req.user.name} has updated the ${leaveType.leaveTypeName}`;
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
          model: LeaveType,
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
    console.error(error);
    res.json({ error: error.message });
  }
});

router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body;

  try {
    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.send( 'Leave request not found' );
    }

    const userId = leave.userId;

    const leaveType = await LeaveType.findOne({
      where: { id: leave.leaveTypeId }
    });

    if (!leaveType) {
      return res.send({ message: 'Leave type not found' });
    }

    const userLeave = await UserLeave.findOne({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId
      }
    });

    // Approving LOP leave
    if (leaveType.leaveTypeName === 'LOP') {
      leave.status = 'Approved';
      leave.adminNotes = adminNotes;
      await leave.save();

      const id = userId;
      const me = `Leave Request Approved - ${leave.id}`;
      const route = `/login/leave`;
  
      createNotification({ id, me, route });

      // Update or create a record for LOP
      if (!userLeave) {
        await UserLeave.create({
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          noOfDays: 0,
          takenLeaves: leave.noOfDays,
          currentMonthLopDays: leave.noOfDays,
        });
      } else {
        userLeave.takenLeaves += leave.noOfDays;
        await userLeave.save();
      }

      return res.send({ message: 'Leave approved successfully as LOP', leave });
    }

    // Checking leave balance for non-LOP leave
    if (!userLeave) {
      return res.send( 'User leave record not found' );
    }

    if (userLeave.leaveBalance < leave.noOfDays) {
      return res.status(400).json({
        message: 'Insufficient leave balance',
        openNoteDialog: true,
        lowLeaveMessage: "Insufficient leave balance",
      });
    }
    // await Notification.create({
    //   userId: userId,
    //   message: `Leave Request Approved`,
    //   isRead: false,
    //   route: '/login/leave'
    // });

    const id = userId;
    const me = `Leave Request Approved - ${leave.id}`;
    const route = `/login/leave`;

    createNotification({ id, me, route });

    // Approving non-LOP leave
    leave.status = 'Approved';
    leave.adminNotes = adminNotes;
    await leave.save();

    userLeave.leaveBalance -= leave.noOfDays;
    userLeave.takenLeaves += leave.noOfDays;
    await userLeave.save();

    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {
    res.send(error.message );
  }
});

router.put('/rejectLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body;

  try {
    const leave = await Leave.findByPk(leaveId);
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
    const me = `Leave Request Rejected- ${leave.id}`;
    const route = `/login/leave`;
    createNotification({ id, me, route });
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
      });
      
      const response = {
        count: totalCount,
        items: leaves,
      };

      res.json(response);
  } catch (error) {
      console.error(error);
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
        { model: User, attributes: ['id', 'name'] },
        { model: LeaveType, attributes: ['id', 'leaveTypeName'] },
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
    console.error('Error fetching leave data:', error);
    res.status(500).json({ error: 'An error occurred while fetching leave data.' });
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
    res.status(500).send(error.message);
  }
});


module.exports = router;