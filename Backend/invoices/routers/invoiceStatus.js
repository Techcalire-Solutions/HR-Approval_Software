const express = require('express');
const router = express.Router();
const {Op, fn, col, where} = require('sequelize');
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const PerformaInvoice = require('../models/performaInvoice');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const nodemailer = require('nodemailer');
const s3 = require('../../utils/s3bucket');
const multer = require('multer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });


router.post('/updatestatus', authenticateToken, async (req, res) => {
    const { performaInvoiceId, remarks, amId, accountantId, status, kamId } = req.body;
    
    try {
        const pi = await PerformaInvoice.findByPk(performaInvoiceId);
        if (!pi) {
            return res.status(404).send('Proforma Invoice not found.');
        }

        if (!Array.isArray(pi.url) || pi.url.length === 0) {
            console.error('Invalid or missing URL:', pi.url);
            return res.status(404).send('Proforma Invoice does not have an associated file or the URL is invalid.');
        }
   
        const newStatus = new PerformaInvoiceStatus({
            performaInvoiceId,
            status,
            date: new Date(),
            remarks,
        });
        await newStatus.save();

        pi.status = status;
        if (kamId != null) pi.kamId = kamId;
        if (amId != null) pi.amId = amId;
        if (accountantId != null) pi.accountantId = accountantId;
        await pi.save();
        
        // const [salesPerson, kam, am, accountant] = await Promise.all([
        //     User.findOne({ where: { id: pi.salesPersonId } }),
        //     User.findOne({ where: { id: pi.kamId } }),
        //     User.findOne({ where: { id: amId } }),
        //     User.findOne({ where: { id: accountantId } }),
        // ]);

        // const salesPersonEmail = salesPerson ? salesPerson.email : null;
        // const kamEmail = kam ? kam.email : null;
        // const accountantEmail = accountant ? accountant.email : null;
        // const amEmail = am ? am.email : null;

        // let emailSubject = `Proforma Invoice Status Update - ${pi.piNo}`;
        // let emailText = `The status of the Proforma Invoice ${pi.piNo} has been updated to ${status}.\n\n` +
        //                 `Remarks: ${remarks}\n` +
        //                 `Please check the details for further information.`;

        // let toEmail = null;

        // switch (status) {
        //     case 'AM APPROVED':
        //         emailText = `The Proforma Invoice ${pi.piNo} has been approved by AM.\n\n` + emailText;
        //         toEmail = kamEmail; 
        //         break;
        //     case 'INITIATED':
        //         emailText = `The Proforma Invoice ${pi.piNo} has been initiated.\n\n` + emailText;
        //         toEmail = amEmail; 
        //         break;
        //     case 'KAM VERIFIED':
        //         emailText = `Great news! The Proforma Invoice ${pi.piNo} has been verified by KAM.\n\n` + emailText;
        //         toEmail = [salesPersonEmail, amEmail].filter(Boolean).join(', '); 
        //         break;
        //     case 'AM VERIFIED':
        //         emailText = `The Proforma Invoice ${pi.piNo} has been successfully verified by AM.\n\n` + emailText;
        //         toEmail = [accountantEmail, kamEmail].filter(Boolean).join(', '); 
        //         break;
        //     case 'KAM REJECTED':
        //         emailText = `The Proforma Invoice ${pi.piNo} has been rejected by KAM.\n\nRemarks: ${remarks}\n` +
        //                      `Please review the invoice and take necessary actions.`;
        //         toEmail = salesPersonEmail; 
        //         break;
        //     case 'AM REJECTED':
        //         emailText = `The Proforma Invoice ${pi.piNo} has been rejected by AM.\n\nRemarks: ${remarks}\n` +
        //                      `Please review the remarks and take necessary actions.`;
        //         if (pi.addedById === pi.salesPersonId) {
        //             toEmail = salesPersonEmail;
        //         } else if (pi.addedById === pi.kamId) {
        //             toEmail = kamEmail; 
        //         }
        //         break;
        //     default:
        //         return res.status(400).send('Invalid status update.');
        // }

        // const attachmentUrl = pi.url[0].url; 
        // const attachmentFileKey = attachmentUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

        // const attachmentParams = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: attachmentFileKey,
        // };

        // console.log('Fetching attachment:', attachmentParams);

        // const attachmentS3File = await s3.getObject(attachmentParams).promise();

        // const mailOptions = {
        //     from: `${req.user.name} <${req.user.email}>`,
        //     to: toEmail,
        //     subject: emailSubject,
        //     text: emailText,
        //     attachments: [
        //         {
        //             filename: attachmentFileKey.split('/').pop(), 
        //             content: attachmentS3File.Body,
        //             contentType: attachmentS3File.ContentType,
        //         },
        //     ],
        // };

        // if (toEmail) {
        //     await transporter.sendMail(mailOptions);
        //     console.log('Email sent successfully to:', toEmail);
        // }

        res.json({ pi, status: newStatus });
    } catch (error) {
        console.error('Error updating status and sending email:', error.message);
        console.error('Detailed error stack:', error.stack);
        res.status(500).send('Internal Server Error');
    }
});



router.post('/updatestatustobankslip', authenticateToken, async (req, res) => {
    const { performaInvoiceId, status } = req.body;
    try {
        let newStat;
        console.log(status);
        
        if(status === 'AM APPROVED'){ newStat = 'CARD PAYMENT COMPLETED' }
        else if(status === 'AM VERIFIED'){ newStat = 'BANK SLIP ISSUED' }
        const result = new PerformaInvoiceStatus({ performaInvoiceId, status: newStat, date: Date.now() });

        let pi = await PerformaInvoice.findByPk(performaInvoiceId)
        pi.status = newStat;
        await pi.save();
        
        await result.save();

        res.send(result);
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbypi', authenticateToken, async (req, res) => {
    try {
        
        let whereClause = { performaInvoiceId: req.query.id };
        if (req.query.search && req.query.search != 'undefined') {
            const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
            whereClause = {
              [Op.or]: [
                sequelize.where(
                  sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('status'), ' ', '')),
                  {
                    [Op.like]: `%${searchTerm}%`
                  }
                )
              ], performaInvoiceId: req.query.id
            };
          }
        const piStatus = await PerformaInvoiceStatus.findAll({
            order:[['id','DESC']],
            where: whereClause
        })
        res.send(piStatus);
    } catch (error) {
        res.send(error.message)
    }
})
module.exports = router