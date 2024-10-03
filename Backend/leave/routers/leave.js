const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user')
const LeaveType = require('../models/leaveType')
 const nodemailer = require('nodemailer');
 const { Op, fn, col, where } = require('sequelize');
 const sequelize = require('../../utils/db');
 const Role = require('../../users/models/role')


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


// Function to get HR Admin's email for CC
async function getHREmail() {
  // Find HR Admin role by roleName
  const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
  if (!hrAdminRole) {
    throw new Error('HR Admin role not found');
  }

  // Find user with the HR Admin roleId
  const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
  if (!hrAdminUser) {
    throw new Error('HR Admin user not found');
  }

  return hrAdminUser.email; // Return the HR Admin's email
}


async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const hrAdminEmail = await getHREmail();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    cc: hrAdminEmail,
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
    res.send(error.message)
    if (!res.headersSent) {
      res.send(error.message)
    }
  }
});


router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching leaves for userId: ${userId}`);

    // Check if the user exists in the User table
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let whereClause = {
      userId: userId,
    };
    let limit;
    let offset;

    // Check for pagination parameters
    if (req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;

      // Check for search term
      if (req.query.search && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
      
          ]
        };
      }
    } else {
      // If no pagination params, apply status filter
      if (req.query.search && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
            
          ],
          status: true
        };
      } else {
        whereClause = { status: true };
      }
    }

    // Fetch leave data based on the where clause and pagination
    const leave = await Leave.findAll({
      order: ['id'],
      limit,
      offset,
      where: whereClause, 
      include: [
        {
          model: LeaveType,  // Assuming LeaveType is the related model
          attributes: ['id', 'leaveTypeName'],  // Specify the columns to be selected from the LeaveType model
        }
      ]
    });

    // Get the total count of leaves matching the where clause
    const totalCount = await Leave.count({ where: whereClause });

    if (req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {
      // Handle case for when pagination is not provided, if needed
      res.json(leave);
    }
  } catch (error) {
    res.send(error.message);
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({});
    res.status(200).send(leaves);
  } catch (error) {
    res.send(error.message)
  }
});





router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (leave) {
      res.json(leave);
    } else {
      res.status(404).json({ message: `Leave not found` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




router.delete('/:id', async (req, res) => {
  try {
    const result = await Leave.destroy({ where: { id: req.params.id }, force: true });
    result ? res.json({ message: `Leave with ID ${req.params.id} deleted successfully` }) : res.status(404).json({ message: "Leave not found" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});






router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { leaveDates, notes, leaveTypeId } = req.body;

    // Validate if leaveDates are provided for recalculating leave days
    if (!leaveDates) {
      return res.status(400).json({ message: 'leaveDates are required to update leave' });
    }

    // Find the leave record by ID
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: `Leave not found with id=${req.params.id}` });
    }

    // Find the related user leave data
    const userLeave = await UserLeave.findOne({
      where: { userId: leave.userId, leaveTypeId }
    });

    if (!userLeave) {
      return res.status(404).json({ message: 'User leave mapping not found' });
    }

    // Recalculate the number of leave days based on leaveDates
    const noOfDays = calculateLeaveDays(leaveDates);

    // Check if the user has enough leave balance for the update
    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance for this update' });
    }

    // Update leave record
    leave.leaveDates = leaveDates;
    leave.notes = notes || leave.notes; // Only update notes if provided
    leave.noOfDays = noOfDays;

    await leave.save();

    // Update user leave balance (takenLeaves and leaveBalance)
    userLeave.takenLeaves += noOfDays - leave.noOfDays; // Adjust taken leaves for any change
    userLeave.leaveBalance -= (noOfDays - leave.noOfDays); // Update balance based on the new days
    await userLeave.save();

    res.json({
      message: 'Leave updated successfully',
      leave: {
        userId: leave.userId,
        leaveTypeId,
        leaveDates,
        noOfDays,
        notes: leave.notes,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




module.exports = router;

