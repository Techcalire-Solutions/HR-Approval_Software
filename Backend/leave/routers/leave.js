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

//-----------------------------------Calculating Leave Days-------------------------------------------
function calculateLeaveDays(leaveDates) {
  let noOfDays = 0;

  leaveDates.forEach(({ session1, session2 }) => {
    if (session1 && session2) {
      noOfDays += 1; 
    } else if (session1 || session2) {
      noOfDays += 0.5; 
    }
  });

  return noOfDays;
}
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



function calculateLeaveDays(leaveDates) {
  return leaveDates.length; 
}

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


//----------------------------POST API------------------------------------------------------------
router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id;

  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || !Array.isArray(leaveDates)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const noOfDays = calculateLeaveDays(leaveDates);
    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });

    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });

    let userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId: leaveType.id } });
    
    if (!userLeave) {
      if (leaveType.leaveTypeName === 'LOP') {
        userLeave = await UserLeave.create({ userId, leaveTypeId: leaveType.id, noOfDays: 0, takenLeaves: 0, leaveBalance: Infinity });
      } else {
        return res.status(404).json({ message: 'User leave mapping not found' });
      }
    }

    if (leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance' });
    }

    const leave = await Leave.create({ userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl, status: 'requested', leaveDates });
    
    await sendLeaveEmail(userId, leaveType, startDate, endDate, notes, noOfDays, leaveDates);

    res.json({ message: 'Leave request submitted successfully', leave });
  } catch (error) {
    res.send(error.message)
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

//--------------------------GET LEAVE------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [
        {
          model: LeaveType,  
          // as: 'leaveType',  
          attributes: ['leaveTypeName'] 
        },
        {
          model: User,       
          // as: 'user',       
          attributes: ['name'] 
        }
      ]
    });

    res.send(leaves);
  } catch (error) {
    res.status(500).send(error.message); // Send an error with status code
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
    leave.status = 'approved';
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

   
    leave.status = 'rejected';
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

