/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const nodemailer = require('nodemailer');
const Designation = require('../users/models/designation');
const UserPosition = require('../users/models/userPosition');
const { loadSignature } = require('../utils/signatureLoader');
/**
 * Send an email dynamically with provided credentials
 * @param {string} fromEmail - Sender's email address
 * @param {string} password - App password for the sender's email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} [text] - Email text content
 * @param {html} [html] - Optional HTML content for the email.
 * @param {any} [attachments] - Optional array of file attachments.
 * @returns {Promise}
 */

const sendEmail = async (token, fromEmail, password, to, subject, html, attachments, cc) => {
  const { userName, id } = decodeToken(token);
  const roleId = await UserPosition.findOne({where: {userId: id}})
  const role = await Designation.findByPk(roleId?.designationId);
  const designation = role ? role.designationName : 'Employee'; 

  // Define the email signature
  const emailSignature = loadSignature(process.env.EMAIL_SIGNATURE_TEMPLATE, {
      userName,
      designation
  });

  // Append the email signature to the HTML content
  const emailBody = html ? `${html}${emailSignature}` : `${emailSignature}`;
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


module.exports = { sendEmail };
