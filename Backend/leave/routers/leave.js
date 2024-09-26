const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user')
const LeaveType = require('../models/leaveType')
const nodemailer = require('nodemailer');



// <!-----------------------TESTING CODE-------------------------------------->



// Create a transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'Gmail' depending on the Nodemailer version
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or App Password
  },
});
// Log the email credentials for debugging
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS);


// Function to calculate leave days and leave dates
function calculateLeaveDays(start, end, session1, session2) {
  let leaveDates = [];
  let noOfDays = 0;

  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const currentDate = new Date(dt).toISOString().split('T')[0];
    let sessionInfo = [];
    if (session1) sessionInfo.push('Session 1');
    if (session2) sessionInfo.push('Session 2');

    leaveDates.push({
      date: currentDate,
      sessions: sessionInfo,
    });

    // Calculate leave days based on sessions
    if (session1 && session2) {
      noOfDays += 1;
    } else if (session1 || session2) {
      noOfDays += 0.5;
    }
  }
  return { leaveDates, noOfDays };
}

// Function to send email notifications
async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Change this to your admin or appropriate email
    subject: 'New Leave Request Submitted',
    text: `A new leave request has been submitted:
    - Username: ${user.name}
    - Leave Type: ${leaveType.leaveTypeName}
    - Start Date: ${startDate}
    - End Date: ${endDate}
    - Notes: ${notes}
    - Number of Days: ${noOfDays}
    - Leave Dates: ${leaveDates.map(item => `${item.date} (${item.sessions.join(', ')})`).join(', ')}`,
  };

  return transporter.sendMail(mailOptions);
}

// Leave request route
router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, session1, session2 } = req.body;
  const userId = req.user.id;

  if (!leaveTypeId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Calculate leave days and leave dates
    const { leaveDates, noOfDays } = calculateLeaveDays(start, end, session1, session2);

    const user = await User.findByPk(userId);
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    const userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });

    if (!leaveType) {
      console.error(`Leave type with ID ${leaveTypeId} not found`);
      return res.status(404).json({ message: 'Leave type not found' });
    }

    if (!userLeave) {
      return res.status(404).json({ message: 'User leave mapping not found' });
    }

    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance' });
    }

    // Create leave record
    const leave = await Leave.create({
      userId,
      leaveTypeId,
      startDate,
      endDate,
      noOfDays,
      notes,
      status: 'requested',
      session1,
      session2,
      leaveDates: JSON.stringify(leaveDates)
    });

    // Update user leave balance
    userLeave.takenLeaves += noOfDays;
    userLeave.leaveBalance -= noOfDays;
    await userLeave.save();

    // Send email notification
    await sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates);

    res.json({
      message: 'Leave request submitted successfully',
      leave: {
        user: {
          id: userId,
          name: user.name,
        },
        leaveType: {
          id: leaveTypeId,
          name: leaveType.leaveTypeName,
        },
        startDate,
        endDate,
        noOfDays,
        notes,
        leaveDates
      },
    });
  } catch (error) {
    console.error('Error:', error); // Log the error details
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
});

// <!----------------------------------------------------WORKING CODE------------------------------------------------------------------------->


// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER, // Use your system email from .env
//     pass: process.env.EMAIL_PASS, // Use your app password from .env
//   }
// });

// POST route to submit leave request


router.post('/set', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes,session1,session2 } = req.body;
  const userId = req.user.id; 

  if (!leaveTypeId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

   
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const noOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

 
    const user = await User.findByPk(userId); 
    const leaveType = await LeaveType.findByPk(leaveTypeId); 
    const userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });

    if (!userLeave) {
      return res.status(404).json({ message: 'User leave mapping not found' });
    }


    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance' });
    }


    const leave = await Leave.create({
      userId,
      leaveTypeId,
      startDate,
      endDate,
      noOfDays,
      notes,
      status: 'requested',  
      session1,
      session2
    });


    userLeave.takenLeaves += noOfDays;
    userLeave.leaveBalance -= noOfDays;
    await userLeave.save();


    const mailOptions = {
      // from: process.env.EMAIL_USER,
      from: process.env.EMAIL_USER,
      // to: 'admin@example.com',
      to: process.env.EMAIL_USER,
      subject: 'New Leave Request Submitted',
      text: `A new leave request has been submitted:
      - Username: ${user.name}  
      - Leave Type: ${leaveType.leaveTypeName} 
      - Start Date: ${startDate}
      - End Date: ${endDate}
      - Notes: ${notes}
      - Number of Days: ${noOfDays}`,
    };

    // Send the email notification
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send notification email' });
      }
      console.log('Email sent:', info.response);
      
      // Send the response back with user and leave type details
      res.json({
        message: 'Leave request submitted successfully',
        leave: {
          user: {
            id: userId,
            name: user.name,  // Send username in response
          },
          leaveType: {
            id: leaveTypeId,
            name: leaveType.name,  // Send leave type name in response
          },
          startDate,
          endDate,
          noOfDays,
          notes,
        },
      });
    });

  } catch (error) {
    console.error('Error:', error);
    // Ensure response is not sent twice
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});










// router.post('/', authenticateToken, async (req, res) => {
//   const { leaveTypeId, startDate, endDate, notes } = req.body;
//   const userId = req.user.id;

//   if ( !leaveTypeId || !startDate || !endDate) {
//     return res.status(400).send('Missing required fields');
//   }

//   try {
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//       return res.status(400).send('Invalid date format');
//     }

//     const noOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
//     const userLeave = await UserLeave.findOne({
//       where: { userId, leaveTypeId }
//     });

//     if (!userLeave) {
//       return res.status(404).send('User leave mapping not found');
//     }

//     if (userLeave.leaveBalance < noOfDays) {
//       return res.status(400).send('Not enough leave balance');
//     }
//     const leave = await Leave.create({
//       userId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       noOfDays,
//       notes,
//       status: 'requested'
//     });

//     userLeave.takenLeaves += noOfDays;
//     userLeave.leaveBalance -= noOfDays;
//     await userLeave.save();
//     res.json({userLeave:userLeave,leave:leave})

//   } catch (error) {
//     res.status(500).send('Internal Server Error');
//   }
// });


router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({});
    res.status(200).send(leaves);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


router.put('/:leaveId/status', authenticateToken, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.status(404).send('Leave request not found');
    }

    leave.status = status;
    await leave.save();

    res.status(200).send(leave);
  } catch (error) {
    res.status(500).send(error.message);
  }
});






module.exports = router;