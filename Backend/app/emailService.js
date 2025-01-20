/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const nodemailer = require('nodemailer');
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

const sendEmail = async (fromEmail, password, to, subject, text, html, attachments, cc) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: fromEmail,
      pass: password,
    },
  });

  const mailOptions = {
    from: fromEmail,
    to,
    cc,
    subject,
    text,
    html: html, 
    attachments: attachments
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        reject(err);
      } else {
        console.log('Email sent:', info.response);
        resolve(info.response);
      }
    });
  });
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
    
    // const text = ''
    
    // try {
    //   await sendEmail(fromEmail, emailPassword, email, emailSubject, text ,html, attachments);
    // } catch (emailError) {
    //   console.error('Email sending failed:', emailError);
    // }


module.exports = { sendEmail };
