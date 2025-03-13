
const nodemailer = require('nodemailer');
const Designation = require('../users/models/designation');
const UserPosition = require('../users/models/userPosition');


/**
 * @param {string} fromEmail 
 * @param {string} password 
 * @param {string} to
 * @param {string} subject 
 * @param {string} [text] 
 * @param {html} [html]
 * @param {any} [attachments] 
 * @returns {Promise}
 */

const sendEmailNotification = async (token, fromEmail, password, to, subject, html, attachments, cc) => {
  const { userName, id } = decodeToken(token);
  const roleId = await UserPosition.findOne({where: {userId: id}})
  const role = await Designation.findByPk(roleId?.designationId);
  const designation = role ? role.designationName : 'Employee'; 

  const emailSignature = `
  Regards,
<table style="width:28%; font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
      <td style="padding-right: 5px; padding-top: 25px; vertical-align: top;">
          <img src="https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/images/leeds_logo.png" alt="LEEDS Aerospace Logo" style="width: 180px;">
          <p style="font-size: 8px; font-weight: bold; margin-top: 10px;padding-left: 0; font-style: italic; padding-right: 0;">
              ASA-100 & ISO 9001:2015 accredited<br>
              Compliant with FAA Advisory Circular 00-56B
          </p>
      </td>
      <td style="border-left: 2px solid #e00d0d; padding-left: 10px; vertical-align: top;">
          <strong style="font-size: 16px; color: #e00d0d;"> ${userName}</strong><br>
          <a style="font-size: 12px;"> ${designation}</a>
          <hr style="border: 1px solid black; margin: 5px 0;">
         
          <table style="font-size: 14px;">
              <tr>
                  <td style="vertical-align: top;">
                      <img src="https://img.icons8.com/material-outlined/24/000000/phone.png" style="vertical-align: middle; width: 15px;" alt="Phone Logo">
                  </td>
                  <td style="padding-left: 5px; font-size: 12px;">
                      +971 42 325 872
                  </td>
              </tr>
              <tr>
                  <td style="vertical-align: top;">
                      <img src="https://img.icons8.com/material-outlined/24/000000/email.png" style="vertical-align: middle; width: 15px;">
                  </td>
                  <td style="padding-left: 5px; ; font-size: 12px;">
                      <a href="mailto:sales@leedsaerospace.com" style="color: black; text-decoration: none;">sales@leedsaerospace.com</a>
                  </td>
              </tr>
              <tr>
                  <td style="vertical-align: center;">
                      <img src="https://img.icons8.com/material-outlined/24/000000/internet.png" style="vertical-align: middle;  width: 15px;">
                  </td>
                  <td style="padding-left: 5px; ; font-size: 12px;">
                      <a href="https://www.leedsaerospace.com" style="color: black; text-decoration: none;">www.leedsaerospace.com</a>
                  </td>
              </tr>
              <tr>
                  <td style="vertical-align: center;">
                      <img src="https://img.icons8.com/material-outlined/24/000000/marker.png" style="vertical-align: middle; padding-top: 5px;  width: 15px;">
                  </td>
                  <td style="padding-left: 5px; font-size: 11px; ">
                      Premise#S202/06, ASC, MBRAH,
                      Near Al Maktoum Airport,
                      Dubai South, UAE
                  </td>
              </tr>
          </table>
      </td>
  </tr>
  <tr>
      <td colspan="2" style="font-size: 9px; color: #666; padding-top: 5px; text-align: justify;">
          <div style="width: 100%;">
              <p>
                  The content of this email is confidential and intended for the recipient specified in the message only. 
                  It is strictly forbidden to share any part of this message with any third party without written consent 
                  of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, 
                  so that we can ensure such a mistake does not occur in the future.
              </p>
          </div>
      </td>
  </tr>
  </table>`;

  const emailBody = html ? `${html}${emailSignature}` : `${emailSignature}`;
  console.log(fromEmail, password);
  
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: fromEmail,
      pass: password,
    },
  });

  if (cc === null || cc === undefined || cc === '') {
    cc = undefined;
  } else if (typeof cc === 'string') {
    cc = [cc];
  }

  const mailOptions = {
    from: fromEmail,
    to,
    cc,
    subject,
    html: emailBody,
    attachments,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        reject(err);
      } else {
        resolve(info.response);
      }
    });
  });
};

const decodeToken = (token) => {
  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.decode(token);
    if (!decoded || !decoded.name || !decoded.roleId) {
      throw new Error('Invalid token: Missing required fields');
    }
  } catch (err) {
    console.error('Error decoding token:', err);
    throw new Error('Error decoding token');
  }
  return {
    userName: decoded.name,
    id: decoded.id,
  };
};


    // const html =  `
    // <p>Please find the attached payroll Excel file for your review.</p>
    // <p>Kindly click the button below to either approve or reject the payroll data as required.</p>
   
    // `
    // const emailSubject = `Payroll Data for ${month}`
    // const fromEmail = config.email.payrollUser;
    // const emailPassword = config.email.payrollPass;
    // const attachments = 
    //   {
    //     filename: file.originalname,
    //     path: file.path,  
    //   }
    
    // const token = req.headers.authorization?.split(' ')[1];
    
    // try {
    //   await sendEmail(token, fromEmail, emailPassword, email, emailSubject ,html, attachments);
    // } catch (emailError) {
    //   console.error('Email sending failed:', emailError);
    // }




module.exports = sendEmailNotification;

