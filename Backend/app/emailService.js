
const nodemailer = require('nodemailer');
const Role = require('../users/models/role');
const Designation = require('../users/models/designation');
const UserPosition = require('../users/models/userPosition');
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
  const emailSignature = `
          <table>
            <tr>
                <td style="padding-left: 5px; vertical-align: top;">
                        <div class="signature-container">
                        <p style=" font-weight: bold; color: #0a499b; margin-bottom: 5px; font-size:small;" >With Regards,</p>
                        <p style="color: #0a499b; font-size: 16px; font-weight: bold; margin: 5px 0; text-align: justify;">
                          ${userName}
                        </p>
                        <p style="font-size: 14px; margin: 0; text-align:justify;">
                          ${designation}
                        </p>
                            <img src="https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/images/OAC-+LOGO+edited.jpg" 
                            alt="Onboard Aero Consultant Logo" style="width: 280px;">

                            <hr style="border: 1px solid #0a499b; margin: 5px 0;">
                            
                            <table style="width: 100%; margin: 0;">
                                <tr>
                                    <td style="vertical-align: top; padding-top: 5px; text-align: center;">
                                        <!-- <strong style="font-style: italic; color: #0a499b;">Address:</strong> -->
                                        <img src="https://img.icons8.com/material-outlined/24/000000/marker.png" alt="Address Icon" 
                                        class="icon" style="width: 15px;">
                                    </td>
                                    <td style="padding-left: 5px; font-size: 10px; text-align: justify;">
                                        <p style="margin: 0;">ONBOARD AERO CONSULTANT PRIVATE LIMITED.<br>
                                        Technolodge, 13/227, Kakkoor.P.O, Ernakulam- 686662</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="vertical-align: top; text-align: center;">
                                        <!-- <strong style="font-style: italic; color: #0a499b;">Mobile:</strong> -->
                                        <img src="https://img.icons8.com/material-outlined/24/000000/phone.png" alt="Phone Icon" 
                                        class="icon" style="width: 15px;">
                                    </td>
                                    <td style="padding-left: 5px; font-size: 10px; text-align: justify;">
                                        <p style="margin: 0;">+91 62387 83025, +91 73064 30169</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="vertical-align: top; text-align: center;">
                                        <!-- <strong style="font-style: italic; color: #0a499b;">Email:</strong> -->
                                        <img src="https://img.icons8.com/material-outlined/24/000000/email.png" alt="Email Icon" 
                                        class="icon" style="width: 15px;">
                                    </td>
                                    <td style="padding-left: 5px; font-size: 10px; text-align: justify;">
                                        <a href="mailto:hr@onboardaero.com" style="color: black; text-decoration: none;">hr@onboardaero.com</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="vertical-align: top; text-align: center;">
                                        <!-- <strong style="font-style: italic; color: #0a499b;">Website:</strong> -->
                                        <img src="https://img.icons8.com/material-outlined/24/000000/internet.png" alt="Website Icon" 
                                        class="icon" style="width: 15px;">
                                    </td>
                                    <td style="padding-left: 5px; font-size: 10px; text-align: justify;">
                                        <a href="https://www.onboardaero.com" style="color: black; text-decoration: none;">www.onboardaero.com</a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                </td>
            </tr>
        </table>
  `;

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
