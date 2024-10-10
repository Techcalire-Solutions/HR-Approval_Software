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


//-----------------------------------POST API-------------------------------------------------------------
// Function to calculate the number of leave days, considering session1 and session2
function calculateLeaveDays(leaveDates) {
  let totalDays = 0;

  leaveDates.forEach(date => {
    if (date.session1 && date.session2) {
      totalDays += 1;  // Both sessions selected, count as 1 day
    } else if (date.session1 || date.session2) {
      totalDays += 0.5;  // Only one session selected, count as 0.5 days
    }
  });

  return totalDays;
}

// Function to split leave dates into applied and LOP dates
function splitLeaveDates(leaveDates, availableLeaveDays) {
  let leaveDatesApplied = [];
  let lopDates = [];
  let appliedDays = 0;

  for (let date of leaveDates) {
    let daysForDate = 0;

    // Count each session separately for the current date
    if (date.session1) daysForDate += 0.5;
    if (date.session2) daysForDate += 0.5;

    if (appliedDays + daysForDate <= availableLeaveDays) {
      leaveDatesApplied.push(date); // Add to applied leave
      appliedDays += daysForDate;
    } else {
      lopDates.push(date); // Add remaining days to LOP
    }
  }

  return { leaveDatesApplied, lopDates };
}


router.post('/1', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Calculate number of leave days based on session1 and session2
    const noOfDays = calculateLeaveDays(leaveDates);

    // Fetch leave type and user leave balance
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });

    // Fetch user leave balance for the given leave type
    const userLeaves = await UserLeave.findAll({ where: { userId } });
    const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

    if (!userLeave) return res.status(404).json({ message: 'User leave record not found' });

    let leaveBalance = userLeave.leaveBalance;

    // If requested leave exceeds balance, inform the user about LOP requirement
    if (leaveBalance < noOfDays) {
      const availableLeaveDays = leaveBalance; // Apply available balance
      const lopDays = noOfDays - availableLeaveDays; // Remaining days as LOP

      // Split leaveDates into applied and LOP dates
      const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

      // Apply leave for available balance
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays: availableLeaveDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates: leaveDatesApplied // Save only the applied dates
      });

      // Notify user of LOP requirement
      return res.json({
        message: `Leave request submitted. ${availableLeaveDays} days applied as ${leaveType.leaveTypeName} and ${lopDays} days are beyond balance, which would need to be applied as LOP.`,
        leaveDatesApplied,
        lopDates: [] // No LOP dates saved, but user is notified
      });

    } else {
      // If leave balance is sufficient, apply for all requested days
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates // Apply all the leave dates as balance is sufficient
      });

      return res.json({
        message: 'Leave request submitted successfully. No LOP days required as balance is sufficient.',
        leaveDatesApplied: leaveDates,
        lopDates: [] // No LOP days as balance is sufficient
      });
    }
  } catch (error) {
    console.error('Error in leave request submission:', error.message);
    res.status(500).json({ message: error.message });
  }
});


router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Calculate number of leave days based on session1 and session2
    const noOfDays = calculateLeaveDays(leaveDates);

    // Fetch leave type
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });

    // Check if LOP is requested (if leaveTypeId corresponds to LOP)
    if (leaveType.leaveTypeName === 'LOP') {
      // Apply LOP directly
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates
      });

      return res.json({
        message: 'Leave request submitted successfully as LOP.',
        leaveDatesApplied: leaveDates,
        lopDates: leaveDates // Apply the same dates as LOP
      });
    }

    // For non-LOP leaves, fetch user leave balance
    const userLeaves = await UserLeave.findAll({ where: { userId } });
    const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

    if (!userLeave) return res.status(404).json({ message: 'User leave record not found' });

    let leaveBalance = userLeave.leaveBalance;

    // If requested leave exceeds balance, inform the user about LOP requirement
    if (leaveBalance < noOfDays) {
      const availableLeaveDays = leaveBalance; // Apply available balance
      const lopDays = noOfDays - availableLeaveDays; // Remaining days as LOP

      // Split leaveDates into applied and LOP dates
      const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

      // Apply leave for available balance
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays: availableLeaveDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates: leaveDatesApplied // Save only the applied dates
      });

      // Optionally save the LOP dates (if needed)
      if (lopDays > 0) {
        await Leave.create({
          userId,
          leaveTypeId: leaveType.id,  // Or LOP leave type if different
          startDate,
          endDate,
          noOfDays: lopDays,
          notes,
          fileUrl,
          status: 'requested',
          leaveDates: lopDates // Save LOP dates if applicable
        });
      }

      // Notify user of LOP requirement
      return res.json({
        message: `Leave request submitted. ${availableLeaveDays} days applied as ${leaveType.leaveTypeName} and ${lopDays} days are beyond balance, which would need to be applied as LOP.`,
        leaveDatesApplied,
        lopDates: lopDates || [] // Return LOP dates if saved
      });

    } else {
      // If leave balance is sufficient, apply for all requested days
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays,
        notes,
        fileUrl,
        status: 'requested',
        leaveDates // Apply all the leave dates as balance is sufficient
      });

      return res.json({
        message: 'Leave request submitted successfully. No LOP days required as balance is sufficient.',
        leaveDatesApplied: leaveDates,
        lopDates: [] // No LOP days as balance is sufficient
      });
    }
  } catch (error) {
    console.error('Error in leave request submission:', error.message);
    res.status(500).json({ message: error.message });
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
    const leave = await Leave.findByPk(leaveId);

   
    if (!leave) {
      return res.status(404).send({ message: 'Leave request not found' });
    }

   
    leave.status = 'Approved';
    await leave.save(); 

  
    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {

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

    // Filter out any invalid leaveDates (where both session1 and session2 are missing)
    const filteredLeaveDates = leaveDates.filter(leaveDate => 
      leaveDate.session1 || leaveDate.session2
    );

    // If there are no valid leave dates after filtering, delete the entire leave row
    if (filteredLeaveDates.length === 0) {
      await leave.destroy();
      return res.json({ message: 'Leave record deleted as no valid sessions were provided.' });
    }

    // Calculate the new number of leave days based on the filtered leaveDates
    const noOfDays = calculateLeaveDays(filteredLeaveDates);

    // If the updated leave days exceed the balance, return error
    if (userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance for this update' });
    }

    // Update the leave dates, notes, and noOfDays with the filtered data
    leave.leaveDates = filteredLeaveDates;
    leave.notes = notes || leave.notes;
    leave.noOfDays = noOfDays;

    // Save the updated leave
    await leave.save();

    // Adjust the taken leaves and balance based on the update
    const previousNoOfDays = leave.noOfDays; // This is the number of days before the update
    userLeave.takenLeaves += noOfDays - previousNoOfDays;
    userLeave.leaveBalance -= (noOfDays - previousNoOfDays); // Adjust balance according to the updated noOfDays
    await userLeave.save();

    res.json({
      message: 'Leave updated successfully',
      leave: {
        userId: leave.userId,
        leaveTypeId,
        leaveDates: filteredLeaveDates,  // Send back the filtered leave dates
        noOfDays,
        notes: leave.notes,
      },
    });
  } catch (error) {
    console.error('Error updating leave:', error.message);
    res.status(500).json({ message: error.message });
  }
});



// Code for retrieving and processing leave items (example)
async function getLeaveItem(leaveId) {
  const leaveItem = await Leave.findByPk(leaveId);
  
  if (!leaveItem) {
    throw new Error(`Leave not found for id=${leaveId}`);
  }

  // Parse leaveDates if it is a string (after being saved as JSON)
  let leaveDates = [];
  try {
    leaveDates = JSON.parse(leaveItem.leaveDates);  // Parse JSON string back to array
  } catch (error) {
    throw new Error('Error parsing leaveDates from database');
  }

  // Now you can safely loop over leaveDates
  leaveDates.forEach(date => {
    console.log(date.date, date.session1, date.session2);
  });

  return leaveItem;
}


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
    
    const leave = await Leave.findAll({
      order: [['id', 'DESC']], 
      include: [
        {
          model: LeaveType,
          attributes: ['leaveTypeName'], 
        },
        {
          model: User, 
          attributes: ['name'],
        },
      ],
  
    });

    
    if (leave.length > 0) {
      console.log('Leave records found:', leave); 
      res.json({ leave: leave, res: true });
    } else {
      console.log('No leave records found.');
      res.json({ message: 'No leave records found.', res: false });
    }
  } catch (error) {
   
    console.error('Error fetching leave records:', error.message);
    res.status(500).json({ message: 'An error occurred while fetching leave records.', error: error.message });
  }
});






module.exports = router;

