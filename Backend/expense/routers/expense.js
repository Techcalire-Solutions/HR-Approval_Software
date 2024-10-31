const express = require("express");
const router = express.Router();
const Expense = require('../models/expense');
const authenticateToken = require("../../middleware/authorization");
const upload = require('../../utils/multer');
const s3 = require('../../utils/s3bucket');
const Role = require("../../users/models/role");
const User = require("../../users/models/user");
const ExpenseStatus = require("../models/expenseStatus");
const { Op, where } = require('sequelize');
const sequelize = require('../../utils/db');
const nodemailer = require('nodemailer');
const UserPosition = require('../../users/models/userPosition')
const Notification = require('../../invoices/models/notification')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

router.post('/save', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  let status;

  const { exNo, url, bankSlip, amId, accountantId, count, notes, totalAmount, currency } = req.body;

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: Role,
        attributes: ['roleName']
      }
    });

    if (user && user.role && user.role.roleName === 'Manager') {
      status = 'AM Verified';
      if(accountantId === null || accountantId === '' || accountantId === 'undefined'){
        return res.send("Please select an account and submit again")
      }
    } else {
      status = 'Generated';
      if(amId === null || amId === '' || amId === 'undefined'){
        return res.send("Please select a manager and submit again")
      }
    }
  } catch (error) {
    return res.send(error.message); 
  }

  try {
    const expeExists = await Expense.findOne({ where: {exNo: exNo}})
    if(expeExists){
      return res.send("Expense is already saved");
    }
  } catch (error) {
    res.send(error.message)
  }

  try {
    const expense = await Expense.create({
      exNo, url, bankSlip, status, userId, amId: amId ? amId : userId, accountantId, count, notes, totalAmount, currency,
      addedById: userId,
    });

    const expenseId = expense.id;
    await ExpenseStatus.create({
      expenseId: expenseId,
      status: status,
      date: new Date(),
    });


    let recipientEmail = null;
    let notificationRecipientId = null ;

    if (status === 'Generated') {
      const am = await UserPosition.findOne({ where: { userId: amId } });
      recipientEmail = am ? am.projectMailId : null;
      notificationRecipientId=amId
      if(!recipientEmail){
        return res.send("Project email is missing.\n Please inform the admin to add it")
      }
    } else if (status === 'AM Verified') {
      const accountant = await UserPosition.findOne({ where: { userId: accountantId } });
      recipientEmail = accountant ? accountant.projectMailId : null;
      notificationRecipientId=accountantId
      if(!recipientEmail){
        return res.send("Accoutant Project email is missing.\n Please inform the admin to add it")
      }
    }

    const attachments = [];
    for (const fileObj of url) {
      const actualUrl = fileObj.url || fileObj.file;
      if (!actualUrl) continue;

      const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
      const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };

      try {
        const s3File = await s3.getObject(params).promise();
        attachments.push({
          filename: actualUrl.split('/').pop(),
          content: s3File.Body,
          contentType: s3File.ContentType,
        });
      } catch (error) {
        console.error("Error retrieving file from S3:", error);
        continue;
      }
    }



    
    let emailHtml;
    if (status === 'Generated') {
      emailHtml = `
        <p>Dear Manager,</p>
        <p>${req.user.name} has submitted an expense claim for your review and approval.</p>
        <h3>Expense Claim Details:</h3>
        <ul>
          <li><strong>Reference Number:</strong> ${exNo}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Amount:</strong> ${totalAmount} ${currency}</li>
          <li><strong>Notes:</strong> ${notes}</li>
          <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Please review the attached documents related to this expense claim to proceed with the approval process.</p>
        <p>Thank you for your attention to this request.</p>
        <p>Best Regards,<br>Expense Management System</p>
      `;
    } else if (status === 'AM Verified') {
      emailHtml = `
        <p>Dear Accountant,</p>
        <p>${req.user.name} has submitted an expense claim that has already been verified by a manager.</p>
        <h3>Expense Claim Details:</h3>
        <ul>
          <li><strong>Reference Number:</strong> ${exNo}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Amount:</strong> ${totalAmount} ${currency}</li>
          <li><strong>Notes:</strong> ${notes}</li>
          <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Please find the attached documents related to this expense claim for your records.</p>
        <p>Thank you for your attention.</p>
        <p>Best Regards,<br>Expense Management System</p>
      `;
    }

    const mailOptions = {
      from: `Expense Management System <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Expense Claim Request Submitted - Reference No: ${exNo} / ${req.user.name}`,
      html: emailHtml,
      attachments,
    };

    await transporter.sendMail(mailOptions);

      await Notification.create({
        userId: notificationRecipientId,
        message: `New Expense claim Request Generated ${exNo}`,
        isRead: false,
    });
      res.json(expense);

      

    
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get('/find', authenticateToken, async(req, res) => {
    try {
        const expense = await Expense.findAll({})
        res.send(expense);
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyuser', authenticateToken, async (req, res) => {
  let user = req.user.id;
  let roleId = req.user.roleId;
  let flow = req.query.isFLow;
  let roleName;
  try {
    let role = await Role.findByPk(roleId)
    roleName = role.roleName;
  } catch (error) {
    res.send(error.message)
  }
  try {
    let condition = {};
    
    if (roleName === 'Manager' && flow === "true") {
      
      condition.amId = user;
    } else if (roleName === 'Accountant'&& flow === "true") {
      condition.accountantId = user;
    } else if (roleName === 'Administrator' || roleName === 'Super Administrator'&& flow === "true") {
      condition = {};
    }else {
      condition.userId = user;
    }

    const where = { ...condition }; 

    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      
      where[Op.or] = [
        ...(where[Op.or] || []),
        sequelize.where(
          sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('exNo'), ' ', '')),
          {
            [Op.like]: `%${searchTerm}%`
          }
        )
      ];
    }

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    const expenses = await Expense.findAll({
      where: where, limit, offset,
      include: [  
        {model: ExpenseStatus},
        {model: User, attributes: ['name'], include: [
          {model: Role, attributes: ['roleName']}
        ]},
        {model: User, as: 'manager', attributes: ['name']},
        {model: User, as: 'ma', attributes: ['name']},
      ],
      order: [['id', 'DESC']],
    });


    const totalCount = await Expense.count({ where: where });

    if (req.query.page && req.query.pageSize && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
      const response = {
          count: totalCount,
          items: expenses,
      };
      res.json(response);
  } else {
      res.send(expenses);
  }
  } catch (error) {
    res.send(error.message);
  }
});

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
      }
      const sanitizedFileName = req.body.name || req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
      
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `Expenses/${Date.now()}_${sanitizedFileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read' 
      };
  
      // Upload the file to S3
      const data = await s3.upload(params).promise();
  
      // Check if data.Location (fileUrl) exists
      const fileUrl = data.Location ? data.Location : '';
  
      // Replace only if fileUrl is valid
      const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
  
      res.status(200).send({
        message: 'File uploaded successfully',
        file: req.file,
        fileUrl: key // S3 URL of the uploaded file
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
});


router.post('/updatestatus', authenticateToken, async (req, res) => {
  const { expenseId, remarks, accountantId, status } = req.body;

  try {
      if (!expenseId || !status) {
          return res.send('Expense ID and status are required.');
      }

      const expense = await Expense.findByPk(expenseId);
      if (!expense) {
          return res.send('Expense not found.');
      }

      if (!Array.isArray(expense.url) || expense.url.length === 0) {
          return res.send('Expense does not have an associated file or the URL is invalid.');
      }

      const newStatus = new ExpenseStatus({ expenseId, status, date: new Date(), remarks });
      await newStatus.save();

      expense.status = status;
      if (accountantId != null) expense.accountantId = accountantId;
      await expense.save();

      let recipientEmail = null;
      let notificationRecipientId = null;
      let recipientName =  null;

      let notificationMessage = null;
      let us = null;
      let acc = null;

      try {
          us = await UserPosition.findOne({ where: { userId: expense.addedById } });
          acc = accountantId ? await UserPosition.findOne({ where: { userId: accountantId } }) : null;

          if (acc && acc.projectMailId) {
              recipientEmail = acc.projectMailId;
              recipientName = acc.user ? acc.user.name : 'Accountant';
              notificationRecipientId = accountantId;
              notificationMessage = `The expense claim ${expense.exNo} has been approved.`;
              if(!recipientEmail){
                return res.send("Accountant email is missing.\n Please inform the admin to add it")
              }
          } else if (us && us.projectMailId) {
              recipientEmail = us.projectMailId;
              recipientName = us.user ? us.user.name : 'User'; 
              notificationRecipientId = expense.addedById;
              notificationMessage = `The expense claim ${expense.exNo} has been rejected.`;
              if(!recipientEmail){
                return res.send("Project email is missing.\n Please inform the admin to add it")
              }
          }
          if (!recipientEmail) {
              return res.send('Recipient email not defined for this  action.');
          }

      } catch (error) {
          return res.status(500).send(error.message);
      }

      let emailSubject = `Expense Claim Update - ${expense.exNo}`;
      let emailTextApproval =`Dear ${recipientName},\n\n` +
      `We are pleased to inform you that the status of the expense claim ${expense.exNo} has been updated to ${status}.\n\n` +
      `Remarks: ${remarks}\n\n` +
      `Please find the claim details below:\n` +
      `Expense No.: ${expense.exNo}\n` +
      `Status: Approved\n\n` +
      `Best regards,\n${req.user.name}\nApproval Management Team`;

      let emailTextRejected =`Dear ${recipientName},\n\n` +
      `The status of your expense claim ${expense.exNo} has been updated to ${status}.\n\n` +
      `Remarks: ${remarks}\n\n` +
      `Please review the remarks and take necessary actions.\n` +
      `Expense No.: ${expense.exNo}\n` +
      `Status: Rejected\n\n` +
      `For more information, feel free to reach out to the Approval Management Team.\n\n` +
      `Best regards,\n${req.user.name}\nApproval Management Team`;

      let emailText = '';

      switch (status) {
          case 'AM Verified':
              emailText = emailTextApproval;
              break;
          case 'AM Rejected':
              emailText = emailTextRejected;
              break;
          default:
              console.error('Invalid status received:', status); 
              return res.status(400).send(`Invalid status update: "${status}" received.`);
      }

      const attachmentUrl = expense.url[0].url;
      const attachmentFileKey = attachmentUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

      const attachmentParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: attachmentFileKey,
      };

      const attachmentS3File = await s3.getObject(attachmentParams).promise();

      const mailOptions = {
          from: `${req.user.name} <${req.user.email}>`,
          to: recipientEmail,
          subject: emailSubject,
          text: emailText,
          attachments: [
              {
                  filename: attachmentFileKey.split('/').pop(),
                  content: attachmentS3File.Body,
                  contentType: attachmentS3File.ContentType,
              },
          ],
      };

      await transporter.sendMail(mailOptions);
      await Notification.create({
          userId: notificationRecipientId,
          message: notificationMessage,
          isRead: false,
      });

      res.json({ expense, status: newStatus });

  } catch (error) {
      console.error('Error updating expense claim status:', error); 
      res.status(500).send('Internal Server Error');
  }
});




router.patch('/bankslip/:id', authenticateToken, async (req, res) => {
  const { bankSlip } = req.body;
  try {
      let newStat = 'PaymentCompleted';

      const ex = await Expense.findByPk(req.params.id);
      if (!ex) {
          return res.status(404).json({ message: 'Expense not found' });
      }

      ex.bankSlip = bankSlip;
      ex.status = newStat;
      await ex.save();

      const status = new ExpenseStatus({
          expenseId: ex.id,
          status: newStat,
          date: new Date(),
      });
      await status.save();
      let recipientEmail = null;
      let notificationRecipientId;

      try {
        const user = await UserPosition.findOne({ where: { userId: ex.userId } }); 

        if (!user) {
            return res.status(404).send("User not found.");
        }
  
        recipientEmail = user.projectMailId;
        notificationRecipientId = user.userId;
  
        if (!recipientEmail) {
          return res.send("Recipient project mail not added.");
        }
    
    } catch (error) {
        console.error("Error fetching user or sending notification:", error);
        return res.send(error.message);
    }
  

      const fileKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
      const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
      };

      let fileBuffer, contentType;
      try {
          const s3File = await s3.getObject(params).promise();
          fileBuffer = s3File.Body;
          contentType = s3File.ContentType;
      } catch (s3Error) {
          console.error('Failed to retrieve file from S3:', s3Error);
          return res.status(500).json({ message: 'Error retrieving file from S3' });
      }

      let emailSubject =` Expense Request Processed Successfully - ${ex.exNo}`;
      let emailBody = `
         <p>Dear Team,</p>

                  <p>We are pleased to inform you that the expense request for Expense ID: <strong>${ex.exNo}</strong> has been successfully processed, and the bank slip is now attached for your reference.</p>

                     <p>Please review the attached bank slip at your convenience.<br> Should you have any questions or require further details, feel free to reach out.</p>

                     <br>
                       <p>Thank you for your attention,</p>
                     <p>Best regards,</p>

                       <p>Finance Department</p>

      `;

      const mailOptions = {
          from: `Expense Management<${process.env.EMAIL_USER}>`,
          to: recipientEmail,
          subject: emailSubject,
          html: emailBody,
          attachments: [
              {
                  filename: bankSlip.split('/').pop(),
                  content: fileBuffer,
                  contentType: contentType
              }
          ]
      };

      try {
          await transporter.sendMail(mailOptions);
          console.log('Email sent successfully');
      } catch (mailError) {
          console.error('Failed to send email:', mailError);
          return res.status(500).json({ message: 'Error sending email' });
      }

      await Notification.create({
        userId: notificationRecipientId,
        message: emailSubject,
        isRead: false,
    });

      res.json({ ex: ex, status: status});
  } catch (error) {
      console.error('Error in processing request:', error);
      res.status(500).send(error.message);
  }
});



router.get('/findbyid/:id', authenticateToken, async(req, res) => {
  try {
  
      const pi = await Expense.findByPk(req.params.id, {
          include:[
              { model: ExpenseStatus },
              { model: User, attributes: ['name'] },
              { model: User, as: 'manager', attributes: ['name'] },
              { model: User, as: 'ma', attributes: ['name'] }
            ]
  })
      let signedUrl = [];
      if (pi.url.length > 0) {
          for(let i = 0; i < pi.url.length; i++) {
              const fileUrl = pi.url[i];
              
              const key = fileUrl.url.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
              
              const params = {
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: key, 
                  Expires: 60,
                };
              
                signedUrl[i] ={ url: s3.getSignedUrl('getObject', params), remarks: fileUrl.remarks}
          }
      }
      let bankSlipUrl = '';
      if(pi.bankSlip){
          const bankSlip = pi.bankSlip;
          const bankKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
          
          const bankParams = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: bankKey,
              Expires: 60, 
            };
        
            bankSlipUrl = s3.getSignedUrl('getObject', bankParams);
      }
    
      res.json({ pi: pi, signedUrl: signedUrl, bankSlip: bankSlipUrl });
  } catch (error) {
      res.send(error.message)
    }
})

router.delete('/filedelete', authenticateToken, async (req, res) => {
  console.log(req.query);
  
  let id = req.query.id;
  let index = req.query.index;
  let fileKey;
  let t;

  try {
    t = await sequelize.transaction();

    let result = await Expense.findByPk(id, { transaction: t });

    if (!result || !result.url || !result.url[index]) {
      return res.status(404).send({ message: 'File or index not found' });
    }

    fileKey = result.url[index].url;

    result.url.splice(index, 1); 

    result.setDataValue('url', result.url);
    result.changed('url', true);

    await result.save({ transaction: t });

    await t.commit();

    result = await Expense.findByPk(id);

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey.replace('https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/', '')
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3 or database:', error);

    // Rollback the transaction if it was created and an error occurs
    if (t) await t.rollback();

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


router.patch('/update/:id', authenticateToken, async (req, res) => {
  let { url, amId, notes, currency, totalAmount } = req.body;
  const userId = req.user.id;
  let status;
  const user = await User.findByPk(userId, {
    include: {
      model: Role,
      attributes: ['roleName']
    }
  });

  if (user && user.role && user.role.roleName === 'Manager') {
    status = 'AM Verified';
    if(accountantId === null || accountantId === '' || accountantId === 'undefined'){
      return res.send("Please select an account and submit again")
    }
  } else {
    status = 'Generated';
    if(amId === null || amId === '' || amId === 'undefined'){
      return res.send("Please select a manager and submit again")
    }
  }


  let recipientEmail = null;
  let notificationRecipientId = amId

  try {
    const am = await UserPosition.findOne({where:{userId:amId}})
    recipientEmail = am ? am.projectMailId : null ;

    if (!recipientEmail) { 
        return res.send("AM project email is missing.\n Please inform the admin to add it.");
    }
    
  } catch (error) {
    res.send(error.message)
    
  }

  try {
      const pi = await Expense.findByPk(req.params.id);
      if (!pi) {
          return res.status(404).send({ message: 'Expense not found.' });
      }

      pi.url = url;
      pi.amId = amId;
      let count = pi.count + 1;
      pi.count = count;
      pi.notes = notes;
      pi.currency = currency;
      pi.totalAmount = totalAmount;

      await pi.save();

      const piId = pi.id;
      
      const piStatus = new ExpenseStatus({
          expenseId: piId, status: status, date: new Date(), count: count
      })
      await piStatus.save();




 

  
      const attachments = [];
      for (const fileObj of url) {
          const actualUrl = fileObj.url || fileObj.file;
          if (!actualUrl) continue;

          const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileKey,
          };

          try {
              const s3File = await s3.getObject(params).promise();
              const fileBuffer = s3File.Body;

              attachments.push({
                  filename: actualUrl.split('/').pop(),
                  content: fileBuffer,
                  contentType: s3File.ContentType 
              });
          } catch (error) {
              continue; 
          }
      }

      const mailOptions = {
          from: `Expense <${process.env.EMAIL_USER}>`,
          to: recipientEmail, 
          subject: `Expense claim request Updated - ${pi.exNo} /${req.user.name} `,
          html: `
              <p>Expense has been updated by <strong>${req.user.name}</strong></p>
              <p><strong>Entry Number:</strong> ${pi.exNo}</p>
              <p><strong>Status:</strong> ${pi.status}</p>
              <p><strong>Notes:</strong> ${pi.notes}</p>
              <p><strong>Notes:</strong> ${pi.expenseType}</p>
              <p>Please find the attached documents related to this Expense.</p>
          `,
          attachments: attachments 
      };

    
      await transporter.sendMail(mailOptions);

      await Notification.create({
        userId: notificationRecipientId,
        message: `Expense claim request Updated - ${pi.exNo}/${req.user.name}`,
        isRead: false,
    });

      res.json({
        piNo: pi.piNo,
        status: piStatus.status,
        res: pi,
        message: 'Expense updated successfully'
    });



  } catch (error) {
      res.send(error.message);
  }
});

router.delete('/:id', async(req,res)=>{
  try {

      const result = await Expense.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Expense with that ID not found",
          });
        }
    
        res.json();
      }  catch (error) {
      res.send({error: error.message})
  }
  
})

module.exports = router;