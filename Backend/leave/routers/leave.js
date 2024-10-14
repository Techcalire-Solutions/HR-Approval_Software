const express = require('express');
const router =  express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user')
const LeaveType = require('../models/leaveType')
 const nodemailer = require('nodemailer');
 const { Op } = require('sequelize');
 const sequelize = require('../../utils/db');
 const Role = require('../../users/models/role')
 const upload = require('../../utils/leaveDocumentMulter');
 const s3 = require('../../utils/s3bucket');
 const UserPersonal = require('../../users/models/userPersonal');


 
//-----------------------------------Mail code-------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});


//-------------------------------------Find HR Mail and Reporting manager mail-----------------------------------------------------
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

async function getReportingManagerEmailForUser(userId) {
  try {

    const userPersonal = await UserPersonal.findOne({
      where: { userId },
      attributes: ['reportingMangerId'],
    });

    if (!userPersonal) {
      return `User with id ${userId} not found`;
    }

    
    const reportingMangerId = userPersonal.reportingMangerId;
    if (!reportingMangerId) {
      return `No reporting manager found for userId ${userId}`;
    }


    const reportingManager = await User.findOne({
      where: { id: reportingMangerId },
      attributes: ['email'],  
    });

    if (reportingManager) {
      return reportingManager.email;  
    } else {
      return `Reporting manager not found for reportingMangerId ${reportingMangerId}`;
    }
  } catch (error) {
    console.error('Error fetching reporting manager email:', error);
    return 'Error fetching reporting manager email';
  }
}




//-------------------------------------Mail sending function------------------------------------------
async function sendLeaveEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const hrAdminEmail = await getHREmail();
  const reportingManagerEmail = await getReportingManagerEmailForUser(user.id);


  if (!Array.isArray(leaveDates)) {
    throw new Error('leaveDates must be an array');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    cc:  [hrAdminEmail, reportingManagerEmail], 
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
        ].filter(Boolean).join(', '); 
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}` 
  };

  return transporter.sendMail(mailOptions);
}


async function sendLeaveUpdatedEmail(user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const hrAdminEmail = await getHREmail();
  const reportingManagerEmail = await getReportingManagerEmailForUser(user.id);

  if (!Array.isArray(leaveDates)) {
    throw new Error('leaveDates must be an array');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    cc: [hrAdminEmail, reportingManagerEmail],
    subject: 'Leave Request Updated',
    text: `A leave request has been updated:
    - Username: ${user.name}
    - Leave Type: ${leaveType.leaveTypeName}
    - Start Date: ${startDate}
    - End Date: ${endDate}
    - Notes: ${notes || 'No additional notes provided'}
    - Number of Days: ${noOfDays}
    - Leave Dates: ${leaveDates.map(item => {
      const sessionString = [
        item.session1 ? 'session1' : '',
        item.session2 ? 'session2' : ''
      ].filter(Boolean).join(', ');
      return `${item.date} (${sessionString || 'No sessions selected'})`;
    }).join(', ')}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Leave update email sent successfully');
  } catch (error) {
    console.error('Error sending leave update email:', error);
  }
}



//-----------------------------------ASYNC FUNCTIONS-----------POST API-------------------------------------------------------------

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




router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id;

  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const user = await User.findByPk(userId);

  try {


    const noOfDays = calculateLeaveDays(leaveDates);


    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });

    if (leaveType.leaveTypeName === 'LOP') {
      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays,
        notes,
        fileUrl,
        status: 'Requested',
        leaveDates
      });

      sendLeaveEmail(user,leaveType,startDate,endDate,notes,noOfDays,leaveDates)

      return res.json({
        message: 'Leave request submitted successfully as LOP.',
        leaveDatesApplied: leaveDates,
        lopDates: leaveDates 
      });
    }

    const userLeaves = await UserLeave.findAll({ where: { userId } });
    const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

    if(!userLeave){
      return res.json({
        message: 'User leave record not found'
      });
    }

    let leaveBalance = userLeave.leaveBalance;

    if (leaveBalance === 0 && leaveType.leaveTypeName !== 'LOP') {
      return res.json({
        message: `Your ${leaveType.leaveTypeName} balance is 0. No leave will be applied.`,
      });
    }

    if (leaveBalance < noOfDays) {
      const availableLeaveDays = leaveBalance; 
      const lopDays = noOfDays - availableLeaveDays;
    
      const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

    


      await Leave.create({
        userId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        noOfDays: availableLeaveDays, 
        notes,
        fileUrl,
        status: 'requested',
        leaveDates: leaveDatesApplied 
      });

      sendLeaveEmail(user,leaveType,startDate,endDate,notes,noOfDays,leaveDates)

      return res.json({
        message: `Leave request submitted. ${availableLeaveDays} days applied as ${leaveType.leaveTypeName} and ${lopDays} days are beyond balance. Please apply for the remaining days as LOP separately.`,
        leaveDatesApplied,
        lopDates: lopDates || [] 
      });
    } else {
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

      sendLeaveEmail(user,leaveType,startDate,endDate,notes,noOfDays,leaveDates)

      return res.json({
        message: 'Leave request submitted successfully. No LOP days required as balance is sufficient.',
        leaveDatesApplied: leaveDates,
        lopDates: [] 
      });
    }
    
  } catch (error) {
    console.error('Error in leave request submission:', error.message);
    res.status(500).json({ message: error.message });
  }
});



//------------------------------------------------Emergency leave-----------------------------

router.post('/emergencyLeave', authenticateToken, async (req, res) => {
  const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;

  if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
  } catch (error) {
    res.send(error.message)
  }

  const noOfDays = calculateLeaveDays(leaveDates);
  try {
    userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });

    
    if(userLeave){

      
      if(leaveType.leaveTypeName === 'LOP' || userLeave.leaveBalance >= noOfDays){
        if(userLeave.noOfDays) { userLeave.leaveBalance -= noOfDays; }
        userLeave.takenLeaves += noOfDays;
        await userLeave.save();
      }else{
        return res.send("Exceeds the balance allotted leave days")
      }
    }else{
      userLeave = await UserLeave.create({
        userId,
        leaveTypeId: leaveTypeId,
        takenLeaves: noOfDays,
      });

      
    }
    let leave;
    try {
      leave = await Leave.create({ userId, leaveTypeId: leaveType.id, startDate, endDate, noOfDays, notes, fileUrl, status: 'AdminApproved', leaveDates });
    } catch (error) {
      res.send(error.message)
    }
    res.json({userLeave, leave})
  } catch (error) {
    res.send(error.message)
  }
});

router.patch('/updateemergencyLeave/:id', authenticateToken, async (req, res) => {
  
  const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;

  if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
  } catch (error) {
    res.send(error.message)
  }

  const noOfDays = calculateLeaveDays(leaveDates);

  let leave;
  try {
    leave = await Leave.findByPk(req.params.id)
    addedDays = leave.noOfDays

    try {
      userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });
  
      if(userLeave){
        userLeave.noOfDays += addedDays;
        userLeave.leaveBalance += addedDays;
        await userLeave.save();
        if(leaveType.leaveTypeName === 'LOP' || userLeave.leaveBalance >= noOfDays){
          if(userLeave.noOfDays) { userLeave.leaveBalance -= noOfDays; }
          userLeave.takenLeaves += noOfDays;
          await userLeave.save();
        }else{
          return res.send("Exceeds the balance allotted leave days")
        }
      }else{
        userLeave = await UserLeave.create({
          userId,
          leaveTypeId: leaveTypeId,
          takenLeaves: noOfDays,
        });
      }
    } catch (error) {
      res.send(error.message)
    }

    leave.userId = userId
    leave.noOfDays = noOfDays
    leave.startDate = startDate, 
    leave.endDate = endDate, 
    leave.noOfDays = noOfDays,
    leave.notes = notes,
    leave.fileUrl = fileUrl, 
    leave.leaveDates = leaveDates

    await leave.save();
    res.json({leave, userLeave})
  } catch (error) {
    res.send(error.message)
  }

});

//-------------------------GET LEAVE BY USER ID-------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;



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

    const leaveType = await LeaveType.findOne({
      where: { id: leave.leaveTypeId }
    });

    if (!leaveType) {
      return res.status(404).send({ message: 'Leave type not found' });
    }


    const userLeave = await UserLeave.findOne({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId 
      }
    });


    if (!userLeave && leaveType.leaveTypeName !== 'LOP') {
      return res.status(404).send({ message: 'User leave record not found' });
    }


    if (leaveType.leaveTypeName === 'LOP') {
     
      leave.status = 'Approved';
      await leave.save();


      if (!userLeave) {
 
        await UserLeave.create({
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          noOfDays: 0, 
          takenLeaves: leave.noOfDays 
        });
      } else {
     
        userLeave.takenLeaves += leave.noOfDays;
        await userLeave.save();
      }

      return res.send({ message: 'Leave approved successfully as LOP', leave });
    }


    if (userLeave.leaveBalance < leave.noOfDays) {

      return res.json({
        message: 'Insufficient leave balance'
      })
    }


    leave.status = 'Approved';
    await leave.save();

  
    userLeave.leaveBalance -= leave.noOfDays;
    userLeave.takenLeaves += leave.noOfDays; 
    await userLeave.save();

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


//-------------------------------------- UPDATE API---------------------------------------------------

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { leaveDates, notes, leaveTypeId } = req.body;
    if (!leaveDates) {
      return res.status(400).json({ message: 'leaveDates are required to update leave' });
    }


    const leave = await Leave.findByPk(req.params.id, {
      include: [User], 
    });
    
    if (!leave) {
      return res.status(404).json({ message: `Leave not found with id=${req.params.id}` });
    }

    const leaveType = await LeaveType.findOne({
      where: { id: leaveTypeId }
    });

    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    const userLeave = await UserLeave.findOne({
      where: { userId: leave.userId, leaveTypeId }
    });

    if (!userLeave) {
      return res.status(404).json({ message: 'User leave mapping not found' });
    }

  
    const filteredLeaveDates = leaveDates.filter(leaveDate => 
      leaveDate.session1 || leaveDate.session2
    );


    if (filteredLeaveDates.length === 0) {
      await leave.destroy();
      return res.json({ message: 'Leave record deleted as no valid sessions were provided.' });
    }


    const noOfDays = calculateLeaveDays(filteredLeaveDates);


    if (leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance for this update' });
    }


    leave.leaveDates = filteredLeaveDates;
    leave.notes = notes || leave.notes;
    leave.noOfDays = noOfDays;


    await leave.save();

 
    if (leaveType.leaveTypeName !== 'LOP') {
      const previousNoOfDays = leave.noOfDays; 
      userLeave.takenLeaves += noOfDays - previousNoOfDays;
      userLeave.leaveBalance -= (noOfDays - previousNoOfDays);
      await userLeave.save();
    }

     const startDate = leave.leaveDates[0].date; 
     const endDate = leave.leaveDates[leave.leaveDates.length - 1].date; 


     await sendLeaveUpdatedEmail(
       leave.user, 
       leaveType, 
       startDate, 
       endDate, 
       notes, 
       noOfDays, 
       filteredLeaveDates 
     );

    res.json({
      message: 'Leave updated successfully',
      leave: {
        userId: leave.userId,
        leaveTypeId,
        leaveDates: filteredLeaveDates,  
        noOfDays,
        notes: leave.notes,
      },
    });
  } catch (error) {
    console.error('Error updating leave:', error.message);
    res.status(500).json({ message: error.message });
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


//------------------------------------------Get Leaves-------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Initialize the where clause and pagination variables
    let whereClause = {};
    let limit;
    let offset;

    // Check if both pageSize and page are provided in the query params
    if (typeof req.query.pageSize !== 'undefined' && typeof req.query.page !== 'undefined') {
      limit = parseInt(req.query.pageSize, 10); // Convert pageSize to an integer
      offset = (parseInt(req.query.page, 10) - 1) * limit; // Calculate offset based on page number and pageSize

      // Check if search query is present
      if (req.query.search && req.query.search.trim() !== '') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('Leave.status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ]
        };
      }
    } else {
      // If no pagination, apply the search term and default to active status only
      if (req.query.search && req.query.search.trim() !== '') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('Leave.status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ],
          // Change this line if status is a string in the database
          status: 'true' // Change to 'false' if you want to include inactive statuses
        };
      } else {
        whereClause = { status: 'true' }; // Default to 'true' if no search term
      }
    }

    // Query the database for leave records based on whereClause, pagination, and include relations
    const leave = await Leave.findAll({
      order: [['id', 'DESC']], // Order by ID in descending order
      limit, // Pagination limit
      offset, // Pagination offset
      where: whereClause,
      include: [
        {
          model: LeaveType,
          attributes: ['id', 'leaveTypeName'], // Include leave type details
        },
        {
          model: User,
          attributes: ['name'] // Include user name
        }
      ]
    });

    // Get the total count of leave records that match the whereClause
    const totalCount = await Leave.count({ where: whereClause });

    // If pagination is applied, return both count and leave items
    if (typeof req.query.page !== 'undefined' && typeof req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {
      // If no pagination, return the leave records directly
      res.json(leave);
    }
  } catch (error) {
    // Catch and send any errors encountered during the request
    res.status(500).send(error.message);
  }
});

//--------------------------------------------File delete------------------------------------------------------
router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  try {
    try {
        let result = await Leave.findByPk(id);
        fileKey = result.url  ;
        result.url   = '';
        await result.save();
    } catch (error) {
      res.send(error.message)
    }
    let key;
    if (!fileKey) {
      key = req.query.key;
      
      fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).send({ message: error.message });
  }
});

router.delete('/filedeletebyurl', authenticateToken, async (req, res) => {
    key = req.query.key;
    fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    try {
      if (!fileKey) {
        return res.send({ message: 'No file key provided' });
      }

      // Set S3 delete parameters
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };

      // Delete the file from S3
      await s3.deleteObject(deleteParams).promise();

      res.status(200).send({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      res.status(500).send({ message: error.message });
    }
});



module.exports = router;

