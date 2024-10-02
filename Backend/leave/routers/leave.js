const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user')
const LeaveType = require('../models/leaveType')
 const nodemailer = require('nodemailer');




// Set up the email transporter using nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail or another service provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address from environment variables
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password from environment variables
  },
});

function calculateLeaveDays(leaveDates) {
  let noOfDays = 0;

  leaveDates.forEach(({ session1, session2 }) => {
    if (session1 && session2) {
      noOfDays += 1; // Full day
    } else if (session1 || session2) {
      noOfDays += 0.5; // Half day (only one session selected)
    }
  });

  return noOfDays;
}

async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'New Leave Request Submitted',
    text: `A new leave request has been submitted:
    - Username: ${user.name}
    - Leave Type: ${leaveType.leaveTypeName}
    - Start Date: ${startDate}
    - End Date: ${endDate}
    - Notes: ${notes}
    - Number of Days: ${noOfDays}
    - Leave Dates: ${leaveDates.map(item => {
        const sessionString = [
          item.session1 ? 'session1' : '',
          item.session2 ? 'session2' : ''
        ].filter(Boolean).join(', '); // Only include sessions that are true
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}`
  };

  return transporter.sendMail(mailOptions);
}



// Leave request route
router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, leaveDates } = req.body;
  const userId = req.user.id;

  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Calculate the number of leave days based on the sessions selected
    const noOfDays = calculateLeaveDays(leaveDates);

    const user = await User.findByPk(userId);
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    const userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });

    if (!leaveType) {
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
      leaveDates
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
    console.error('Error:', error);
    if (!res.headersSent) {
      res.send(error.message)
    }
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({});
    res.status(200).send(leaves);
  } catch (error) {
    res.status(500).send(error.message);
  }
});



// Get leaves for a specific user by userId
router.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;

  // Use Sequelize to fetch leaves for the user
  Leave.findAll({ where: { userId },
    include:[
      {
        model :LeaveType,
        attributes:['id','leaveTypeName']
      }
    ]
   })
    .then((leaves) => {
      // Send the response back with the found leaves
      res.json(leaves);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error fetching leaves' });
    });
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