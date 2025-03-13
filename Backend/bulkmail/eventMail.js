


const express = require('express');
const multer = require('multer');
const router = express.Router();
const nodemailer = require('nodemailer');
const config = require('../utils/config')
// const upload = require('../utils/userImageMulter'); 
const EventLog = require('./models/eventLogs');
const UserPosition = require('../users/models/userPosition');
let drafts = []; 
const { Op } = require('sequelize');

const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 10 * 1024 * 1024 } 
  });


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {


          user: config.email.payUser,
          pass: config.email.payPass,
  }
});


router.post('/send-event-mail', upload.any(), async (req, res) => {
  try {
      let { emailSubject, emailMessage, selectedUsers } = req.body;

      console.log("📌 Received selectedUsers:", selectedUsers);
      console.log("📌 Type of selectedUsers:", typeof selectedUsers);

      // Ensure selectedUsers is always an array
      if (typeof selectedUsers === "string") {
          try {
              selectedUsers = JSON.parse(selectedUsers); // Convert from JSON string
          } catch (error) {
              console.error("🚨 Error parsing selectedUsers JSON:", error);
              res.json({ error: "Invalid selectedUsers format" });
              return;
          }
      }

      if (!Array.isArray(selectedUsers)) {
          selectedUsers = [selectedUsers];
      }

      console.log("✅ Parsed selectedUsers:", selectedUsers);

      if (selectedUsers.length === 0) {
          res.json({ error: 'No users selected' });
          return;
      }

      // Fetch official email IDs of selected users
      const usersWithEmails = await UserPosition.findAll({
          where: { userId: { [Op.in]: selectedUsers } },
          attributes: ['officialMailId']
      });

      const officialEmails = usersWithEmails
          .map(user => user.officialMailId)
          .filter(email => email); // Remove empty/null emails

      if (officialEmails.length === 0) {
          res.json({ error: 'No official emails found for selected users' });
          return;
      }

      // Process file attachments
      const attachments = req.files.map(file => ({
          filename: file.originalname,
          content: file.buffer
      }));

      console.log("📧 Sending Email to:", officialEmails);

      // Store event log
      await EventLog.create({
          subject: emailSubject,
          message: emailMessage,
          recipients: officialEmails,
          eventType: "Event_Wish",
          attachments: attachments.map(a => a.filename),
      });

      // Prepare email options
      const mailOptions = {
          from: '"Events Team" <anupama@onboardaero.com>',
          to: officialEmails.join(', '),
          subject: emailSubject,
          html: `<p>${emailMessage}</p>`,
          attachments: attachments
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('❌ Error sending email:', error);
              res.json({ error: error.toString() });
              return;
          }
          res.json({message: 'Email sent successfully',  success: true,info });
      });

  } catch (error) {
      console.error('❌ Error:', error);
      res.json({ success: false, message: 'Failed to send email' });
  }
});





  

  router.get('/email-logs',async (req, res) => {
    try {
        const logs = await EventLog.findAll({  
            where: { eventType: 'Event_Wish' },
          order: [['timestamp', 'DESC']] });
        res.json(logs);
      } catch (error) {
        console.error('❌ Error Fetching Logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
      }
  });
  

  
  

  module.exports = router;