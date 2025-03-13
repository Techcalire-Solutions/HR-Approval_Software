

const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../utils/config')
const nodemailer = require('nodemailer');
const upload = require('../utils/userImageMulter'); 
const UserPosition = require('../users/models/userPosition');
const User = require('../users/models/user');
const EventLog = require('./models/eventLogs');
const { Op } = require("sequelize"); 
const moment = require("moment"); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {


          user: config.email.payUser,
          pass: config.email.payPass,
  }
});



router.post('/send-wishes', upload.single('attachment'), async (req, res) => {
  try {
    let { to, subject, message } = req.body;
    const attachment = req.file;

    if (!to || !subject || !message) {
      return res.json({ error: 'Missing required fields.' });
    }


    const birthdayUser = await User.findOne({
      where: { name: to },
      include: [{ model: UserPosition, attributes: ['officialMailId'] }]
    });

    if (!birthdayUser || !birthdayUser.userPosition || !birthdayUser.userPosition.officialMailId) {
      return res.send( 'Birthday person not found or missing email.');
    }

    to = birthdayUser.userPosition.officialMailId;


    const today = moment().startOf('day').toDate();
    const alreadySent = await EventLog.findOne({
      where: {
        eventType: "Birthday_Wish",
        userEmail: to,
        createdAt: { [Op.gte]: today },
      },
    });

    if (alreadySent) {
      return res.json({ message: `Birthday email already sent to ${to}.` });
    }


    const userPositions = await UserPosition.findAll({ attributes: ['officialMailId'] });
    const ccEmails = userPositions.map(up => up.officialMailId).filter(email => email && email !== to);

    const mailOptions = {
      from: '"Onboard Aero Consultant" <aerohr@onboaraero.com>',
      to,
      cc: ccEmails.length ? ccEmails.join(', ') : undefined,
      subject: `🎉 Happy Birthday, ${birthdayUser.name}! 🎉`,
      html: `<p>Happy Birthday, ${birthdayUser.name}! 🎉</p><p>${message}</p>`,
    };

    if (attachment) {
      mailOptions.attachments = [{ filename: attachment.originalname, content: attachment.buffer }];
    }

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.json({ error: error.toString() });
      }


      await EventLog.create({
        eventType: "Birthday_Wish",
        userEmail: to,
        eventDetails: `Birthday email sent to ${to}`,
      });

      res.json({ message: 'Email sent successfully', info });
    });

  } catch (error) {
    console.error('Error in mail sending endpoint:', error);
    res.json({ error: 'Internal server error' });
  }
});









module.exports = router