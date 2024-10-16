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



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });




router.post('/updatestatus', authenticateToken, async (req, res) => {
    const { performaInvoiceId, remarks, amId, accountantId } = req.body;

    try {
  
        const pi = await PerformaInvoice.findByPk(performaInvoiceId);
        if (!pi || !pi.url) {
            return res.status(404).send('Proforma Invoice not found or does not have an associated file.');
        }

  
        const status = new PerformaInvoiceStatus({
            performaInvoiceId,
            status: req.body.status,
            date: Date.now(),
            remarks,
        });
        await status.save();

      
        pi.status = req.body.status;
        if (amId != null) pi.amId = amId;
        if (accountantId != null) pi.accountantId = accountantId;
        await pi.save();

      
        const [salesPerson, kam, am, accountant] = await Promise.all([
            User.findOne({ where: { id: pi.salesPersonId } }),
            User.findOne({ where: { id: pi.kamId } }),
            User.findOne({ where: { id: amId } }),
            User.findOne({ where: { id: accountantId } }),
        ]);

        const salesPersonEmail = salesPerson ? salesPerson.email : null;
        const kamEmail = kam ? kam.email : null;
        const accountantEmail = accountant ? accountant.email : null;
        const amEmail = am ? am.email : null;

       
        let emailSubject = `Proforma Invoice Status Update - ${pi.id}`;
        let emailText = `The status of the Proforma Invoice ${pi.id} has been updated to ${req.body.status}.\n\n` +
                        `Remarks: ${remarks}\n` +
                        `Please check the details for further information.`;

    
        let toEmail = null;

        switch (req.body.status) {
            case 'KAM VERIFIED':
                emailText = `Great news! The Proforma Invoice ${pi.id} has been verified by KAM.\n\n` + emailText;
                toEmail = [amEmail, salesPersonEmail].join(', ');
                break;
            case 'AM VERIFIED':
                emailText = `The Proforma Invoice ${pi.id} has been successfully verified by AM.\n\n` + emailText;
                toEmail = accountantEmail; 
                break;
            case 'KAM REJECTED':
                emailText = `The Proforma Invoice ${pi.id} has been rejected by KAM.\n\nRemarks: ${remarks}\n` +
                             `Please review the invoice and take necessary actions.`;
                toEmail = salesPersonEmail; 
                break;
            case 'AM REJECTED':
                emailText = `The Proforma Invoice ${pi.id} has been rejected by AM. Please review the remarks:\n${remarks}`;
                toEmail = kamEmail; 
                break;
            default:
                return res.status(400).send('Invalid status update.');
        }

       
        const attachmentUrl = pi.url; 
        const attachmentFileKey = attachmentUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

        const attachmentParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: attachmentFileKey,
        };

      
        const attachmentS3File = await s3.getObject(attachmentParams).promise();
        const attachmentBuffer = attachmentS3File.Body;

        
        const mailOptions = {
            from: `${req.user.name} <${req.user.email}>`,
            to: toEmail,
            subject: emailSubject,
            text: emailText,
            attachments: [
                {
                    filename: attachmentFileKey.split('/').pop(), 
                    content: attachmentBuffer,
                    contentType: attachmentS3File.ContentType 
                }
            ]
        };

  
        if (toEmail) {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully to:', toEmail);
        }

        res.json({ pi, status });
    } catch (error) {
        console.error('Error updating status and sending email:', error.message);
        res.status(500).send('Internal Server Error');
    }
});





router.post('/updatestatustobankslip', authenticateToken, async (req, res) => {
    const { performaInvoiceId } = req.body;
    try {
        const status = new PerformaInvoiceStatus({ performaInvoiceId, status: 'BANK SLIP ISSUED', date: Date.now() });

        let pi = await PerformaInvoice.findByPk(performaInvoiceId)
        pi.status = 'BANK SLIP ISSUED';
        await pi.save();

        await status.save();

        res.send(status);
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
            where: whereClause
        })
        res.send(piStatus);
    } catch (error) {
        res.send(error.message)
    }
})
module.exports = router