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
        ].filter(Boolean).join(', '); 
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}` 
  };

  return transporter.sendMail(mailOptions);
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
      lopDates.push(date); 
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
        status: 'requested',
        leaveDates
      });

      return res.json({
        message: 'Leave request submitted successfully as LOP.',
        leaveDatesApplied: leaveDates,
        lopDates: leaveDates 
      });
    }

   
    const userLeaves = await UserLeave.findAll({ where: { userId } });
    const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);

    if (!userLeave) return res.status(404).json({ message: 'User leave record not found' });

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
    console.log(userLeave, "userLeAVE");
    
    if(userLeave){
      console.log(userLeave, "usserLeave");
      
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
      console.log(userLeave, "newUL");
      
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


  //   // Fetch user leave balance for the given leave type
  //   console.log('userIduserIduserId',userId);
    
  //   const userLeaves = await UserLeave.findAll({ where: { userId } });
  //   const userLeave = userLeaves.find(leave => leave.leaveTypeId === leaveType.id);
  //   console.log('userLeaveuserLeave',userLeaves);
    

  //   if (!userLeave) 
  //     // return res.status(404).json({ message: 'User leave record not found' });
  //   {
  //     await UserLeave.create({
  //       userId,
  //       leaveTypeId: leaveType.id,
      
  //       takenLeaves:noOfDays,
       
        
  //     });
  //   }

  //   let leaveBalance = userLeave.leaveBalance;

  //   // If requested leave exceeds balance, inform the user about LOP requirement
  //   if (leaveBalance < noOfDays) {
  //     const availableLeaveDays = leaveBalance; // Apply available balance
  //     const lopDays = noOfDays - availableLeaveDays; // Remaining days as LOP

  //     // Split leaveDates into applied and LOP dates
  //     const { leaveDatesApplied, lopDates } = splitLeaveDates(leaveDates, availableLeaveDays);

  //     // Apply leave for available balance
  //     await Leave.create({
  //       userId,
  //       leaveTypeId: leaveType.id,
  //       startDate,
  //       endDate,
  //       noOfDays: availableLeaveDays,
  //       notes,
  //       fileUrl,
  //       status: 'AdminApproved',
  //       leaveDates: leaveDatesApplied // Save only the applied dates
  //     });

  //     // Notify user of LOP requirement
  //     return res.json({
  //       message: `Emergency Leave request submitted. ${availableLeaveDays} days applied as ${leaveType.leaveTypeName} and ${lopDays} days are beyond balance, which would need to be applied as LOP.`,
  //       leaveDatesApplied,
  //       lopDates: [] // No LOP dates saved, but user is notified
  //     });

  //   } else {
  //     // If leave balance is sufficient, apply for all requested days
  //     await Leave.create({
  //       userId,
  //       leaveTypeId: leaveType.id,
  //       startDate,
  //       endDate,
  //       noOfDays,
  //       notes,
  //       fileUrl,
  //       status: 'AdminApproved',
  //       leaveDates // Apply all the leave dates as balance is sufficient
  //     });

  //     return res.json({
  //       message: 'Emergency Leave request submitted successfully. No LOP days required as balance is sufficient.',
  //       leaveDatesApplied: leaveDates,
  //       lopDates: [] // No LOP days as balance is sufficient
  //     });
  //   }
  // } catch (error) {
  //   console.error('Error in Emergency leave submission:', error.message);
  //   res.status(500).json({ message: error.message });
  // }
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

    // Fetch the leave type name for this leave
    const leaveType = await LeaveType.findOne({
      where: { id: leave.leaveTypeId }
    });

    if (!leaveType) {
      return res.status(404).send({ message: 'Leave type not found' });
    }

    // Fetch the user leave record for the specific user and leave type
    const userLeave = await UserLeave.findOne({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId // Assuming leaveTypeId is present in the leave request
      }
    });

    // Only check for leave record if it's not LOP
    if (!userLeave && leaveType.leaveTypeName !== 'LOP') {
      return res.status(404).send({ message: 'User leave record not found' });
    }

    // Check if the leave type is LOP using leaveTypeName
    if (leaveType.leaveTypeName === 'LOP') {
      // Update the leave status to 'Approved' for LOP without checking leave balance
      leave.status = 'Approved';
      await leave.save();

      // Fetch or create the user leave record for LOP and update taken leaves
      if (!userLeave) {
        // If the user doesn't have a record for LOP, create one
        await UserLeave.create({
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          noOfDays: 0, // For LOP, no specific days are tracked here
          takenLeaves: leave.noOfDays // Increment takenLeaves for LOP
        });
      } else {
        // Update the takenLeaves count for the existing record
        userLeave.takenLeaves += leave.noOfDays;
        await userLeave.save();
      }

      return res.send({ message: 'Leave approved successfully as LOP', leave });
    }

    // For non-LOP leaves, we check the balance and update the user leave record
    if (userLeave.leaveBalance < leave.noOfDays) {
      return res.status(400).send({ message: 'Insufficient leave balance' });
    }

    // Update the leave status to 'Approved'
    leave.status = 'Approved';
    await leave.save();

    // Update the user leave balance
    userLeave.leaveBalance -= leave.noOfDays;
    userLeave.takenLeaves += leave.noOfDays; // Increment taken leaves
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

    // Find the leave entry by its ID
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: `Leave not found with id=${req.params.id}` });
    }

    // Find the user leave mapping record based on the leaveTypeId and userId
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

    // If the leave type is "LOP", skip the balance check
    if (leaveType.leaveTypeName !== 'LOP' && userLeave.leaveBalance < noOfDays) {
      return res.status(400).json({ message: 'Not enough leave balance for this update' });
    }

    // Update the leave dates, notes, and noOfDays with the filtered data
    leave.leaveDates = filteredLeaveDates;
    leave.notes = notes || leave.notes;
    leave.noOfDays = noOfDays;

    // Save the updated leave
    await leave.save();

    // Adjust the taken leaves and balance based on the update, but skip this for LOP
    if (leaveType.leaveTypeName !== 'LOP') {
      const previousNoOfDays = leave.noOfDays; // This is the number of days before the update
      userLeave.takenLeaves += noOfDays - previousNoOfDays;
      userLeave.leaveBalance -= (noOfDays - previousNoOfDays); // Adjust balance according to the updated noOfDays
      await userLeave.save();
    }

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

