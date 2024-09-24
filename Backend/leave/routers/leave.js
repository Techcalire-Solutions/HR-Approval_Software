const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const nodemailer = require('nodemailer');

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or any other email service you're using
  auth: {
    user: 'info.techclaire@gmail.com', // Your system email or authentication info
    pass: '<<#TechClaire999#>>' // Use your password or app password
  }
});

router.post('/test', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes } = req.body;
  const userId = req.user.id;

  if (!leaveTypeId || !startDate || !endDate) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).send('Invalid date format');
    }

    const noOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const userLeave = await UserLeave.findOne({
      where: { userId, leaveTypeId },
    });

    if (!userLeave) {
      return res.status(404).send('User leave mapping not found');
    }

    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).send('Not enough leave balance');
    }

    const leave = await Leave.create({
      userId,
      leaveTypeId,
      startDate,
      endDate,
      noOfDays,
      notes,
      status: 'requested',
    });

    userLeave.takenLeaves += noOfDays;
    userLeave.leaveBalance -= noOfDays;
    await userLeave.save();

    // Send email notification to admin
    const mailOptions = {
      from: 'info.techclaire@gmail.com',
      to: 'info.techclaire@gmail.com',
      subject: 'New Leave Request Submitted',
      text: `A leave request has been submitted:
      - Leave Type ID: ${leaveTypeId}
      - Start Date: ${startDate}
      - End Date: ${endDate}
      - Notes: ${notes}
      - Number of Days: ${noOfDays}
      - User ID: ${userId}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Failed to send notification email');
      }

      console.log('Email sent to admin:', info.response);
      // Send the response after the email is successfully sent
      res.json({ userLeave: userLeave, leave: leave });
    });

  } catch (error) {
    console.error('Error:', error);
    // Check if response has already been sent
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
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