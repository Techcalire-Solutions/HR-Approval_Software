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

// Helper function to calculate the number of leave days considering session1 and session2
function calculateLeaveDays(leaveDates) {
  let leaveDays = 0;

  leaveDates.forEach(date => {
    // If both session1 and session2 are selected, count as 1 day
    if (date.session1 && date.session2) {
      leaveDays += 1;
    }
    // If only session1 or only session2 is selected, count as 0.5 day
    else if (date.session1 || date.session2) {
      leaveDays += 0.5;
    }
    // If no session is selected, ignore
  });

  return leaveDays;
}



// Helper function to calculate the number of leave days considering session1 and session2
function calculateLeaveDays(leaveDates) {
  let leaveDays = 0;

  leaveDates.forEach(date => {
    if (date.session1 && date.session2) {
      leaveDays += 1; // Full day if both sessions are selected
    } else if (date.session1 || date.session2) {
      leaveDays += 0.5; // Half-day if only one session is selected
    }
  });

  return leaveDays;
}


//-----------------------------------Calculating Leave Days-------------------------------------------

// Helper function to calculate the number of leave days considering session1 and session2
function calculateLeaveDays(leaveDates) {
  let leaveDays = 0;

  leaveDates.forEach(date => {
    if (date.session1 && date.session2) {
      leaveDays += 1; // Full day if both sessions are selected
    } else if (date.session1 || date.session2) {
      leaveDays += 0.5; // Half-day if only one session is selected
    }
  });

  return leaveDays;
}


// Helper function to split leave dates into applied leave and LOP dates
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
      // Remaining days should be considered as LOP
      lopDates.push(date);
    }
  }

  return { leaveDatesApplied, lopDates };
}

//-----------------------------------Leave  Request Route-------------------------------------------

router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id; // Assuming you are extracting userId from the token

  // Validate required fields
  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Validate date inputs
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || !Array.isArray(leaveDates)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Calculate the number of leave days based on session1 and session2
    const noOfDays = calculateLeaveDays(leaveDates);

    // Fetch leave type and user leave balance
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });

    // Fetch all leave balances for the user
    const userLeaves = await UserLeave.findAll({ where: { userId } });

    // Find the leave balance for the requested leave type
    const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);
    let leaveBalance = userLeave ? userLeave.leaveBalance : 0;

    // Arrays to store leave dates
    let leaveDatesApplied = [];
    let lopDates = [];

    // If requested leave exceeds balance, apply leave and then LOP for the excess days
    if (leaveBalance < noOfDays) {
      const availableLeaveDays = Math.min(leaveBalance, Math.floor(noOfDays)); // Ensure we apply only the available balance
      const lopDays = noOfDays - availableLeaveDays;

      // Split leaveDates into applied and LOP dates
      const { leaveDatesApplied: appliedDates, lopDates: lopLeaveDates } = splitLeaveDates(leaveDates, availableLeaveDays);

      leaveDatesApplied = appliedDates;
      lopDates = lopLeaveDates;

      // Apply leave for available balance (CL, SL, Comb Off)
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays: availableLeaveDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates: appliedDates // Apply only the available leave dates
      });

      // Apply LOP for the remaining days (if any)
      if (lopDays > 0) {
        const lopLeaveType = await LeaveType.findOne({ where: { leaveTypeName: 'LOP' } });
        if (lopLeaveType) {
          await Leave.create({
            userId,
            leaveTypeId: lopLeaveType.id,
            startDate,
            endDate,
            noOfDays: lopDays,
            notes,
            fileUrl,
            status: 'requested',
            leaveDates: lopLeaveDates // Apply the LOP leave dates
          });
        } else {
          return res.status(404).json({ message: 'LOP leave type not found' });
        }
      }

      // Response includes the leave dates for CL/SL/Comb Off and LOP
      return res.json({
        message: `Leave request submitted. ${availableLeaveDays} days applied as ${leaveType.leaveTypeName} and ${lopDays} days as LOP.`,
        leaveDatesApplied,
        lopDates
      });

    } else {
      // If leave balance is sufficient, apply for all the requested days
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates // Apply all the leave dates as the balance is sufficient
      });

      leaveDatesApplied = leaveDates; // All dates since leave balance is sufficient

      // Send response with leave dates applied and no LOP
      return res.json({
        message: 'Leave request submitted successfully',
        leaveDatesApplied,
        lopDates: [] // No LOP dates in this case
      });
    }

  } catch (error) {
    console.error('Error in leave request submission:', error.message);
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






//-------------------------GET LEAVE BY USER ID-------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching leaves for userId: ${userId}`);


    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let whereClause = {
      userId: userId,
    };
    let limit;
    let offset;


    if (req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;

 
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

   
    const leave = await Leave.findAll({
      order: ['id'],
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




// Approve leave API
router.put('/approveLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;

  try {
    // Find the leave by its ID
    const leave = await Leave.findByPk(leaveId);

    // Check if leave exists
    if (!leave) {
      return res.status(404).send({ message: 'Leave request not found' });
    }

    // Update leave status to 'approved'
    leave.status = 'Approved';
    await leave.save(); // Save the updated leave

    // Send success response
    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {
    // Handle errors
    res.status(500).send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});

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










module.exports = router;

