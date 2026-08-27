

const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../utils/config')
const nodemailer = require('nodemailer');
const upload = require('../utils/userImageMulter'); 
const UserPosition = require('../users/models/userPosition');
const UserPersonal = require('../users/models/userPersonal');
const User = require('../users/models/user');
const EventLog = require('./models/eventLogs');
const { Op, Sequelize } = require("sequelize"); 
const moment = require("moment"); 
const Designation = require('../users/models/designation');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
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

router.post('/birthday-template', upload.single('attachment'), async (req, res) => {
  try {
    const { userId, subject, message, timestamp } = req.body;
    
    // Handle file if uploaded
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = req.file.path;
      // You might want to store the filename as well: req.file.filename
    }

    const event = new EventLog({
      userId, 
      subject, 
      message, 
      attachment: attachmentPath,
      timestamp: timestamp,
      isSent: false
    });
    
    await event.save();
    res.status(201).send(event);
  } catch (error) {
    console.error('Error saving birthday template:', error);
    res.status(500).send({ error: error.message });
  }
});

router.get('/template/:id', async (req, res) => {
  const userId = req.params.id;
    try {
          const event = await EventLog.findOne({ where : {userId}});
          res.send(event);
    } catch (error) {
        res.send(error.message);
    }
})

router.patch('/update-birthday-template/:id', upload.single('attachment'), async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = req.file.path;
    }

    const event = await EventLog.findByPk(req.params.id);
    event.subject = subject;
    event.message = message;
    event.attachment = attachmentPath;
    
    await event.save();
    res.status(201).send(event);
  } catch (error) {
    console.error('Error saving birthday template:', error);
    res.status(500).send({ error: error.message });
  }
});

// router.post('/test-birthday-wishes', async (req, res) => {
//   try {
//     console.log("🚀 Running test birthday cron logic...");
//     const today = moment().format('MM-DD');

//     // Fixed query using date formatting comparison
//     const birthdayUsers = await User.findAll({
//       where: { separated: false },
//       include: [
//         {
//           model: UserPersonal,
//           as: 'userpersonal',
//           attributes: ['dateOfBirth'],
//           where: Sequelize.where( // Use Sequelize.where for safe comparison
//             Sequelize.fn('to_char', Sequelize.col('dateOfBirth'), 'MM-DD'),
//             Op.eq,
//             today
//           )
//         },
//         {
//           model: UserPosition,
//           attributes: ['officialMailId', 'department']
//         }
//       ]
//     });

//     if (!birthdayUsers.length) {
//       return res.json({ message: "No birthday users today!" });
//     }

//     // Fetch active birthday template
//     // const template = await BirthdayTemplate.findOne({ where: { active: true } });
//     // if (!template) {
//     //   return res.json({ message: "⚠️ No active birthday template found" });
//     // }

//     let results = [];
//     for (let user of birthdayUsers) {
//       if (!user.userPosition?.officialMailId) continue;
//       const to = user.userPosition.officialMailId;

//       // Replace placeholders dynamically
//       // const messageContent = template.message
//       //   .replace('{{name}}', user.name)
//       //   .replace('{{empNo}}', user.empNo || '')
//       //   // .replace('{{designation}}', user.userPosition.designation || '')
//       //   .replace('{{department}}', user.userPosition.department || '');
//       const messageContent = "Hiiiiiiiiiiiiiiiiiii"
//       //  template.subject ||
//       const mailOptions = {
//         from: '"HR & Administration | Onboard Aero Consultant" <aerohr@onboaraero.com>',
//         to,
//         subject: `🎉 Happy Birthday, ${user.name}! 🎉`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
//             <h2 style="background:#002147;color:white;padding:15px;text-align:center;">
//               🎉 Happy Birthday, ${user.name}! 🎉
//             </h2>
//             <p style="text-align:center;">Dear <strong>${user.name}</strong> (${user.empNo}),</p>
//             <p style="text-align:center;">${messageContent}</p>
//             <p style="text-align:center;font-weight:bold;color:#002147;">Team OAC</p>
//           </div>
//         `
//       };

//       // Add attachment if template has one
//       // if (template.attachmentUrl) {
//       //   try {
//       //     const response = await axios.get(template.attachmentUrl, { responseType: 'arraybuffer' });
//       //     mailOptions.attachments = [{
//       //       filename: template.attachmentUrl.split('/').pop(),
//       //       content: Buffer.from(response.data, 'binary')
//       //     }];
//       //   } catch (err) {
//       //     console.error("⚠️ Could not fetch attachment:", err.message);
//       //   }
//       // }

//       // Send email
//       await transporter.sendMail(mailOptions);
//       results.push({ to, status: "✅ Sent" });
//     }

//     res.json({ message: "Test completed", results });
    
//   } catch (err) {
//     console.error("🚨 Error in test API:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

router.post('/test-birthday-wishes', async (req, res) => {
  try {
    const today = moment().format('MM-DD');

    // Get users without designation first to avoid the type error
    const birthdayUsers = await User.findAll({
      where: { separated: false },
      include: [
        {
          model: UserPersonal,
          as: 'userpersonal',
          attributes: ['dateOfBirth'],
          where: Sequelize.where(
            Sequelize.fn('to_char', Sequelize.col('dateOfBirth'), 'MM-DD'),
            Op.eq,
            today
          )
        },
        {
          model: UserPosition,
          attributes: ['id', 'officialMailId', 'department', 'designationId']
        }
      ]
    });

    if (!birthdayUsers.length) {
      return res.json({ message: "No birthday users today!" });
    }

    let defaultTemplate;
    // Fetch default birthday template
    // const defaultTemplate = await BirthdayTemplate.findOne({ 
    //   where: { 
    //     isDefault: true,
    //     active: true 
    //   } 
    // });
    
    // if (!defaultTemplate) {
    //   return res.json({ message: "⚠️ No default birthday template found" });
    // }

    let results = [];
    for (let user of birthdayUsers) {
      // Check if userPosition exists and has officialMailId
      if (!user.userPosition || !user.userPosition.officialMailId) {
        results.push({ 
          user: user.name || `User ${user.id}`, 
          to: 'N/A', 
          status: "❌ Skipped - No email address or position data" 
        });
        continue;
      }
      
      const to = user.userPosition.officialMailId;
      let designationName = '';

      // Get designation name safely with type conversion
      if (user.userPosition.designationId) {
        try {
          // Convert designationId to integer if it's stored as string
          const designationId = parseInt(user.userPosition.designationId);
          
          if (!isNaN(designationId)) {
            const designation = await Designation.findByPk(designationId);
            designationName = designation ? designation.name : '';
          } else {
            // If it's not a number, try to find by string ID
            const designation = await Designation.findOne({
              where: { 
                id: user.userPosition.designationId 
              }
            });
            designationName = designation ? designation.name : '';
          }
        } catch (err) {
          console.error(`Error fetching designation for user ${user.id}:`, err.message);
        }
      }

      // Check if there's a specific template for this user with type conversion
      let userTemplate = null;
      try {
        // Convert userId to string if EventLog.userId is defined as string
        userTemplate = await EventLog.findOne({
          where: Sequelize.where(
            Sequelize.cast(Sequelize.col('userId'), 'varchar'),
            Op.eq,
            user.id.toString()
          )
        });
      } catch (error) {
        console.error(`Error checking template for user ${user.id}:`, error.message);
      }

      // Use user-specific template if available, otherwise use default
      const template = userTemplate || defaultTemplate;

      // Replace placeholders dynamically with safe fallbacks
      const messageContent = template.message
        .replace(/{{name}}/gi, user.name || '')
        .replace(/{{empNo}}/gi, user.empNo || '')
        .replace(/{{designation}}/gi, designationName)
        .replace(/{{department}}/gi, user.userPosition.department || '');

      const subject = template.subject
        .replace(/{{name}}/gi, user.name || '')
        .replace(/{{empNo}}/gi, user.empNo || '')
        .replace(/{{designation}}/gi, designationName)
        .replace(/{{department}}/gi, user.userPosition.department || '');

      const mailOptions = {
        from: '"HR & Administration | Onboard Aero Consultant" <aerohr@onboaraero.com>',
        to,
        subject: subject || `🎉 Happy Birthday, ${user.name}! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #002147 0%, #004d99 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 ${subject || `Happy Birthday, ${user.name}!`} 🎉</h1>
            </div>
            <div style="padding: 25px;">
              <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>${user.empNo ? ` (${user.empNo})` : ''},</p>
              <div style="font-size: 16px; line-height: 1.6; margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #002147;">
                ${messageContent.replace(/\n/g, '<br>')}
              </div>
              <p style="text-align: center; margin-top: 30px;">
                <strong style="color: #002147;">Warm regards,</strong><br>
                <span style="color: #555;">Team OAC | Onboard Aero Consultant</span>
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
              This is an automated birthday greeting from HR System
            </div>
          </div>
        `
      };

      // Add attachment if template has one
      // if (template.attachmentUrl) {
      //   try {
      //     const response = await axios.get(template.attachmentUrl, { 
      //       responseType: 'arraybuffer' 
      //     });
      //     mailOptions.attachments = [{
      //       filename: `birthday_wish_${user.name}.pdf` || template.attachmentUrl.split('/').pop(),
      //       content: Buffer.from(response.data, 'binary')
      //     }];
      //   } catch (err) {
      //     console.error(`⚠️ Could not fetch attachment for ${user.name}:`, err.message);
      //     // Continue without attachment if there's an error
      //   }
      // }

      try {
        // Send email
        await transporter.sendMail(mailOptions);
        results.push({ 
          user: user.name, 
          to, 
          status: "✅ Sent", 
          templateUsed: userTemplate ? "User-specific" : "Default",
          designation: designationName
        });
        
        // Log the sent message in EventLog with proper type conversion
        await EventLog.create({
          userId: user.id.toString(), // Convert to string if needed
          subject: mailOptions.subject,
          message: messageContent,
          attachment: template.attachmentUrl || null,
          isSent: true,
          sentAt: new Date(),
          templateType: userTemplate ? "custom" : "default"
        });
        
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${user.name}:`, emailError.message);
        results.push({ 
          user: user.name, 
          to, 
          status: `❌ Failed - ${emailError.message}` 
        });
      }
    }

    res.json({ 
      message: `Test completed - Processed ${results.length} users`, 
      results 
    });
    
  } catch (err) {
    console.error("🚨 Error in test API:", err);
    res.status(500).json({ error: err.message });
  }
});

export async function sendBirthdayMail(template) {
  const userId = template.userId;
  const user = await User.findByPk(userId, {
    include: ["userpersonal", "userPosition"]
  });

  if (!user || !user.userPosition?.officialMailId) {
    throw new Error("User has no email or position");
  }

  let designationName = "";
  if (user.userPosition.designationId) {
    const designation = await Designation.findByPk(user.userPosition.designationId);
    designationName = designation ? designation.name : "";
  }

  const messageContent = template.message
    .replace(/{{name}}/gi, user.name || "")
    .replace(/{{empNo}}/gi, user.empNo || "")
    .replace(/{{designation}}/gi, designationName)
    .replace(/{{department}}/gi, user.userPosition.department || "");

  const subject = template.subject
    .replace(/{{name}}/gi, user.name || "")
    .replace(/{{empNo}}/gi, user.empNo || "")
    .replace(/{{designation}}/gi, designationName)
    .replace(/{{department}}/gi, user.userPosition.department || "");

  const mailOptions = {
    from: '"HR & Administration | Onboard Aero Consultant" <aerohr@onboaraero.com>',
    to: user.userPosition.officialMailId,
    subject,
    html: `<p>${messageContent}</p>`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = router