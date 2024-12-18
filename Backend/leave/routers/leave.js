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
 const UserPosition = require('../../users/models/userPosition');
const Notification = require('../../notification/models/notification');

 
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

 
  const userPosition = await UserPosition.findOne({ where: { userId: hrAdminUser.id } });
  if (!userPosition) {
    throw new Error('User position not found for HR Admin');
  }


  return userPosition.officialMailId; 
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

    console.log("reportingMangerIdreportingMangerId",reportingMangerId);
    
    if (!reportingMangerId) {
      return `No reporting manager found for userId ${userId}`;
    }

 
    const reportingManagerPosition = await UserPosition.findOne({
      where: { userId: reportingMangerId },
      attributes: ['officialMailId'],  
    });

    if (reportingManagerPosition) {
      return reportingManagerPosition.officialMailId;  
    } else {
      return `Reporting manager position not found for reportingMangerId ${reportingMangerId}`;
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
    to: reportingManagerEmail,
    cc: hrAdminEmail,
    subject: 'New Leave Request Submitted',
    

    html:`
    <p>A new leave request has been submitted:</p>
    <p>Username: ${user.name}</p>
    <p> Leave Type: ${leaveType.leaveTypeName}</p>
    <p> Start Date: ${startDate}</p>
    <p>End Date: ${endDate}</p>
    <p> Notes: ${notes}</p>
   <p>Number of Days: ${noOfDays}</p>
   <p>Leave Dates: ${leaveDates.map(item => {
        const sessionString = [
          item.session1 ? 'session1' : '',
          item.session2 ? 'session2' : ''
        ].filter(Boolean).join(', '); 
        return `${item.date} (${sessionString || 'No sessions selected'})`;
      }).join(', ')}</p>
    `,

      
  };

  return transporter.sendMail(mailOptions);
}


async function sendLeaveUpdatedEmail(leaveId,user, leaveType, startDate, endDate, notes, noOfDays, leaveDates) {
  const hrAdminEmail = await getHREmail();
  const reportingManagerEmail = await getReportingManagerEmailForUser(user.id);

  

  if (!Array.isArray(leaveDates)) {
    throw new Error('leaveDates must be an array');
  }
  const approveUrl = `http://localhost:8000/leave/approveLeave/${leaveId}`
  const rejectUrl = `http://localhost:8000/leave/rejectLeave/${leaveId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: reportingManagerEmail,
    cc: hrAdminEmail,
    subject: 'Leave Request Updated',
    html: `
<h3>A leave request has been updated:</h3>
      <ul>
        <li><strong>Username:</strong> ${user.name}</li>
        <li><strong>Leave Type:</strong> ${leaveType.leaveTypeName}</li>
        <li><strong>Start Date:</strong> ${startDate}</li>
        <li><strong>End Date:</strong> ${endDate}</li>
        <li><strong>Notes:</strong> ${notes || 'No additional notes provided'}</li>
        <li><strong>Number of Days:</strong> ${noOfDays}</li>
        <li><strong>Leave Dates:</strong>
          <ul>
            ${leaveDates.map(item => {
              const sessionString = [
                item.session1 ? 'session1' : '',
                item.session2 ? 'session2' : ''
              ].filter(Boolean).join(', ');
              return `<li>${item.date} (${sessionString || 'No sessions selected'})</li>`;
            }).join('')}
          </ul>
        </li>
      </ul>
        <div style= margin-top: 20px;">
      <a href="${approveUrl}"
       style="
                display: inline-block;
                padding: 12px 25px;
                font-size: 16px;
                color: white;
                background-color: #28a745;
                text-decoration: none;
                border-radius: 50px; /* Oval shape */
                border: 2px solid #28a745;
                margin: 10px;
                transition: background-color 0.3s ease;
              "
              onmouseover="this.style.backgroundColor='#218838';"
              onmouseout="this.style.backgroundColor='#28a745';">
              Approve
            </a>
  
      <a href="${rejectUrl}"
             style="
                display: inline-block;
                padding: 12px 25px;
                font-size: 16px;
                color: white;
                background-color: #dc3545;
                text-decoration: none;
                border-radius: 50px; /* Oval shape */
                border: 2px solid #dc3545;
                margin: 10px;
                transition: background-color 0.3s ease;
              "
              onmouseover="this.style.backgroundColor='#c82333';"
              onmouseout="this.style.backgroundColor='#dc3545';">
              Reject
      </a>
    </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Leave update email sent successfully');
  } catch (error) {
    console.error('Error sending leave update email:', error);
  }
}


//---------------------------------Mail Approval and Reject-----------------------------------------------------------
router.get('/approveLeave/:id', async (req, res) => {
  const leaveId = req.params.id;


  try {
   
    const leave = await Leave.findByPk(leaveId);
    const userId = leave.userId

    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }


    leave.status = 'Approved';
    await leave.save();

    await Notification.create({
      userId: userId,
      message: `Leave Request Approved`,
      isRead: false,
  });


        res.send(`
          <html>
            <body>
              <script>
                alert('Leave Approved: The leave has been approved successfully.');
                window.close(); // Optional: close the tab after showing the alert
              </script>
            </body>
          </html>
        `);
  } catch (error) {
    console.error('Error approving leave:', error);
    res.send('<h1>Error</h1><p>An error occurred while approving the leave.</p>');
  }
});

router.get('/rejectLeave/:id', async (req, res) => {
  const leaveId = req.params.id;

  try {
 
    const leave = await Leave.findByPk(leaveId);

    const userId = leave.userId;

    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }

  
    leave.status = 'Rejected';
    await leave.save();

    await Notification.create({
      userId: userId,
      message: `Leave Request Approved`,
      isRead: false,
  });


        res.send(`
          <html>
            <body>
              <script>
                alert('Leave Rejected: The leave has been rejected successfully.');
                window.close(); // Optional: close the tab after showing the alert
              </script>
            </body>
          </html>
        `);
  } catch (error) {
    console.error('Error approving leave:', error);
    res.send('<h1>Error</h1><p>An error occurred while approving the leave.</p>');
  }
});



//-----------------------------------ASYNC FUNCTIONS---------------------------------------------------

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


//---------------------------------------LEAVE REQUEST API--------------------------------------------------------

router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;
  const userId = req.user.id;


  const reportingManagerEmail = await getReportingManagerEmailForUser(req.user.id);
  console.log("reportingManagerEmail",reportingManagerEmail);

  if (!leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.send( 'Missing required fields' );
  }

  const user = await User.findByPk(userId);

  try {


    const noOfDays = calculateLeaveDays(leaveDates);


    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.json({ message: 'Leave type not found' });

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

      await Notification.create({
        userId: userId,
        message: `Leave request submitted`,
        isRead: false,
    });

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
          message: `You do not have ${leaveType.leaveTypeName} leave allotted.`
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

 
      await Notification.create({
        userId: userId,
        message: `Leave request submitted`,
        isRead: false,
    });

      return res.json({
        message: `${availableLeaveDays} days applied as ${leaveType.leaveTypeName}.${lopDays} days are beyond balance; apply for LOP separately.`,

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

      
      await Notification.create({
        userId: userId,
        message: `Leave request submitted`,
        isRead: false,
    });

      return res.json({
        message: 'Leave request successful.',
        leaveDatesApplied: leaveDates,
        lopDates: [] ,
        startDate: startDate,  
        endDate: endDate
      });

    }
    
  } catch (error) {
    console.error('Error in leave request submission:', error.message);
    res.json({ message: error.message });
  }
});



//------------------------------------------------Emergency leave-----------------------------

router.post('/emergencyLeave', authenticateToken, async (req, res) => {
  const { userId, leaveTypeId, startDate, endDate, notes, fileUrl, leaveDates } = req.body;

  if (!userId || !leaveTypeId || !startDate || !endDate || !leaveDates) {
    return res.json({ message: 'Missing required fields' });
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.json({ message: 'Leave type not found' });
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
    return res.json({ message: 'Missing required fields' });
  }

  let userLeave;
  let leaveType;
  try {
    leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });
    if (!leaveType) return res.json({ message: 'Leave type not found' });
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
      return res.json({ message: 'User not found' });
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
    res.send({ message: error.message });
  }
});


//--------------------------------- Approve leave API-----------------------------------------------

router.put('/approveLeave/:id', authenticateToken,async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body; 


  try {
    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }

    const userId = leave.userId;

    const leaveType = await LeaveType.findOne({
      where: { id: leave.leaveTypeId }
    });

    if (!leaveType) {
      return res.send({ message: 'Leave type not found' });
    }


    const userLeave = await UserLeave.findOne({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId 
      }
    });


    if (!userLeave && leaveType.leaveTypeName !== 'LOP') {
      return res.send({ message: 'User leave record not found' });
    }


    if (leaveType.leaveTypeName === 'LOP') {
     
      leave.status = 'Approved';
      leave.adminNotes = adminNotes; 
      await leave.save();

      await Notification.create({
        userId: userId,
        message: `Leave Request Approved`,
        isRead: false,
    });
  


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
    leave.adminNotes = adminNotes; 
    await leave.save();

  
    userLeave.leaveBalance -= leave.noOfDays;
    userLeave.takenLeaves += leave.noOfDays; 
    await userLeave.save();

    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {
    res.send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});

//------------------------------------Reject----------------------------------------------

router.put('/rejectLeave/:id', authenticateToken, async (req, res) => {
  const leaveId = req.params.id;
  const { adminNotes } = req.body; 

  try {
    const leave = await Leave.findByPk(leaveId);

    const userId = req.user.id;

   
    if (!leave) {
      return res.send({ message: 'Leave request not found' });
    }

   
    leave.status = 'Rejected';
    leave.adminNotes = adminNotes; 
    await leave.save(); 

    await Notification.create({
      userId: userId,
      message: `Leave Request Rejected`,
      isRead: false,
  });

  
    res.send({ message: 'Leave approved successfully', leave });
  } catch (error) {

    res.send({ message: 'An error occurred while approving the leave', error: error.message });
  }
});


//-------------------------GET BY ID--------------------------------------------------------------

router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (leave) {
      res.json(leave);
    } else {
      res.json({ message: `Leave not found` });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});


//-------------------------------------- UPDATE API---------------------------------------------------
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { leaveDates, notes, leaveTypeId } = req.body;
    if (!leaveDates) {
      return res.json({ message: 'leaveDates are required to update leave' });
    }

    const leave = await Leave.findByPk(req.params.id, {
      include: [User],
    });

    if (!leave) {
      return res.json({ message: `Leave not found with id=${req.params.id}` });
    }

    const leaveType = await LeaveType.findOne({
      where: { id: leaveTypeId },
    });

    if (!leaveType) {
      return res.json({ message: 'Leave type not found' });
    }



    let userLeave;


    if (leaveType.leaveTypeName !== 'LOP') {
      userLeave = await UserLeave.findOne({
        where: { userId: leave.userId, leaveTypeId },
      });

      console.log('User Leave Mapping:', userLeave);

      if (!userLeave) {
        return res.json({ message: 'User leave mapping not found' });
      }
    }

    const filteredLeaveDates = leaveDates.filter(leaveDate =>
      leaveDate.session1 || leaveDate.session2
    );

    if (filteredLeaveDates.length === 0) {
      await leave.destroy();
      return res.json({ message: 'Leave record deleted as no valid sessions were provided.' });
    }

    const noOfDays = calculateLeaveDays(filteredLeaveDates);


    if (leaveType.leaveTypeName === 'LOP') {
      leave.leaveDates = filteredLeaveDates;
      leave.notes = notes || leave.notes;
      leave.noOfDays = noOfDays;

      await leave.save();

      const startDate = leave.leaveDates[0].date;
      const endDate = leave.leaveDates[leave.leaveDates.length - 1].date;

      await sendLeaveUpdatedEmail(
        leaveId,
        leave.user,
        leaveType,
        startDate,
        endDate,
        notes,
        noOfDays,
        filteredLeaveDates
      );

      return res.json({
        message: 'Leave updated successfully (LOP)',
        leave: {
          userId: leave.userId,
          leaveTypeId,
          leaveDates: filteredLeaveDates,
          noOfDays,
          notes: leave.notes,
        },
      });
    }

    if (userLeave.leaveBalance < noOfDays) {
      return res.json({ message: 'Not enough leave balance for this update' });
    }

    leave.leaveDates = filteredLeaveDates;
    leave.notes = notes || leave.notes;
    leave.noOfDays = noOfDays;

    await leave.save();

    const previousNoOfDays = leave.noOfDays;
    userLeave.takenLeaves += noOfDays - previousNoOfDays;
    userLeave.leaveBalance -= (noOfDays - previousNoOfDays);
    await userLeave.save();

    const startDate = leave.leaveDates[0].date;
    const endDate = leave.leaveDates[leave.leaveDates.length - 1].date;

    await sendLeaveUpdatedEmail(
      leaveId,
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
    console.error('Error updating leave:', error);
    res.json({ message: error.message });
  }
});


//-----------------------------Delete Leave---------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const result = await Leave.destroy({ where: { id: req.params.id }, force: true });
    result ? res.json({ message: `Leave with ID ${req.params.id} deleted successfully` }) : res.json({ message: "Leave not found" });
  } catch (error) {
    res.send(error.message);
  }
});


//------------------------------------------Get Leaves Pagination------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
 
    let whereClause = {};
    let limit;
    let offset;

  
    if (typeof req.query.pageSize !== 'undefined' && typeof req.query.page !== 'undefined') {
      limit = parseInt(req.query.pageSize, 10); 
      offset = (parseInt(req.query.page, 10) - 1) * limit; 

      
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
   
      if (req.query.search && req.query.search.trim() !== '') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('Leave.status'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ],
         
          status: 'true' 
        };
      } else {
        whereClause = { status: 'true' }; 
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
        },
        {
          model: User,
          attributes: ['name'] 
        }
      ]
    });

  
    const totalCount = await Leave.count({ where: whereClause });

  
    if (typeof req.query.page !== 'undefined' && typeof req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: leave,
      };
      res.json(response);
    } else {
    
      res.json(leave);
    }
  } catch (error){
    res.send(error.message);
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

    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.send({ message: error.message });
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

      res.send({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      res.send({ message: error.message });
    }
});




//--------------------------------------------Get leaves ---------------------------------------------------------------------
router.get('/all/totalleaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [
        {
          model: LeaveType,
          attributes: ['id', 'leaveTypeName'], 
        },
        {
          model: User,
          attributes: ['name'] 
        }
      ]
    });

    res.json(leaves); 
  } catch (error) {
    console.error(error); 
    res.json({ error: 'An error occurred while retrieving leaves' }); 
  }
});




//--------------------untaken approved leaves deleting---------------
router.delete('/untakenLeaveDelete/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;

  
    const leave = await Leave.findByPk(leaveId, {
      include: {
        model: LeaveType,  
        as: 'leaveType',   
      },
    });


    leave.status = 'AdminDeleted';
    await leave.save();  

    if (!leave) {
      return res.send('Leave not found');
    }

    console.log("leaveleave",leave)

    // if (leave.status !== 'Approved' && leave.status !== 'AdminApproved') {
    //   return res.send('Leave cannot be deleted unless approved or');
    // }

  
    const userLeave = await UserLeave.findOne({ where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId } });


    console.log("userLeaveeeee",userLeave)

    if (userLeave) {
      console.log('Before Deletion - UserLeave:', userLeave.dataValues); 




   
      const leaveDays = leave.noOfDays > 0 ? leave.noOfDays : 1;

      if (leave.leaveType.leaveTypeName === 'LOP') {
    
        userLeave.takenLeaves -= leaveDays;
      } else {

        userLeave.takenLeaves -= leaveDays;
        userLeave.leaveBalance += leaveDays;
      }

     
      await userLeave.save();

   
      console.log('After Deletion - UserLeave Updated:', userLeave.dataValues);
    }

   
    await leave.destroy();

    res.send('Leave deleted and balance updated successfully');
    // res.json({  message: 'Leave deleted and balance updated' });

  } catch (error) {
    res.send(error.message);
  }
});


//--------------------------untaken leaves updating / or doing updation-----------------





router.patch('/untakenLeaveUpdate/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { leaveTypeId, leaveDates, notes } = req.body;

    if (!leaveTypeId) {
      return res.json({ message: 'leaveTypeId is required and must be valid.' });
    }

    console.log('Leave ID:', leaveId);

    const leave = await Leave.findByPk(leaveId, {
      include: [User],
    });

    if (!leave) {
      return res.json({ message: `Leave not found with id=${leaveId}` });
    }

    const leaveType = await LeaveType.findOne({ where: { id: leaveTypeId } });

    if (!leaveType) {
      console.log('LeaveType not found for ID:', leaveTypeId);
      return res.json({ message: 'Leave type not found' });
    }

    const userLeave = await UserLeave.findOne({
      where: { userId: leave.userId, leaveTypeId },
    });

    if (!userLeave) {
      console.log(`No UserLeave mapping found for userId=${leave.userId}, leaveTypeId=${leaveTypeId}`);
      return res.json({ message: 'User leave mapping not found' });
    }

    const filteredLeaveDates = leaveDates.filter(
      (leaveDate) => leaveDate.session1 || leaveDate.session2
    );

    if (filteredLeaveDates.length === 0) {
      console.log('No valid sessions found in leaveDates:', leaveDates);
      await leave.destroy();
      return res.json({ message: 'Leave record deleted as no valid sessions were provided.' });
    }

    const noOfDays = calculateLeaveDays(filteredLeaveDates);

    if (userLeave.leaveBalance < noOfDays) {
      return res.json({ message: 'Not enough leave balance for this update' });
    }

    const previousNoOfDays = leave.noOfDays;
    leave.leaveDates = filteredLeaveDates;
    leave.notes = notes || leave.notes;
    leave.noOfDays = noOfDays;
    leave.status = 'AdminUpdated';

    await leave.save();

    userLeave.takenLeaves += noOfDays - previousNoOfDays;
    userLeave.leaveBalance -= noOfDays - previousNoOfDays;
    await userLeave.save();

    const startDate = leave.leaveDates[0].date;
    const endDate = leave.leaveDates[leave.leaveDates.length - 1].date;
    await sendLeaveUpdatedEmail(
      leaveId,
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
    console.error('Error updating leave:', error);
    res.json({ message: error.message });
  }
});







router.patch('/updateLeaveFileUrl/:leaveId', authenticateToken, async (req, res) => {

  try {
    const leaveId = req.params.leaveId;
    const fileUrl = req.body.fileUrl;

  
    if (!leaveId || !fileUrl) {
      return res.send({ message: 'Leave ID and File URL are required' });
    }

    
    const result = await Leave.update(
      { fileUrl: fileUrl },
      { where: { id: leaveId } }
    );
    // Check if the leave record was updated
    if (result[0] === 0) {
      return res.send({ message: 'Leave request not found or already updated' });
    }


    const userId = req.user.id;
    const userName = req.user.name;

    const hrAdminRole = await Role.findOne({ where: { roleName: 'HR Administrator' } });
    if (!hrAdminRole) {
      return res.send({ message: 'HR Admin role not found' });
    }

    // Fetch HR Admin User
    const hrAdminUser = await User.findOne({ where: { roleId: hrAdminRole.id, status: true } });
    if (!hrAdminUser) {
      return res.send({ message: 'HR Admin user not found' });
    }

    const hrAdminId = hrAdminUser.id;

    // Fetch Reporting Manager ID for the user
    const userPersonal = await UserPersonal.findOne({
      where: { userId },
      attributes: ['reportingMangerId'],
    });

    if (!userPersonal || !userPersonal.reportingMangerId) {
      return res.send({ message: `No reporting manager found for userId ${userId}` });
    }

    const reportingManagerId = userPersonal.reportingMangerId;

    // Generate the relative leave request URL
    const leaveRequestUrl = `/login/admin-leave/view/${leaveId}`;

    await Notification.create({
      userId: hrAdminId,

      message: `Medical Certificate uploaded by ${userName}`,
      route: leaveRequestUrl


    });

    await Notification.create({
      userId: reportingManagerId,

      message: `Medical Certificate uploaded by ${userName}`,
      route: leaveRequestUrl

  

    });


    return res.send({ message: 'Leave file URL updated and notifications sent' });
  } catch (error) {
    console.error(error);
    return res.send({ message: 'Internal server error' });
  }
});



module.exports = router;