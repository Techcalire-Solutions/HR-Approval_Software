/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoice = require('../models/performaInvoice');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const User = require('../../users/models/user');
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');
const s3 = require('../../utils/s3bucket');
const Role = require('../../users/models/role');
const nodemailer = require('nodemailer');
const TeamMember = require('../../users/models/teamMember');
const Team = require('../../users/models/team');
const Company = require('../models/company');
const Notification = require('../../notification/models/notification')
const UserPosition = require('../../users/models/userPosition')
const config = require('../../utils/config');
const Designation = require('../../users/models/designation');
const TeamLeader = require('../../users/models/teamLeader')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.payUser,
      pass: config.email.payPass,
    }
  });


router.post('/save', authenticateToken, async (req, res) => {
    let { piNo, url, kamId, amId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, customerId,
        customerPoNo, customerSoNo, customerCurrency, poValue, notes, paymentMode } = req.body;

    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    const userId = req.user.id;
    let status;

    kamId = kamId === '' ? null : kamId;
    amId = amId === '' ? null : amId;
    customerId = customerId === '' ? null : customerId;

    if (paymentMode === 'CreditCard') {
        if (!amId) {
            return res.send('Please Select Account Manager');
        }
        status = 'INITIATED';
    } else if (paymentMode === 'WireTransfer') {
        if (!kamId) {
            return res.send('Please Select Key Account Manager');
        }
        status = 'GENERATED';
    }

    try {
   
        let recipientEmail = null;
        let notificationRecipientId = null;
        if (paymentMode === 'CreditCard') {
            const am = await UserPosition.findOne({ where: { userId: amId } });
            recipientEmail = am ? am.projectMailId : null;
            notificationRecipientId = amId;
            if (!recipientEmail) {
                return res.send("AM project email is missing.\n Please inform the admin to add it.");
            }
        } else if (paymentMode === 'WireTransfer') {
            const kam = await UserPosition.findOne({ where: { userId: kamId } });
            recipientEmail = kam ? kam.projectMailId : null;
             notificationRecipientId = kamId;
            if (!recipientEmail) {
                return res.send("KAM project email is missing. \n Please inform the admin to add it.");
            }
        }

        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo } });
        if (existingInvoice) {
            return res.json({ error: 'Invoice is already saved' });
        }

        const newPi = await PerformaInvoice.create({
            piNo, url, status, salesPersonId: userId, kamId, supplierId, amId,
            supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
            customerId, customerPoNo, customerSoNo, customerCurrency, poValue,
            addedById: userId, notes, paymentMode
        });

        await PerformaInvoiceStatus.create({
            performaInvoiceId: newPi.id,
            status,
            date: new Date(),
        });

        const attachments = [];
        for (const fileObj of url) {
            const actualUrl = fileObj.url || fileObj.file;
            if (!actualUrl) continue;

            const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };

            try {
                const s3File = await s3.getObject(params).promise();
                attachments.push({
                    filename: actualUrl.split('/').pop(),
                    content: s3File.Body,
                    contentType: s3File.ContentType
                });
            } catch (error) {
                continue;
            }
        }

        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });

        const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
        const customerName = customer ? customer.companyName : 'Unknown Customer';

        const mailOptions = {
            from: `Proforma Invoice <${config.email.payUser}>`,
            to: recipientEmail,
            cc: process.env.FINANCE_EMAIL_USER,
            subject: `New Payment Request Generated ${piNo} / ${supplierPoNo}`,
            html: `
            <p>Request Generated By <strong>${req.user.name}</strong></p>
            <p><strong>Entry Number:</strong> ${piNo}</p>
            <p><strong>Supplier Name:</strong> ${supplierName}</p>
            <p><strong>PO No:</strong> ${supplierPoNo}</p>
            <p><strong>Supplier Invoice No:</strong> ${supplierSoNo}</p>
            <p><strong>Supplier Currency:</strong> ${supplierCurrency}</p>
            <p><strong>Status:</strong> ${newPi.status}</p>
            <p><strong>Payment Mode:</strong> ${paymentMode}</p>
            ${purpose === 'Stock' 
                ? `<p><strong>Purpose:</strong> Stock</p>` 
                : `<p><strong>Purpose:</strong> Customer</p>
                   <p><strong>Customer Name:</strong> ${customerName}</p>
                   <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                   <p><strong>Customer SO No:</strong> ${customerSoNo}</p>
                   <p><strong>Customer Currency:</strong> ${customerCurrency}</p>`
            }
            <p><strong>Notes:</strong> ${newPi.notes}</p>
            <p>Please find the attached documents related to this Proforma Invoice.</p>
        `,
        attachments: attachments
        };

        await transporter.sendMail(mailOptions);

      
             await Notification.create({
                userId: notificationRecipientId,
                message: `New Payment Request Generated ${piNo} / ${supplierPoNo}`,
                isRead: false,
            });

        res.json({
            piNo: newPi.piNo,
            status: newPi.status,
            message: 'Proforma Invoice saved successfully....'
        });
    } catch (error) {
        res.send(error.message);
    }
});



  
router.post('/saveByKAM', authenticateToken, async (req, res) => {
    const { piNo, url, amId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
        customerId, customerPoNo, customerSoNo, customerCurrency, poValue,  notes,  paymentMode } = req.body;
    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    const userId = req.user.id;
        
    try {
        if(amId==null){
            return res.send('Please Select Manager to be assigned');
        }
        
    } catch (error) {
        res.send(error.message)
    }
    let status;
    if(paymentMode === 'CreditCard'){
        status = 'INITIATED'
    } else {
        status = 'KAM VERIFIED'
    }
    let recipientEmail = null ;
    let notificationRecipientId = null ;
    try {
    
        const am = await UserPosition.findOne({where:{userId:amId}})
        recipientEmail = am ? am.projectMailId : null ;
        notificationRecipientId = amId

        if (!recipientEmail) { 
            return res.send("AM project email is missing.\n Please inform the admin to add it.");
        }
        
        
    } catch (error) {
        res.send(error.message)
        
    }

    try {
 
        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo: piNo } });
        if (existingInvoice) {
            return res.send( 'Invoice is already saved' );
        }


        const newPi = await PerformaInvoice.create({ piNo, url, status: status, kamId: userId, amId, supplierId,
            supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, customerId, customerPoNo, customerSoNo,
            customerCurrency, poValue, addedById: userId, notes, paymentMode
        });

        const piId = newPi.id;
        const piStatus = await PerformaInvoiceStatus.create({
            performaInvoiceId: piId,
            status: status,
            date: new Date(),
        });


   const supplier = await Company.findOne({ where: { id: supplierId } });
   const customer = await Company.findOne({ where: { id: customerId } });

   const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
   const customerName = customer ? customer.companyName : 'Unknown Customer';

     

   const attachments = [];

  
   for (const fileObj of url) {
       const actualUrl = fileObj.url || fileObj.file;
       if (!actualUrl) continue;

       const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

       const params = {
           Bucket: process.env.AWS_BUCKET_NAME,
           Key: fileKey,
       };

       try {
           const s3File = await s3.getObject(params).promise();
           const fileBuffer = s3File.Body;

           attachments.push({
               filename: actualUrl.split('/').pop(),
               content: fileBuffer,
               contentType: s3File.ContentType,
           });
       } catch (error) {
           continue; 
       }
   }


   const mailOptions = {
       from: `Proforma Invoice <${config.email.payUser}>`,
       to: recipientEmail,
       cc: process.env.FINANCE_EMAIL_USER,
       subject: `New Payment request  Generated - ${piNo} / ${supplierPoNo}`,
       html: `
       <p>Request Generated By <strong>${req.user.name}</strong></p>
       <p><strong>Entry Number:</strong> ${piNo}</p>
       <p><strong>Supplier Name:</strong> ${supplierName}</p>
       <p><strong>PO No:</strong> ${supplierPoNo}</p>
       <p><strong>Supplier Invoice No:</strong> ${supplierSoNo}</p>
       <p><strong>Supplier Currency:</strong> ${supplierCurrency}</p>
       <p><strong>Status:</strong> ${newPi.status}</p>
       <p><strong>Payment Mode:</strong> ${paymentMode}</p>
       ${purpose === 'Stock' 
           ? `<p><strong>Purpose:</strong> Stock</p>` 
           : `<p><strong>Purpose:</strong> Customer</p>
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
              <p><strong>Customer SO No:</strong> ${customerSoNo}</p>
              <p><strong>Customer Currency:</strong> ${customerCurrency}</p>`
       }
       <p><strong>Notes:</strong> ${newPi.notes}</p>
       <p>Please find the attached documents related to this Proforma Invoice.</p>
   `,
   attachments: attachments
   };

   await transporter.sendMail(mailOptions);
             

   await Notification.create({
    userId: notificationRecipientId,
    message: `New Payment Request Generated ${piNo} / ${supplierPoNo}`,
    isRead: false,
});

        res.json({
            piNo: newPi.piNo,          
            status: piStatus.status,   
            res: newPi,
            message: 'Proforma Invoice saved successfully' 
        });
    } catch (error) {
        res.send( error.message );
    }
});

router.post('/saveByAM', authenticateToken, async (req, res) => {
    let { piNo, url, accountantId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
        customerId, customerPoNo, customerSoNo, customerCurrency, poValue, notes, paymentMode, kamId } = req.body;

    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }

    const userId = req.user.id;
    kamId = kamId === '' ? null : kamId;
    accountantId = accountantId === '' ? null : accountantId;
    customerId = customerId === '' ? null : customerId;

    let status;
   

    if (paymentMode === 'CreditCard') {
        if (kamId == null) {
            return res.send('Please Select Key Account Manager');
        }
        status = 'AM APPROVED';
    } else {
        if (accountantId == null) {
            return res.send('Please Select Accountant');
        }
        status = 'AM VERIFIED';
    }
    let recipientEmail = null; 
    let notificationRecipientId = null
    try {
        if (paymentMode === 'CreditCard') {
            const kam = await UserPosition.findOne({ where: {userId: kamId } });
            recipientEmail = kam ? kam.projectMailId : null ;
            notificationRecipientId = kamId;
            if (!recipientEmail) {
              return res.send("KAM project email is missing. \n Please inform the admin to add it.");
            }
        } else{
          
           const accountant = await UserPosition.findOne({where:{userId:accountantId}})
            recipientEmail = accountant ? accountant.projectMailId:null;
            notificationRecipientId =  accountantId;
            if(!recipientEmail){
                return res.send("Accoutant project email is missing. \n Please inform the admin to add it.");
            }

        }
        
    } catch (error) {
        res.send(error.message)
        
    }

    try {
        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo: piNo } });
        if (existingInvoice) {
            return res.send('Invoice is already saved') 
        }

        const newPi = await PerformaInvoice.create({
            kamId, piNo, url, accountantId, status: status, amId: userId,
            supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, customerId,
            customerSoNo, customerPoNo, customerCurrency, poValue, notes, paymentMode, addedById: userId
        });

        const piId = newPi.id;
        await PerformaInvoiceStatus.create({
            performaInvoiceId: piId,
            status: status,
            date: new Date(),
        });

        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });

        const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
        const customerName = customer ? customer.companyName : 'Unknown Customer';


        const attachments = [];
        for (const fileObj of url) {
            const actualUrl = fileObj.url || fileObj.file;
            if (!actualUrl) continue;

            const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
            };

            try {
                const s3File = await s3.getObject(params).promise();
                const fileBuffer = s3File.Body;

                attachments.push({
                    filename: actualUrl.split('/').pop(),
                    content: fileBuffer,
                    contentType: s3File.ContentType
                });
            } catch (error) {
                continue;
            }
        }

        const mailOptions = {
            from: `Proforma Invoice <${config.email.payUser}>`,
            to: recipientEmail,
            cc: process.env.FINANCE_EMAIL_USER,
            subject: `New Payment Request Generated - ${piNo} / ${supplierPoNo}`,
            html: `
                <p>A new Proforma Invoice has been generated by <strong>${req.user.name}</strong></p>
                <p><strong>Entry Number:</strong> ${piNo}</p>
                <p><strong>Supplier Name:</strong> ${supplierName}</p>
                <p><strong>Supplier PO No:</strong> ${supplierPoNo}</p>
                <p><strong>Supplier SO No:</strong> ${supplierSoNo}</p>
                <p><strong>Status:</strong> ${newPi.status}</p>
                ${purpose === 'Stock' 
                    ? `<p><strong>Purpose:</strong> Stock</p>` 
                    : `<p><strong>Purpose:</strong> Customer</p>
                       <p><strong>Customer Name:</strong> ${customerName}</p>
                       <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                       <p><strong>Customer SO No:</strong> ${customerSoNo}</p>`
                }
                <p><strong>Payment Mode:</strong> ${newPi.paymentMode}</p>
                <p><strong>Notes:</strong> ${newPi.notes}</p>
                <p>Please find the attached documents related to this Proforma Invoice.</p>
            `,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);

        await Notification.create({
            userId: notificationRecipientId,
            message: `New Payment Request Generated ${piNo} / ${supplierPoNo}`,
            isRead: false,
        });
        

        res.json({
            piNo: newPi.piNo,
            status: status, 
            message: 'Proforma Invoice saved successfully'
        });
    } catch (error) {
        res.send(error.message);
    }
});

router.get('/find', authenticateToken, async(req, res) => {
    let status = req.query.status;
    
    let where = {};
    if(status != '' && status != 'undefined'){
        where = { status: status}
    }

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    try {
        const pi = await PerformaInvoice.findAll({
            where: where, limit, offset,
            order: [['id', 'DESC']],
            include:[
                { model: Company, as: 'suppliers' }, 
                { model: Company, as: 'customers' }, 

                { model: PerformaInvoiceStatus },
                
                
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] },
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                        
                    ]
                }
            ],
        })
        const totalCount = await PerformaInvoice.count({ where: where });

        if (req.query.pageSize && req.query.page && req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
            const response = {
                count: totalCount,
                items: pi,
            };
            res.json(response);
        } else {
            res.send(pi);
        }
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyid/:id', authenticateToken, async(req, res) => {
    try {
    
        const pi = await PerformaInvoice.findByPk(req.params.id, {
            include:[
                { model: Company, as: 'suppliers' }, 
                { model: Company, as: 'customers' }, 

                { model: PerformaInvoiceStatus },
                
                
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] },
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                        
                    ]
                }
              ]
    })
        let signedUrl = [];
        if (pi.url.length > 0) {
            for(let i = 0; i < pi.url.length; i++) {
                const fileUrl = pi.url[i];
                
                const key = fileUrl.url.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
                
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key, 
                    Expires: 60,
                  };
                
                  signedUrl[i] ={ url: s3.getSignedUrl('getObject', params), remarks: fileUrl.remarks}
            }
        }
        let bankSlipUrl = '';
        if(pi.bankSlip){
            const bankSlip = pi.bankSlip;
            const bankKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            
            const bankParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: bankKey, // Ensure pi.url has the correct value
                Expires: 60, // URL expires in 60 seconds
              };
          
              bankSlipUrl = s3.getSignedUrl('getObject', bankParams);
        }
      
        res.json({ pi: pi, signedUrl: signedUrl, bankSlip: bankSlipUrl });
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbysp', authenticateToken, async (req, res) => {
    const status = req.query.status;
    const userId = req.user.id;
    // Initialize the where clause
    let where = { salesPersonId: userId };
    
    if (status !== '' && status !== 'undefined' && status !== 'REJECTED' && status !== 'BANK SLIP ISSUED' && status !== 'GENERATED') {
        where.status = status;
    }  else if (status === 'GENERATED') {
        where.status = { [Op.or]: ['GENERATED', 'INITIATED'] };
    } else if (status === 'BANK SLIP ISSUED') {
        where.status = { [Op.or]: ['BANK SLIP ISSUED', 'CARD PAYMENT SUCCESS'] };
    } else if (status === 'REJECTED') {
        where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED', 'AM DECLINED'] };
    }
    
    if (req.query.search !== '' && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        where[Op.or] = [
            ...(where[Op.or] || []),
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
                {
                    [Op.like]: `%${searchTerm}%`
                }
            )
        ];
    }

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    try {
            const teamMember = await TeamMember.findOne({ where: { userId } });
            if(teamMember){
                const teamId = teamMember.teamId;
    
                const teamLeaders = await TeamLeader.findAll({ where: { teamId } });
                const teamLeadIds = teamLeaders.map(leader => leader.userId);
                // Get all user IDs in the team
                const teamMembers = await TeamMember.findAll({ where: { teamId } });
                const teamUserIds = teamMembers.map(member => member.userId);
        
                // Include the team lead's userId in the list of allowed user IDs
                const allowedUserIds = [...teamUserIds, ...teamLeadIds];
                // Update where clause to include all team user IDs
                where.salesPersonId = allowedUserIds;
            }else{
                const teamLeader = await TeamLeader.findOne({ where: { userId } });
                if(teamLeader){
                    const teamId = teamLeader.teamId;
                    
                    const teamLeaders = await TeamLeader.findAll({ where: { teamId } });
                    const teamLeadIds = teamLeaders.map(leader => leader.userId);
                    // Get all user IDs in the team
                    const teamMembers = await TeamMember.findAll({ where: { teamId } });
                    const teamUserIds = teamMembers.map(member => member.userId);
            
                    // Include the team lead's userId in the list of allowed user IDs
                    const allowedUserIds = [...teamUserIds, ...teamLeadIds];
                    // Update where clause to include all team user IDs
                    where.salesPersonId = allowedUserIds;
                }
            }
    
            



        const pi = await PerformaInvoice.findAll({
            include:[
                { model: Company, as: 'suppliers' }, 
                { model: Company, as: 'customers' }, 

                { model: PerformaInvoiceStatus },
                
                
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] },
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                        
                    ]
                }
            ],
            where: where, limit, offset,
            order: [['id', 'DESC']],
        });

        const totalCount = await PerformaInvoice.count({ where: where });

        if (req.query.page && req.query.pageSize && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
                count: totalCount,
                items: pi,
            };
            res.json(response);
        } else {
            res.send(pi);
        }
    } catch (error) {
        res.send(error.message);
    }
});

router.get('/findbkam', authenticateToken, async(req, res) => {
    let status = req.query.status;
    let user = req.user.id;
    
    let where = { kamId: user };

    if (status !== '' && status !== 'undefined' && status !== 'REJECTED' && status !== 'GENERATED' && status != 'BANK SLIP ISSUED') {
        where.status = status;
    } else if (status === 'GENERATED') {
        where.status = { [Op.or]: ['GENERATED', 'AM APPROVED'] };
    } else if (status === 'BANK SLIP ISSUED') {
        where.status = { [Op.or]: ['BANK SLIP ISSUED', 'CARD PAYMENT SUCCESS'] };
    }else if (status === 'REJECTED') {
        where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
    }
    
    if (req.query.search !== '' && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        where[Op.or] = [
            ...(where[Op.or] || []),
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
                {
                    [Op.like]: `%${searchTerm}%`
                }
            )
        ];
    }  
    
    let limit; 
    let offset; 
    if (req.query.pageSize !== '' && req.query.page !== '' && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined' ) {
        limit = req.query.pageSize;
        offset = (req.query.page - 1) * req.query.pageSize;
      }
    try {
        const pi = await PerformaInvoice.findAll({
            where: where, limit, offset,
            order: [['id', 'DESC']],
            include: [
                {model: PerformaInvoiceStatus},
                {model: User, as: 'salesPerson', attributes: ['name']},
                {model: User, as: 'kam', attributes: ['name']},
                {model: User, as: 'am', attributes: ['name']},
                {model: User, as: 'accountant', attributes: ['name']},
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                    ]
                }
            ]
        })
        
        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
              count: totalCount,
              items: pi,
            };
            res.json(response);
          } else {
            res.send(pi);
          }
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyam', authenticateToken, async(req, res) => {
    let status = req.query.status;
    
    let user = req.user.id;
    
    let where = { amId: user };

    if (status !== '' && status !== 'undefined' && status !== 'REJECTED' && status != 'KAM VERIFIED' && status != 'BANK SLIP ISSUED') {
        where.status = status;
    } else if (status === 'BANK SLIP ISSUED') {
        where.status = { [Op.or]: ['BANK SLIP ISSUED', 'CARD PAYMENT SUCCESS'] };
    }else if (status === 'KAM VERIFIED') {
        where.status = { [Op.or]: ['KAM VERIFIED', 'INITIATED'] };
    } else if (status === 'REJECTED') {
        where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
    }
    
    if (req.query.search !== '' && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        where[Op.or] = [
            ...(where[Op.or] || []),
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
                {
                    [Op.like]: `%${searchTerm}%`
                }
            )
        ];
    }  

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = req.query.pageSize;
        offset = (req.query.page - 1) * req.query.pageSize;
      }
    try {
        const pi = await PerformaInvoice.findAll({
            where: where, limit, offset,
            order: [['id', 'DESC']],
            include: [  
                {model: PerformaInvoiceStatus},
                {model: User, as: 'salesPerson', attributes: ['name']},
                {model: User, as: 'kam', attributes: ['name']},
                {model: User, as: 'am', attributes: ['name']},
                {model: User, as: 'accountant', attributes: ['name']},
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                    ]
                }
            ]
        })

        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
              count: totalCount,
              items: pi,
            };
            res.json(response);
          } else {
            res.send(pi);
          }
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyma', authenticateToken, async(req, res) => {
    
    let status = req.query.status;
    let user = req.user.id;

    let where = { accountantId: user };

    if (status !== '' && status !== 'undefined' && status !== 'REJECTED' && status != 'BANK SLIP ISSUED') {
        where.status = status;
    } else if (status === 'BANK SLIP ISSUED') {
        where.status = { [Op.or]: ['BANK SLIP ISSUED', 'CARD PAYMENT SUCCESS'] };
    } else if (status === 'REJECTED') {
        where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
    }
    
    if (req.query.search !== '' && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        where[Op.or] = [
            ...(where[Op.or] || []),
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
                {
                    [Op.like]: `%${searchTerm}%`
                }
            )
        ];
    }  

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = req.query.pageSize;
        offset = (req.query.page - 1) * req.query.pageSize;
    }
    try {
        
        const pi = await PerformaInvoice.findAll({
            where: where, limit, offset,
            order: [['id', 'DESC']],
            include: [
                {model: PerformaInvoiceStatus},
                {model: User, as: 'salesPerson', attributes: ['name']},
                {model: User, as: 'kam', attributes: ['name']},
                {model: User, as: 'am', attributes: ['name']},
                {model: User, as: 'accountant', attributes: ['name']},
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                    ]
                }

            ]
        })

        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
              count: totalCount,
              items: pi,
            };
            res.json(response);
          } else {
            res.send(pi);
          }
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyadmin', authenticateToken, async (req, res) => {
    let status = req.query.status;
    
    // Default where condition
    let where = {};
    if (status !== '' && status !== 'undefined' && status !== 'REJECTED') {
        
        where.status = status;
    } else if (status === 'REJECTED') {
        where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
    }  
    
    if (req.query.search !== '' && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        where[Op.or] = [
            ...(where[Op.or] || []),
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
                {
                    [Op.like]: `%${searchTerm}%`
                }
            )
        ];
    }  

    let limit; 
    let offset; 
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = req.query.pageSize;
        offset = (req.query.page - 1) * req.query.pageSize;
    }

    try {
        const pi = await PerformaInvoice.findAll({
            where: where,
            limit,
            offset,
            order: [['id', 'DESC']],
            include: [
                { model: PerformaInvoiceStatus },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] },
                { model: User, as: 'addedBy', attributes: ['name','roleId'],
                    include: [
                        { model: Role, attributes: ['roleName']}
                    ]
                }
            ]
        });

        let totalCount = await PerformaInvoice.count({ where: where });
        
        if (req.query.page && req.query.pageSize !== 'undefined') {
            const response = {
                count: totalCount,
                items: pi,
            };
            res.json(response);
        } else {
            res.send(pi);
        }
    } catch (error) {
        res.send(error.message);
    }
});

async function findFinanceMail() {
    try {

        const userPosition = await UserPosition.findOne({
            include: [{
                model: Designation,
                where: { designationName: 'FINANCE MANAGER' },
                attributes: [] 
            }],
            attributes: ['projectMailId'] 
        });

        if (!userPosition) {
            return null;
        }

    
        return userPosition.projectMailId;

    } catch (error) {
        return null;
    }
}






router.patch('/bankslip/:id', authenticateToken, async (req, res) => {
   
    const financeEmail = await findFinanceMail()

    const { bankSlip } = req.body;
    try {
        pi = await PerformaInvoice.findByPk(req.params.id,
          {  include: [
                { model: User, as: 'salesPerson', attributes: ['name','empNo'] },
                { model: User, as: 'kam', attributes: ['name','empNo'] },
                { model: User, as: 'am', attributes: ['name','empNo'] },
                { model: User, as: 'accountant', attributes: ['name','empNo'] }
            ]}
        );
        if (!pi) {
            return res.send('Invoice not found' );
        }
        
        let message = 'processed'
        if( pi.bankSlip != null){
            message = 'updated'
            pi.count += 1;
            await pi.save();

            const key = pi.bankSlip;
            const fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
            try {
              if (!fileKey) {
                return res.send({ message: 'No file key provided' });
              }
    
              // Set S3 delete parameters
              const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey
              };
    
              await s3.deleteObject(deleteParams).promise();
              
            }catch (error) {
              res.send(error.message)
            }
        }

        const userRoles = [
            { id: pi.salesPersonId, role: 'SalesPerson', empNo: pi.salesPerson?.empNo, name: pi.salesPerson?.name },
            { id: pi.kamId, role: 'KAM', empNo: pi.kam?.empNo, name: pi.kam?.name  },
            { id: pi.amId, role: 'AM', empNo: pi.am?.empNo, name: pi.am?.name  },
            { id: pi.accountantId, role: 'Accountant', empNo: pi.accountant?.empNo, name: pi.accountant?.name  }
          ].filter(user => user.id !== null);
        
          if (userRoles.length === 0) {
            return res.send("No user IDs found in the invoice.");
          }
        
           // Step 2: Get project emails for all user roles
            const userPositions = await UserPosition.findAll({
                where: { userId: userRoles.map(user => user.id) },
                attributes: ['userId', 'projectMailId']
            });
  
            // Map user IDs to project emails
            const userEmailMap = new Map(userPositions.map(user => [user.userId, user.projectMailId]));
  
            // Check for missing emails
            const missingEmails = userRoles
                .filter(user => !userEmailMap.get(user.id) || userEmailMap.get(user.id) === null)
                .map(user => `${user.role}-${user.name} with ID ${user.empNo} is missing a project email.`);
        
            if (missingEmails.length > 0) {
                return res.send(`Missing project emails: \n${missingEmails.join('\n')}` );
            }
  
      // Step 3: Collect all other project emails except for the accountant's email
      const recipientEmails = userPositions
        .filter(user => user.userId !== pi.accountantId)
        .map(user => user.projectMailId);
  
      // Proceed with status validation and updates
      let newStat;
      if (pi.status === 'AM APPROVED' || pi.status === 'CARD PAYMENT SUCCESS') {
        newStat = 'CARD PAYMENT SUCCESS';
      } else if (pi.status === 'AM VERIFIED' || pi.status === 'BANK SLIP ISSUED') {
        newStat = 'BANK SLIP ISSUED';
      } else {
        return res.json({ message: 'Invalid status' });
      }
  
      // Update the invoice status and save
      pi.bankSlip = bankSlip;
      pi.status = newStat;
      await pi.save();
  
      // Log status change in PerformaInvoiceStatus
      await PerformaInvoiceStatus.create({
        performaInvoiceId: pi.id,
        status: newStat,
        date: new Date()
      });


    //  Fetch supplier and customer details for email
      const [supplier, customer] = await Promise.all([
        Company.findOne({ where: { id: pi.supplierId } }),
        Company.findOne({ where: { id: pi.customerId } })
      ]);
  
      const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
      const customerName = customer ? customer.companyName : 'Unknown Customer';
  
      const attachments = [];
  
      // Step 5: Prepare file attachments from S3 for invoice URL list
      for (const fileObj of pi.url) {
        const actualUrl = fileObj.url || fileObj.file;
        if (!actualUrl || typeof actualUrl !== 'string') continue;
  
        const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
        const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };
  
        try {
          const s3File = await s3.getObject(params).promise();
          attachments.push({
            filename: actualUrl.split('/').pop(),
            content: s3File.Body,
            contentType: s3File.ContentType,
          });
        } catch (error) {
          continue;
        }
      }
  
      // Step 6: Attach bank slip if available
      if (bankSlip && typeof bankSlip === 'string') {
        const fileKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
        const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };
  
        try {
          const s3File = await s3.getObject(params).promise();
          attachments.push({
            filename: bankSlip.split('/').pop(),
            content: s3File.Body,
            contentType: s3File.ContentType,
          });
        } catch (error) {
          console.error("Error fetching bank slip from S3:", error);
        }
      }
  
      // Step 7: Prepare email subject and body
      let emailSubject, emailBody;
  
      if (pi.status === 'CARD PAYMENT SUCCESS') {
            emailSubject = `Card Payment Successfully Processed for Proforma Invoice - ${pi.piNo}`;
            emailBody = `
                <p>Dear Team,</p>
                <p>We are pleased to inform you that the card payment for proforma invoice: <strong>${pi.piNo}</strong> has been successfully ${message}.</p>
                <p>Please find the bank slip attached for your records. If you have any questions or require further assistance, feel free to reach out.</p>
                
                    <p><strong>Entry Number:</strong> ${pi.piNo}</p>
                <p><strong>Supplier Name:</strong> ${supplierName}</p>
                <p><strong>Supplier PO No:</strong> ${pi.supplierPoNo}</p>
                <p><strong>Supplier SO No:</strong> ${pi.supplierSoNo}</p>
                <p><strong>Status:</strong> ${pi.status}</p>
                ${pi.purpose === 'Stock' 
                    ? `<p><strong>Purpose:</strong> Stock</p>` 
                    : `<p><strong>Purpose:</strong> Customer</p>
                        <p><strong>Customer Name:</strong> ${customerName}</p>
                        <p><strong>Customer PO No:</strong> ${pi.customerPoNo}</p>
                        <p><strong>Customer SO No:</strong> ${pi.customerSoNo}</p>`
                }
                <p><strong>Payment Mode:</strong> ${pi.paymentMode}</p>
                <p><strong>Notes:</strong> ${pi.notes}</p>
                <p>Thank you for your attention to this matter.</p>
                <p>Best regards,<br> Finance Team</p>`;
      } else if (pi.status === 'BANK SLIP ISSUED') {
            emailSubject = `Payslip Issued for Proforma Invoice - ${pi.piNo}`;
            emailBody = `
                <p>Dear Team,</p>
                <p>A bank slip has been issued for proforma invoice: <strong>${pi.piNo}</strong>. You may review the attached document for the payment details.</p>
                <p>Kindly review at your earliest convenience, and please reach out if you need any additional information.</p>
                <p><strong>Entry Number:</strong> ${pi.piNo}</p>
                <p><strong>Supplier Name:</strong> ${supplierName}</p>
                <p><strong>Supplier PO No:</strong> ${pi.supplierPoNo}</p>
                <p><strong>Supplier SO No:</strong> ${pi.supplierSoNo}</p>
                <p><strong>Status:</strong> ${pi.status}</p>
                ${pi.purpose === 'Stock' 
                    ? `<p><strong>Purpose:</strong> Stock</p>` 
                    : `<p><strong>Purpose:</strong> Customer</p>
                        <p><strong>Customer Name:</strong> ${customerName}</p>
                        <p><strong>Customer PO No:</strong> ${pi.customerPoNo}</p>
                        <p><strong>Customer SO No:</strong> ${pi.customerSoNo}</p>`
                }
                <p><strong>Payment Mode:</strong> ${pi.paymentMode}</p>
                <p><strong>Notes:</strong> ${pi.notes}</p>
                
                <p>Thank you!</p>
                <p>Best regards,<br>Finance Team</p>
            `;
        }
  
      const mailOptions = {
        from: `Proforma Invoice <${config.email.payUser}>`,
        to: recipientEmails.join(','),
        cc: financeEmail,
        subject: emailSubject,
        html: emailBody,
        attachments: attachments
      };
  
      // Step 8: Send email if recipients are available
      if (recipientEmails.length > 0) {
        await transporter.sendMail(mailOptions);
      } else {
        console.error(`No recipients defined for ${newStat}. Email not sent.`);
      }
  
      // Step 9: Create notifications for each user involved in the invoice
      await Promise.all(userRoles.map(user => 
        Notification.create({
          userId: user.id,
          message: `${newStat} for Proforma Invoice ID: ${pi.piNo}.`,
          isRead: false,
        })
      ));
  
      return res.json({ pi, status: newStat });
  
    } catch (error) {
      return res.send(error.message );
    }
  })


router.patch('/updateBySE/:id', authenticateToken, async (req, res) => {

    let { url, kamId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, 
        customerId, customerSoNo, customerPoNo, customerCurrency, poValue, notes, paymentMode, amId } = req.body;

    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    kamId = kamId === '' ? null : kamId;
    amId = amId === '' ? null : amId;
    customerId = customerId === '' ? null : customerId;

    let recipientEmail = null;
    let notificationRecipientId = null;

    try {
  
        if (paymentMode === 'CreditCard') {
            if (amId == null || amId === '' || amId === undefined) {
                return res.send('Please select Manager and proceed');
            }
            const am = await UserPosition.findOne({ where: { userId: amId } });
            recipientEmail = am ? am.projectMailId : null; 
            notificationRecipientId = amId;

            if (!recipientEmail) {
                return res.send("AM project email is missing. Please inform the admin to add it.");
            }
        } else if (paymentMode === 'WireTransfer') {
            if(kamId === null || kamId  === '' || kamId === undefined) {
                return res.send('Please select Key Account Manager and proceed');
            }
            const kam = await UserPosition.findOne({ where: { userId: kamId } });
            recipientEmail = kam ? kam.projectMailId : null; 
            notificationRecipientId = kamId;

            if (!recipientEmail) {
                return res.send("KAM project email is missing. Please inform the admin to add it.");
            }
        }
    } catch (error) {
        return res.send(error.message);
    }

    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        const piNo = pi.piNo;
        if (!pi) {
            return res.send('Proforma Invoice not found.');
        }

        let status;

        if (paymentMode === 'CreditCard') {
            if (amId == null || amId === undefined || amId === '') {
                return res.send('Please select Manager.');
            }
            status = 'INITIATED';
        } else {
            if (kamId == null || kamId === undefined || kamId === '') {
                return res.send('Please select Key Account Manager.');
            }
            status = 'GENERATED';
        }

     
        pi.url = url;
        pi.kamId = kamId;
        pi.amId = amId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = status;
        pi.supplierSoNo = supplierSoNo;
        pi.supplierId = supplierId;
        pi.supplierPoNo = supplierPoNo;
        pi.supplierCurrency = supplierCurrency;
        pi.supplierPrice = supplierPrice;
        pi.purpose = purpose;
        pi.customerId = customerId;
        pi.customerSoNo = customerSoNo;
        pi.customerPoNo = customerPoNo;
        pi.customerCurrency = customerCurrency;
        pi.poValue = poValue;
        pi.paymentMode = paymentMode;
        pi.notes = notes;

        await pi.save();

        const piId = pi.id;
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, 
            status: status, 
            date: new Date(), 
            count: pi.count
        });
        await piStatus.save();


  
        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });
        const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
        const customerName = customer ? customer.companyName : 'Unknown Customer';

        const attachments = [];
        for (const fileObj of url) {
            const actualUrl = fileObj.url || fileObj.file;
            if (!actualUrl) continue;

            const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };

            try {
                const s3File = await s3.getObject(params).promise();
                const fileBuffer = s3File.Body;

                attachments.push({
                    filename: actualUrl.split('/').pop(),
                    content: fileBuffer,
                    contentType: s3File.ContentType 
                });
            } catch (error) {
                continue; 
            }
        }

    
        const mailOptions = {
            from: `Proforma Invoice <${config.email.payUser}>`,
            to: recipientEmail, 
            subject: `Proforma Invoice Updated - ${piNo}`,
            html: `
                <p>Proforma Invoice has been updated by <strong>${req.user.name}</strong></p>
                <p><strong>Entry Number:</strong> ${pi.piNo}</p>
                <p><strong>Supplier Name:</strong> ${supplierName}</p>
                <p><strong>Supplier PO No:</strong> ${supplierPoNo}</p>
                <p><strong>Supplier SO No:</strong> ${supplierSoNo}</p>
                <p><strong>Status:</strong> ${pi.status}</p>
                ${purpose === 'Stock' 
                    ? `<p><strong>Purpose:</strong> Stock</p>` 
                    : `<p><strong>Purpose:</strong> Customer</p>
                       <p><strong>Customer Name:</strong> ${customerName}</p>
                       <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                       <p><strong>Customer SO No:</strong> ${customerSoNo}</p>`
                }
                <p><strong>Payment mode:</strong> ${pi.paymentMode}</p>
                <p><strong>Notes:</strong> ${pi.notes}</p>
                <p>Please find the attached documents related to this Proforma Invoice.</p>
            `,
            attachments: attachments 
        };

        await transporter.sendMail(mailOptions);


        await Notification.create({
            userId: notificationRecipientId,
            message: `Payment Request Updated ${pi.piNo} / ${supplierPoNo}`,
            isRead: false,
        });

        res.json({
            piNo: pi.piNo,
            status: piStatus.status,
            res: pi,
            message: 'Proforma Invoice updated successfully'
        });


    } catch (error) {
        return res.send(error.message);
    }
});

router.patch('/updateByKAM/:id', authenticateToken, async(req, res) => {
    let { url, kamId, amId, supplierId,supplierSoNo, supplierPoNo,supplierCurrency, supplierPrice, purpose, customerId,
        customerSoNo, customerPoNo,customerCurrency, poValue, notes, paymentMode} = req.body;

    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    if(amId === null || amId === undefined || amId === ''){
        return res.send("Select a manager and proceed")
    }
    let status;
    if(paymentMode === 'CreditCard'){
        status = 'INITIATED'
    } else {
        status = 'KAM VERIFIED'
    }

    let recipientEmail = null ;
    let notificationRecipientId = null ;
    try {
    
        const am = await UserPosition.findOne({where:{userId:amId}})
        recipientEmail = am ? am.projectMailId : null ;
        notificationRecipientId = amId

        if (!recipientEmail) { 
            return res.send("AM project email is missing.\n Please inform the admin to add it.");
        }
        
        
    } catch (error) {
        res.send(error.message)
        
    }


    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        const piNo = pi.piNo;
        kamId = kamId === '' ? pi.kamId : kamId;
        amId = amId === '' ? pi.amId : amId;
        customerId = customerId === '' ? null : customerId;
        pi.url = url;
        pi.kamId = kamId;
        pi.amId=amId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = status;
        pi.supplierId=supplierId;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierSoNo=supplierSoNo;
        pi.supplierCurrency=supplierCurrency;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerId=customerId;
        pi.customerSoNo=customerSoNo;
        pi.customerPoNo=customerPoNo;
        pi.customerCurrency=customerCurrency;
        pi.poValue=poValue;
        pi.paymentMode=paymentMode;
        pi.notes=notes;

        await pi.save();
      

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: status, date: new Date(), count: count
        })
        await piStatus.save();




        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });

         const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
          const customerName = customer ? customer.companyName : 'Unknown Customer';

   
          const attachments = [];
  

          for (const fileObj of url) {
              const actualUrl = fileObj.url || fileObj.file;
              if (!actualUrl) continue;
  
              const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
  
              const params = {
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: fileKey,
              };
  
              try {
        
                  const s3File = await s3.getObject(params).promise();
                  const fileBuffer = s3File.Body;
  
          
                  attachments.push({
                      filename: actualUrl.split('/').pop(),
                      content: fileBuffer, 
                      contentType: s3File.ContentType 
                  });
              } catch (error) {
                  continue; 
              }
          }

     
        const mailOptions = {
            from: `Proforma Invoice <${config.email.payUser}>`,
            to:recipientEmail, 
            subject: `Proforma Invoice Updated - ${piNo}`,
            html: `
            <p>Proforma Invoice has been updated by <strong>${req.user.name}</strong></p>
            <p><strong>Entry Number:</strong> ${pi.piNo}</p>
            <p><strong>Supplier Name:</strong> ${supplierName}</p>
            <p><strong>Supplier PO No:</strong> ${supplierPoNo}</p>
            <p><strong>Supplier SO No:</strong> ${supplierSoNo}</p>
            <p><strong>Status:</strong> ${pi.status}</p>
            ${purpose === 'Stock' 
                ? `<p><strong>Purpose:</strong> Stock</p>` 
                : `<p><strong>Purpose:</strong> Customer</p>
                   <p><strong>Customer Name:</strong> ${customerName}</p>
                   <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                   <p><strong>Customer SO No:</strong> ${customerSoNo}</p>`
            }
                <p><strong>Payment mode:</strong> ${pi.paymentMode}</p>
            <p><strong>Notes:</strong> ${pi.notes}</p>
            <p>Please find the attached documents related to this Proforma Invoice.</p>
        `,
        attachments: attachments 
    };

        
        await transporter.sendMail(mailOptions);
        await Notification.create({
            userId: notificationRecipientId,
            message: `Payment Request Updated ${piNo} / ${supplierPoNo}`,
            isRead: false,
        });

                // res.json({ p: pi, status: piStatus})
                res.json({
                    piNo: pi.piNo,
                    status: piStatus.status,
                    res: pi,
                    message: 'Proforma Invoice updated successfully'
                });
        
        

    
    } catch (error) {
        res.send(error.message)
    }
});

router.patch('/updateByAM/:id', authenticateToken, async(req, res) => {
    let { url, kamId, accountantId, supplierId, supplierSoNo,supplierPoNo,supplierCurrency, supplierPrice, purpose, customerId, 
        customerPoNo,customerSoNo,customerCurrency, poValue,paymentMode, notes} = req.body;
    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    try {
        let status;
        if(paymentMode === 'CreditCard'){
            if(kamId == null || kamId === undefined || kamId === ''){
                return res.send('Please Select key Account Manager');
            }
            status = 'AM APPROVED';
        } else {
            if(accountantId == null || accountantId === undefined || accountantId === ''){
                return res.send('Please Select Accountant');
            }
            status = 'AM VERIFIED'
        }

        let recipientEmail = null;
        let notificationRecipientId = null;
    
        try {
      
            if (paymentMode === 'CreditCard') {
                const kam = await UserPosition.findOne({ where: { userId: kamId } });
                recipientEmail = kam ? kam.projectMailId : null; 
                notificationRecipientId = kamId;
    
                if (!recipientEmail) {
                    return res.send("KAM project email is missing. Please inform the admin to add it.");
                }
            } else if (paymentMode === 'WireTransfer') {
                const accountant = await UserPosition.findOne({ where: { userId: accountantId } });
                recipientEmail = accountant ? accountant.projectMailId : null; 
                notificationRecipientId = accountantId;
    
                if (!recipientEmail) {
                    return res.send("Accountant project email is missing. Please inform the admin to add it.");
                }
            }
        } catch (error) {
            return res.send(error.message);
        }

        const pi = await PerformaInvoice.findByPk(req.params.id);
        const piNo = pi.piNo;

        kamId = kamId === '' ? null : kamId;
        accountantId = accountantId === '' ? null : accountantId;
        customerId = customerId === '' ? null : customerId;

        pi.url = url;
        pi.kamId = kamId;
        pi.accountantId = accountantId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = status;
        pi.supplierId=supplierId;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierSoNo=supplierSoNo;
        pi.supplierCurrency=supplierCurrency;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerId=customerId;
        pi.customerPoNo=customerPoNo;
        pi.customerSoNo=customerSoNo;
        pi.customerCurrency=customerCurrency;
        pi.poValue=poValue;
        pi.paymentMode=paymentMode;
        pi.notes=notes
        
        await pi.save();

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'AM VERIFIED', date: new Date(), count: count
        })
        await piStatus.save();



    const supplier = await Company.findOne({ where: { id: supplierId } });
    const customer = await Company.findOne({ where: { id: customerId } });

    const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
    const customerName = customer ? customer.companyName : 'Unknown Customer';




    const attachments = [];

    for (const fileObj of url) {
        const actualUrl = fileObj.url || fileObj.file;
        if (!actualUrl) continue;

        const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
        };

        try {
            const s3File = await s3.getObject(params).promise();
            const fileBuffer = s3File.Body;

            attachments.push({
                filename: actualUrl.split('/').pop(),
                content: fileBuffer,
                contentType: s3File.ContentType,
            });
        } catch (error) {
            continue;
        }
    }




    await Notification.create({
        userId: notificationRecipientId,
        message: `Payment Request Updated ${pi.piNo} / ${supplierPoNo}`,
        isRead: false,
    });

    res.json({
        piNo: pi.piNo,
        status: piStatus.status,
        res: pi,
        message: 'Proforma Invoice updated successfully'
    });



} catch (error) {
    res.json({ error: error.message });
}
});

router.patch('/updatePIByAdminSuperAdmin/:id', authenticateToken, async(req, res) => {
    const { url, kamId,accountantId,supplierId, supplierSoNo,supplierPoNo,supplierCurrency, supplierPrice, purpose, 
        customerId, customerPoNo,customerSoNo,customerCurrency, poValue,paymentMode, notes} = req.body;
    if (Array.isArray(purpose)) {
        purpose = purpose.join(', ');
    }
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        pi.url = url;
        pi.kamId = kamId;
        pi.accountantId = accountantId;
        let count = pi.count + 1;
        pi.count = count;
        // pi.status = `AM VERIFIED`;
        pi.supplierId=supplierId;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierSoNo=supplierSoNo;
        pi.supplierCurrency=supplierCurrency;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerId=customerId;
        pi.customerPoNo=customerPoNo;
        pi.customerSoNo=customerSoNo;
        pi.customerCurrency=customerCurrency;
        pi.poValue=poValue;
        pi.paymentMode=paymentMode;
        pi.notes=notes

        await pi.save();

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, date: new Date(), count: count, status:pi.status
        })
        await piStatus.save();

        
        // const acc = await User.findOne({ where: { id: accountantId } });
        // if (!accountantId) {
        //     return res.status(404).send({ message: 'AM user not found.' });
        // }
        // const accountantEmail = acc.email;

        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });


   
          const attachments = [];
  

          for (const fileObj of url) {
              const actualUrl = fileObj.url || fileObj.file;
              if (!actualUrl) continue;
  
              const fileKey = actualUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
  
              const params = {
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: fileKey,
              };
  
              try {
        
                  const s3File = await s3.getObject(params).promise();
                  const fileBuffer = s3File.Body;
  
          
                  attachments.push({
                      filename: actualUrl.split('/').pop(),
                      content: fileBuffer, 
                      contentType: s3File.ContentType 
                  });
              } catch (error) {
                  continue; 
              }
          }

          res.json({
            piNo: pi.piNo,
            res: pi,
            message: 'Proforma Invoice updated successfully'
        });
    } catch (error) {
        res.send(error.message)
    }
});

router.delete('/:id', async(req,res)=>{
    try {

        const result = await PerformaInvoice.destroy({
            where: { id: req.params.id },
            force: true,
        });

        if (result === 0) {
            return res.send('PerformaInvoice with that ID not found')
          }
      
          res.status(204).json();
        }  catch (error) {
        res.send( error.message )
    }
    
})

router.get('/dashboard/cc', authenticateToken, async (req, res) => {
    let status = req.query.status;
    
    let where = { paymentMode: 'CreditCard' };

    if (status && status !== 'undefined') {
        where.status = status;
    }

    let admin = await Role.findOne({ where: {roleName: 'Administrator'}});
    let adminId = admin.id;

    let superadmin = await Role.findOne({ where: {roleName: 'Super Administrator'}});
    let superadminId = superadmin.id;

    if (req.user.roleId !== adminId && req.user.roleId !== superadminId) {
        const userId = req.user.id;
        where[Op.or] = [
            { salesPersonId: userId },
            { kamId: userId },
            { amId: userId },
            { accountantId: userId }
        ];
    }

    let limit, offset;
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    try {
        const pi = await PerformaInvoice.findAll({
            where: where,
            limit,
            offset,
            order: [['id', 'DESC']],
            include: [
                { model: PerformaInvoiceStatus },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] }
            ]
        });
        
        const totalCount = await PerformaInvoice.count({ where: where });

        if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
                count: totalCount,
                items: pi
            };
            res.json(response);
        } else {
            res.send(pi);
        }
    } catch (error) {
        res.send(error.message );
    }
});

router.get('/dashboard/wt', authenticateToken, async (req, res) => {
    let status = req.query.status;
    
    let where = { paymentMode: 'WireTransfer' };

    if (status && status !== 'undefined') {
        where.status = status;
    }

    let admin = await Role.findOne({ where: {roleName: 'Administrator'}});
    let adminId = admin.id;

    let superadmin = await Role.findOne({ where: {roleName: 'Super Administrator'}});
    let superadminId = superadmin.id;

    if (req.user.roleId !== adminId && req.user.roleId !== superadminId) {
        const userId = req.user.id;
        where[Op.or] = [
            { salesPersonId: userId },
            { kamId: userId },
            { amId: userId },
            { accountantId: userId }
        ];
    }

    let limit, offset;
    if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    try {
        const pi = await PerformaInvoice.findAll({
            where: where,
            limit,
            offset,
            order: [['id', 'DESC']],
            include: [
                { model: PerformaInvoiceStatus },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] }
            ]
        });
        
        const totalCount = await PerformaInvoice.count({ where: where });

        if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            const response = {
                count: totalCount,
                items: pi
            };
            res.json(response);
        } else {
            res.send(pi);
        }
    } catch (error) {
        res.send({ error: error.message });
    }
});

router.patch('/getforadminreport', authenticateToken, async (req, res) => {
    let invoices;
    try {
        invoices = await PerformaInvoice.findAll({
            include: [
                { model: Company, as: 'suppliers' }, 
                { model: Company, as: 'customers' }, 
                { model: PerformaInvoiceStatus },
                { model: User, as: 'addedBy', attributes: ['name'] },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] }
            ]
        });
    } catch (error) {
        return res.send(error.message);
    }
    
    let { invoiceNo, addedBy, status, startDate, endDate } = req.body;
    
    if (invoiceNo) {
        const searchTerm = invoiceNo.replace(/\s+/g, '').trim().toLowerCase();
        invoices = invoices.filter(invoice => 
            invoice.piNo.replace(/\s+/g, '').trim().toLowerCase().includes(searchTerm)
        );
    }

    // if (createdAt) {
    //     invoices = invoices.filter(invoice => invoice.createdAt === createdAt);
    // }
    
    if (addedBy) {
        invoices = invoices.filter(invoice => invoice.addedById === addedBy);
    }

    if (status) {
        if (status === 'GENERATED') {
            invoices = invoices.filter(invoice => 
                invoice.status === 'GENERATED' || invoice.status === 'INITIATED'
            );
        }else if (status === 'AM VERIFIED') {
            invoices = invoices.filter(invoice => 
                invoice.status === 'AM VERIFIED' || invoice.status === 'AM APPROVED'
            );
        }else if (status === 'BANK SLIP ISSUED') {
            invoices = invoices.filter(invoice => 
                invoice.status === 'BANK SLIP ISSUED' || invoice.status === 'CARD PAYMENT SUCCESS'
            );
        }  else {
            invoices = invoices.filter(invoice => invoice.status === status);
        }
    }

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        invoices = invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate >= start && invoiceDate <= end;
        });
    }
    
    res.send(invoices);
});


router.get('/findcount', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    let roleName;
    
    try {
        let user = await User.findByPk(userId);
        let role = await Role.findByPk(user.roleId);
        roleName = role.roleName;
        const statuses = [
            'GENERATED',
            'INITIATED',
            'KAM VERIFIED',
            'AM VERIFIED',
            'AM APPROVED',
            'KAM REJECTED',
            'AM REJECTED',
            'AM DECLINED',
            'BANK SLIP ISSUED',
            'CARD PAYMENT SUCCESS',
        ];

        const counts = {};
        statuses.forEach(status => {
            counts[status] = 0;
        });

        let whereCondition = { status: { [Op.or]: statuses } };

        if (roleName === 'Sales Executive' || roleName === 'Team Lead') {
            whereCondition.salesPersonId = userId;
        } else if (roleName === 'Key Account Manager') {
            whereCondition.kamId = userId;
        } else if (roleName === 'Manager') {
            whereCondition.amId = userId;
        } else if (roleName === 'Accountant') {
            whereCondition.accountantId = userId;
        } else {
            whereCondition = {};
        }

        const invoiceCounts = await PerformaInvoice.findAll({
            where: whereCondition,
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
            group: ['status']
        });
        
        invoiceCounts.forEach(invoice => {
            counts[invoice.status] = invoice.get('count');
        });

        const formattedCounts = {};
        for (const [key, value] of Object.entries(counts)) {
            const formattedKey = key.replace(/ /g, '_'); 
            formattedCounts[formattedKey] = value;
        }

        res.json({
            counts: formattedCounts
        });
    } catch (error) {
        res.send(error.message);
    }
});




module.exports = router;