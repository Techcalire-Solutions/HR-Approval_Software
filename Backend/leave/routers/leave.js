const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user')
const LeaveType = require('../models/leaveType')
 const nodemailer = require('nodemailer');
 const { Op } = require('sequelize');
 const sequelize = require('../../utils/db');
 const Role = require('../../users/models/role')
 const s3 = require('../../utils/s3bucket');
 const upload = require('../../utils/leaveDocumentMulter');

//-----------------------------------Mail code-------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});


//-------------------------------------Find HR Mail-----------------------------------------------------
async function getHREmail() {

  const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
  if (!hrAdminRole) {
    throw new Error('HR Admin role not found');
  }


  const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
  if (!hrAdminUser) {
    throw new Error('HR Admin user not found');
  }

  return hrAdminUser.email; 
}

//-------------------------------------Mail sending function------------------------------------------
async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const hrAdminEmail = await getHREmail();

  // Ensure leaveDates is valid
  if (!Array.isArray(leaveDates)) {
    throw new Error('leaveDates must be an array');
  }

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

//-----------------------------------Calculating Leave Days-------------------------------------------


// Utility functions to calculate leave days and split dates
function calculateLeaveDays(leaveDates) {
  let leaveDays = 0;

  leaveDates.forEach(date => {
    if (date.session1 && date.session2) {
      leaveDays += 1; // Full day leave
    } else if (date.session1 || date.session2) {
      leaveDays += 0.5; // Half-day leave
    }
  });

  return leaveDays;
}

function splitLeaveDates(leaveDates, availableLeaveDays) {
  let leaveDatesApplied = [];
  let lopDates = [];
  let appliedDays = 0;

  for (let date of leaveDates) {
    // Calculate days for each date based on session1 and session2
    let daysForDate = 0;
    if (date.session1 && date.session2) {
      daysForDate = 1; // Full day
    } else if (date.session1 || date.session2) {
      daysForDate = 0.5; // Half-day
    }

    // If we still have available leave balance, apply it as leave
    if (appliedDays + daysForDate <= availableLeaveDays) {
      leaveDatesApplied.push(date);
      appliedDays += daysForDate;
    } else {
      lopDates.push(date); // Otherwise, treat it as LOP
    }
  }

  return { leaveDatesApplied, lopDates };
}

// POST Leave Request Route
router.post('/', async (req, res) => {
  try {
    const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;

    // Step 1: Ensure leaveTypeId exists
    if (!leaveTypeId) {
      return res.status(400).json({ message: "Leave type is required." });
    }

    // Step 2: Calculate the number of leave days based on session1 and session2 flags
    let totalLeaveDays = 0;
    leaveDates.forEach(date => {
      if (date.session1) {
        totalLeaveDays += 0.5; // For a half-day (session 1)
      }
      if (date.session2) {
        totalLeaveDays += 0.5; // For a half-day (session 2)
      }
    });

    // Step 3: Fetch the user's leave record for the given leave type
    let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });

    if (!userLeave) {
      // If the user does not have a leave record for this leave type, fallback to LOP
      const lopLeaveType = await LeaveType.findOne({ where: { leaveTypeName: 'LOP' } });
      if (lopLeaveType) {
        // Use the LOP leave type ID if found
        userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId: lopLeaveType.leaveTypeId } });
      }

      if (!userLeave) {
        // If the user does not have any leave record for LOP, create a new record for LOP
        userLeave = await UserLeave.create({
          userId,
          leaveTypeId: lopLeaveType.leaveTypeId,
          leaveBalance: 0, // Set initial balance for LOP
          takenLeaves: 0,
          noOfDays: 0,
          leaveDays: 0,
        });
      }
    }

    // Step 4: Check if the user has enough leave balance (for the leave type or LOP)
    const leaveBalance = userLeave.leaveBalance;
    let lopDays = 0;

    if (leaveBalance < totalLeaveDays) {
      // If leave balance is insufficient, calculate LOP
      lopDays = totalLeaveDays - leaveBalance;
      totalLeaveDays = leaveBalance; // Apply leave balance first
    }

    // Step 5: Update the leave balance and taken leaves (apply leave balance first)
    await UserLeave.update(
      {
        leaveBalance: leaveBalance - totalLeaveDays, // Deduct leave balance for available leave
        takenLeaves: userLeave.takenLeaves + totalLeaveDays, // Increment taken leaves
      },
      { where: { userId, leaveTypeId: userLeave.leaveTypeId } }
    );

    // Step 6: If there are LOP days, handle them
    if (lopDays > 0) {
      const lopLeaveType = await LeaveType.findOne({ where: { leaveTypeName: 'LOP' } });

      if (!lopLeaveType) {
        return res.status(400).json({ message: "LOP leave type not found." });
      }

      // Fetch or create a LOP leave record for this user
      let userLopLeave = await UserLeave.findOne({
        where: { userId, leaveTypeId: lopLeaveType.leaveTypeId }
      });

      if (!userLopLeave) {
        userLopLeave = await UserLeave.create({
          userId,
          leaveTypeId: lopLeaveType.leaveTypeId,
          leaveBalance: 0, // Set initial balance for LOP
          takenLeaves: 0,
          noOfDays: 0,
          leaveDays: 0,
        });
      }

      // Update LOP leave record with the LOP days
      await UserLeave.update(
        {
          leaveBalance: userLopLeave.leaveBalance - lopDays, // Deduct LOP balance
          takenLeaves: userLopLeave.takenLeaves + lopDays, // Increment taken LOP leaves
        },
        { where: { userId, leaveTypeId: userLopLeave.leaveTypeId } }
      );
    }

    // Step 7: Create a new leave record for this leave request
    const newLeaveRecord = await UserLeave.create({
      userId,
      leaveTypeId: userLeave.leaveTypeId,
      startDate,
      endDate,
      notes,
      fileUrl,
      noOfDays: totalLeaveDays, // Record applied leave days
      takenLeaves: totalLeaveDays, // Record applied leave taken
      leaveBalance: leaveBalance - totalLeaveDays, // Updated leave balance after deduction
    });

    // Step 8: Return updated leave balance including LOP if applicable
    const leaveCounts = await getLeaveCounts(userId); // Fetch current leave counts

    return res.json({
      message: "Leave request created successfully",
      leaveCounts // Send updated leave counts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error processing leave request", error: error.message });
  }
});

// Function to fetch leave counts for the user, including LOP
async function getLeaveCounts(userId) {
  const leaveCounts = await UserLeave.findAll({
    where: { userId },
    include: [
      {
        model: LeaveType,
        as: 'leaveType', // Use the alias here as defined in the association
        attributes: ['leaveTypeName'],
      }
    ],
  });

  return leaveCounts.map(leave => ({
    leaveTypeId: leave.leaveTypeId,
    leaveTypeName: leave.leaveType.leaveTypeName, // Access using alias
    leaveBalance: leave.leaveBalance,
    takenLeaves: leave.takenLeaves,
    noOfDays: leave.noOfDays,
    leaveDays: leave.leaveDays || 0, // Adjust this field if necessary
  }));
}



//-------------------------GET LEAVE BY USER ID-------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching leaves for userId: ${userId}`);

    // Find user based on provided userId
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize where clause for filtering
    let whereClause = {
      userId: userId,
    };
    let limit;
    let offset;

    // Handle pagination parameters
    if (req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;

      // Handle search functionality
      if (req.query.search && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ],
        };
      }
    } else {
      // Handle search when pagination is not provided
      if (req.query.search && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ],
          status: true,
        };
      } else {
        whereClause = { status: true };
      }
    }

    // Fetch the leave records from the database
    const leave = await Leave.findAll({
      order: [['id', 'DESC']],  // Ordering records by ID
      limit,
      offset,
      where: whereClause,
      include: [
        {
          model: LeaveType,
          attributes: ['id', 'leaveTypeName'],
        },
      ],
    });

    // Calculate the noOfDays for each leave entry based on sessions
    leave.forEach(leaveItem => {
      let totalDays = 0;
      leaveItem.leaveDates.forEach(leaveDate => {
        // Full day if both session1 and session2 are selected
        if (leaveDate.session1 && leaveDate.session2) {
          totalDays += 1;
        }
        // Half-day if only one session (session1 or session2) is selected
        else if (leaveDate.session1 || leaveDate.session2) {
          totalDays += 0.5;
        }
      });

      // Update noOfDays for the leave entry
      leaveItem.noOfDays = totalDays;
    });

    // Get the total count of leaves matching the where clause
    const totalCount = await Leave.count({ where: whereClause });

    // Return paginated or full leave records depending on request
    const response = req.query.page !== 'undefined' && req.query.pageSize !== 'undefined'
      ? { count: totalCount, items: leave }
      : leave;

    res.json(response);
  } catch (error) {
    console.error('Error in fetching leave records:', error.message);
    res.status(500).json({ message: error.message });
  }
});



//--------------------------------File upload--------------------------------------------------------
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
    res.status(500).send({ message: error.message });
  }
});


//--------------------------------- Approve leave API-----------------------------------------------


router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;

  try {
    // Find the leave by its ID
    const leave = await Leave.findByPk(leaveId);

    // Check if leave exists
    if (!leave) {
      return res.status(404).send({ message: 'Leave request not found' });
    }

    // Fetch the leave type to check if it's LOP
    const leaveType = await LeaveType.findOne({ where: { id: leave.leaveTypeId } });

    if (!leaveType) {
      return res.status(404).send({ message: 'Leave type not found' });
    }

    // If leave type is not LOP, check the user's leave balance
    let userLeave;
    if (leaveType.leaveTypeName !== 'LOP') {
      // Find user leave balance for the requested leave type
      userLeave = await UserLeave.findOne({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId
        }
      });

      if (!userLeave) {
        return res.status(404).send({ message: 'Leave balance not found for the user.' });
      }

      // Calculate the total number of requested leave days
      let requestedDays = leave.noOfDays;

      // Check if leave balance is sufficient
      if (userLeave.leaveBalance < requestedDays) {
        return res.status(400).send({
          message: `Insufficient leave balance. You only have ${userLeave.leaveBalance} days left.`
        });
      }

      // Update leave balance (deduct the requested days from the user's balance)
      userLeave.leaveBalance -= requestedDays;
      await userLeave.save();
    }

    // Update leave status to 'Approved'
    leave.status = 'approved';
    await leave.save(); // Save the updated leave

    // Send success response
    res.send({
      message: 'Leave approved successfully',
      leave,
      remainingLeaveBalance: leaveType.leaveTypeName === 'LOP' ? 'Unlimited' : userLeave?.leaveBalance
    });

  } catch (error) {
    // Handle errors
    res.status(500).send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});






//------------------------------------Reject----------------------------------------------

router.put('/rejectLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;

  try {
    const leave = await Leave.findByPk(leaveId);

   
    if (!leave) {
      return res.status(404).send({ message: 'Leave request not found' });
    }

   
    leave.status = 'Rejected';
    await leave.save(); 

  
    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {

    res.status(500).send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});


//-------------------------GET BY ID--------------------------------------------------------------

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


//--------------------------------Update Leave-----------------------------------------------------
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { leaveDates, notes, leaveTypeId } = req.body;
    if (!leaveDates) {
      return res.status(400).json({ message: 'leaveDates are required to update leave' });
    }

    const leave = await Leave.findByPk(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: `Leave not found with id=${req.params.id}` });
    }

    const userLeave = await UserLeave.findOne({
      where: { userId: leave.userId, leaveTypeId }
    });

    if (!userLeave) {
      return res.status(404).json({ message: 'User leave mapping not found' });
    }

    const noOfDays = calculateLeaveDays(leaveDates);

   
    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance for this update' });
    }

  
    leave.leaveDates = leaveDates;
    leave.notes = notes || leave.notes; 
    leave.noOfDays = noOfDays;

    await leave.save();

   
    userLeave.takenLeaves += noOfDays - leave.noOfDays;
    userLeave.leaveBalance -= (noOfDays - leave.noOfDays); 
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
    res.send(error.message)
  }
});


//-----------------------------Delete Leave---------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const result = await Leave.destroy({ where: { id: req.params.id }, force: true });
    result ? res.json({ message: `Leave with ID ${req.params.id} deleted successfully` }) : res.status(404).json({ message: "Leave not found" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


//----------------------------Get Leaves-----------------------------
router.get('/', async (req, res) => {
  try {
    // Fetch all leave requests along with leave type name and user name
    const leave = await Leave.findAll({
      include: [
        {
          model: LeaveType, 
          attributes: ['leaveTypeName'] // Ensure correct casing or field name
        },
        {
          model: User, // Assuming User is correctly related to Leave
          attributes: ['name'] // Ensure the 'name' field exists in the User model
        }
      ]
    });

    // If leave records are found, return them
    if (leave.length > 0) {
      res.json(leave);
    } else {
      res.status(404).json({ message: "No leave records found." });
    }
  } catch (error) {
    // Log the error and return a 500 status with the error message
    console.error('Error fetching leave records:', error.message);
    res.status(500).json({ message: 'An error occurred while fetching leave records.', error: error.message });
  }
});






module.exports = router;

