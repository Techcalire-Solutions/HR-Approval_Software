

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
          user: config.email.leaveCommonUser,
          pass: config.email.leaveCommonPass,
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



    const userPositions = await UserPosition.findAll({
      attributes: ['officialMailId'],
      include: [
        {
          model: User,
          attributes: [], 
          where: { separated: false } 
        }
      ]
    });
    

 

    const ccEmails = userPositions.map(up => up.officialMailId).filter(email => email && email !== to);

    const mailOptions = {
      from: '"HR & Adminstration | Onboard Aero Consultant" <aerohr@onboaraero.com>',
      to,
      cc: ccEmails.length ? ccEmails.join(', ') : undefined,
      subject: `🎉 Happy Birthday, ${birthdayUser.name}! 🎉`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); background-color: #ffffff;">
        <div style="background-color: #002147; color: white; text-align: center; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2>🎉 Happy Birthday, ${birthdayUser.name}! 🎉</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 16px; color: #333;">Dear <strong>${birthdayUser.name}</strong>,</p>
          <p style="font-size: 16px; color: #555;">${message}</p> <!-- Dynamic Message from Frontend -->
          <h3 style="color: #002147;">Happy Birthday! 🎉</h3>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 14px; font-weight: bold; color: #002147;">Team OAC</p>
      </div>
      </div>
      `,
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