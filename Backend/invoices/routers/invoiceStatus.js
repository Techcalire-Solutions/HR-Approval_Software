const express = require('express');
const router = express.Router();
const {Op} = require('sequelize');
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const PerformaInvoice = require('../models/performaInvoice');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user')

const nodemailer = require('nodemailer');
const s3 = require('../../utils/s3bucket');
const multer = require('multer');
const Notification = require('../models/notification');
const UserPosition = require('../../users/models/userPosition');


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

        const [salesPerson, kam, am, accountant] = await Promise.all([
            UserPosition.findOne({ where: { id: pi.salesPersonId } }),
            UserPosition.findOne({ where: { id: kamId } }),
            UserPosition.findOne({ where: { id: amId } }),
            UserPosition.findOne({ where: { id: accountantId } }),
        ]);
    
        try {
            const salesPersonEmail = salesPerson ? salesPerson.projectMailId : null;
            const kamEmail = kam ? kam.projectMailId : null;
            const accountantEmail = accountant ? accountant.projectMailId : null;
            const amEmail = am ? am.projectMailId : null;
        
        
            if (!salesPersonEmail || !kamEmail || !accountantEmail || !amEmail) {
                return res.send('One or more project mail IDs not found. No action will be taken.');
            }
        
        } catch (error) {
            res.send(error.message);
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

        console.log(pi);
      
        



        let toEmail = null;
        let notificationMessage = '';

     
        switch (status) {
            case 'AM APPROVED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been approved by AM.`;
                toEmail = kamEmail;
                break;
            case 'INITIATED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been initiated.`;
                toEmail = amEmail;
                break;
            case 'KAM VERIFIED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been verified by KAM.`;
                toEmail = [salesPersonEmail, amEmail].filter(Boolean).join(', ');
                break;
            case 'KAM REJECTED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been rejected by KAM.` ;
                    toEmail = salesPersonEmail; 
                    break;
            case 'AM VERIFIED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been verified by AM.`;
                toEmail = [accountantEmail, kamEmail].filter(Boolean).join(', ');
                break;
            case 'AM DECLINED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been declined by AM.`;
                toEmail = pi.addedById === pi.salesPersonId ? salesPersonEmail : kamEmail;
                break;
            case 'AM REJECTED':
                notificationMessage = `The Proforma Invoice ${pi.piNo} has been rejected by AM.`;
                toEmail = pi.addedById === pi.salesPersonId ? salesPersonEmail : kamEmail;
                break;
            default:
                return res.status(400).send('Invalid status update.');
        }

        const involvedUsers = [salesPerson, kam, am, accountant].filter(Boolean);
        const createdNotifications = await Promise.all(involvedUsers.map(user => 
            Notification.create({ userId: user.id, message: notificationMessage })
        ));


        
if (!Array.isArray(pi.url) || pi.url.length === 0) {
    console.error('Invalid or missing URL:', pi.url);
    return res.status(404).send('Proforma Invoice does not have an associated file or the URL is invalid.');
}
const attachments = [];

for (const fileObj of pi.url) {

    const actualUrl = typeof fileObj === 'string' ? fileObj : fileObj.url;

 
    if (!actualUrl || typeof actualUrl !== 'string') {
        console.warn('Skipping invalid URL:', fileObj);
        continue;
    }

    const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
    };

    try {
        const s3File = await s3.getObject(params).promise();
        attachments.push({
            filename: actualUrl.split('/').pop(),
            content: s3File.Body,
            contentType: s3File.ContentType
        });
    } catch (error) {
        console.error(`Error fetching file from S3 for URL ${actualUrl}:`, error.message);
        continue; 
    }
}

      
        const mailOptions = {
            from: `${req.user.name} <${req.user.email}>`,
            to: toEmail,
            subject: notificationMessage,
            html: `
            <p><strong>Entry Number:</strong> ${pi.piNo}</p>
            <p><strong>Supplier Name:</strong> ${pi.supplierName}</p>
            <p><strong>Supplier PO No:</strong> ${pi.supplierPoNo}</p>
            <p><strong>Supplier SO No:</strong> ${pi.supplierSoNo}</p>
            <p><strong>Status:</strong> ${newStatus.status}</p>
            <p><strong>Payment Mode:</strong> ${pi.paymentMode}</p>
            ${pi.purpose === 'Stock' 
                ? `<p><strong>Purpose:</strong> Stock</p>` 
                : `<p><strong>Purpose:</strong> Customer</p>
                   <p><strong>Customer Name:</strong> ${pi.customerName}</p>
                   <p><strong>Customer PO No:</strong> ${pi.customerPoNo}</p>
                   <p><strong>Customer SO No:</strong> ${pi.customerSoNo}</p>`
            }
            <p><strong>Notes:</strong> ${pi.notes}</p>
            <p>Please find the attached documents related to this Proforma Invoice.</p>
        `,
        attachments: attachments
        };

   
        if (toEmail) {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully to:', toEmail);
        }

        res.json({ pi, status: newStatus, notifications: createdNotifications });

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