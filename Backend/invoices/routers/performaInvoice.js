const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoice = require('../models/performaInvoice');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const User = require('../../users/models/user');
const { Op, where } = require('sequelize');
const sequelize = require('../../utils/db');
const s3 = require('../../utils/s3bucket');
const Role = require('../../users/models/role');
const nodemailer = require('nodemailer');
const TeamMember = require('../../users/models/teamMember');
const Team = require('../../users/models/team');
const Company = require('../models/company');
const Supplier = require('../../invoices/routers/company');
const Expense = require('../../expense/models/expense')
const ExpenseStatus  = require('../../expense/models/expenseStatus')
const Notification = require('../../invoices/models/notification')
const UserPosition = require('../../users/models/userPosition')



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

router.post('/save', authenticateToken, async (req, res) => {
    let { piNo, url, kamId, amId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, customerId,
        customerPoNo, customerSoNo, customerCurrency, poValue, notes, paymentMode } = req.body;

    const userId = req.user.id;
    let status;

    kamId = kamId === '' ? null : kamId;
    amId = amId === '' ? null : amId;
    customerId = customerId === '' ? null : customerId;
    

    if(paymentMode === 'CreditCard'){
        if(amId == null){
            return res.send('Please Select Manager');
        }
        status = 'INITIATED'
    } else {
        if(kamId == null){
            return res.send('Please Select Key Account Manager');
        }
        status = 'GENERATED'
    }
    
    const kam = paymentMode === 'WireTransfer' ? await UserPosition.findOne({ where: { userId: kamId } }) : null;
    const am = paymentMode === 'CreditCard' ? await UserPosition.findOne({ where: { userId: amId } }) : null;

    const kamEmail = kam ? kam.projectMailId : null; 
    const amEmail = am ? am.projectMailId : null;  

    if (paymentMode === 'WireTransfer' && !kamEmail) {
        return res.send('Please set KAM project email ID');
    }
    console.log('amidamid',amEmail);

    if (paymentMode === 'CreditCard' && !amEmail) {
        return res.send('Please set AM project email ID');
    }
    try {
        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo } });
        if (existingInvoice) {
            return res.json({ error: 'Invoice is already saved' });
        }


        const kam = paymentMode === 'WireTransfer' ? await UserPosition.findOne({userId: kamId }) : null;
        const am = paymentMode === 'CreditCard' ? await UserPosition.findOne({userId: amId }) : null;

        const kamEmail = kam ? kam.projectMailId : null; 
        const amEmail = am ? am.aprojectMailId : null;  
        
        if (paymentMode === 'WireTransfer' && !kamEmail) {
            return res.send("KAM Project mail not found")

        }

        if (paymentMode === 'CreditCard' && !amEmail) {
            return res.send("AM Project mail not found")
     
        }


        const newPi = await PerformaInvoice.create({
            piNo, url, status: status, salesPersonId: userId, kamId, supplierId,
            amId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
            customerId, customerPoNo, customerSoNo, customerCurrency, poValue, addedById: userId,
            notes, paymentMode
        });
        
        const piId = newPi.id;
        const piStatus = await PerformaInvoiceStatus.create({
            performaInvoiceId: piId,
            status: status,
            date: new Date(),
        });

        const attachments = []

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

  

     
      
        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });

         const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
          const customerName = customer ? customer.companyName : 'Unknown Customer';

        let mailOptions;

        if (paymentMode === 'CreditCard') {
     
            mailOptions = {
                from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
                to: amEmail,
                cc: process.env.FINANCE_EMAIL_USER,
                subject: `New Payment Request Generated  ${piNo} /  ${supplierPoNo}`,
                html: `
                    <p>A new payment request generated by <strong>${req.user.name}</strong></p>
                    <p><strong>Entry Number:</strong> ${piNo}</p>
                    <p><strong>Supplier Name:</strong> ${supplierName}</p>
                    <p><strong>Supplier PO No:</strong> ${supplierPoNo}</p>
                    <p><strong>Supplier SO No:</strong> ${supplierSoNo}</p>
                    <p><strong>Status:</strong> ${newPi.status}</p>
                    <p><strong>Payment Mode:</strong> ${paymentMode}</p>
                    ${purpose === 'Stock' 
                        ? `<p><strong>Purpose:</strong> Stock</p>` 
                        : `<p><strong>Purpose:</strong> Customer</p>
                           <p><strong>Customer Name:</strong> ${customerName}</p>
                           <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                           <p><strong>Customer SO No:</strong> ${customerSoNo}</p>`
                    }
                    <p><strong>Notes:</strong> ${newPi.notes}</p>
                    <p>Please find the attached documents related to this Proforma Invoice.</p>
                `,
                attachments: attachments
            };

            await transporter.sendMail(mailOptions);
        } else if (paymentMode === 'WireTransfer') {

            mailOptions = {
                from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
                to: kamEmail,
                cc: process.env.FINANCE_EMAIL_USER,
                subject: `New Payment Request Generated  ${piNo} /  ${supplierPoNo}`,
                html: `
                    <p>A new payment request generated <strong>${req.user.name}</strong></p>
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
                    <p><strong>Notes:</strong> ${newPi.notes}</p>
                    <p>Please find the attached documents related to this Proforma Invoice.</p>
                `,
                attachments: attachments
            };

            await transporter.sendMail(mailOptions);
        }

        res.json({
            piNo: newPi.piNo,
            status: newPi.status,
            message: 'Proforma Invoice saved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
router.post('/saveByKAM', authenticateToken, async (req, res) => {
    const { piNo, url, amId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
        customerId, customerPoNo, customerSoNo, customerCurrency, poValue,  notes,  paymentMode } = req.body;

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

    try {
 
        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo: piNo } });
        if (existingInvoice) {
            return res.status(400).json({ error: 'Invoice is already saved' });
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


   const am = await UserPosition.findOne({ where: { id: amId } });
   const amEmail = am ? am.projectMailId : null;

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
       from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
       to: amEmail,
       cc: process.env.FINANCE_EMAIL_USER,
       subject: `New Payment request  Generated - ${piNo} / ${supplierPoNo}`,
       html: `
           <p>New Payment request  Generated by <strong>${req.user.name}</strong></p>
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
           <p><strong>Notes:</strong> ${newPi.notes}</p>
           <p>Please find the attached documents related to this Proforma Invoice.</p>
       `,
       attachments,
   };


   if (amEmail) {
       await transporter.sendMail(mailOptions);
   } else {
       console.log('No AM email found');
   }


 

        res.json({
            piNo: newPi.piNo,          
            status: piStatus.status,   
            res: newPi,
            message: 'Proforma Invoice saved successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/saveByAM', authenticateToken, async (req, res) => {
    let { piNo, url, accountantId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose,
        customerId, customerPoNo, customerSoNo, customerCurrency, poValue, notes, paymentMode, kamId } = req.body;

    const userId = req.user.id;
    kamId = kamId === '' ? null : kamId;
    accountantId = accountantId === '' ? null : accountantId;
    customerId = customerId === '' ? null : customerId;

    let status;
    let recipientEmail; 

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

    try {
        const existingInvoice = await PerformaInvoice.findOne({ where: { piNo: piNo } });
        if (existingInvoice) {
            return res.status(400).json({ error: 'Invoice is already saved' });
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

        if (paymentMode === 'CreditCard') {
            const kam = await UserPosition.findOne({ where: { id: kamId } });
            if (!kam) {
                return res.status(404).json({ error: 'Key Account Manager not found' });
            }
            recipientEmail = kam.projectMailId; 
        } else {
            const accountant = await UserPosition.findOne({ where: { id: accountantId } });
            if (!accountant) {
                return res.status(404).json({ error: 'Accountant not found' });
            }
            recipientEmail = accountant.projectMailId; 
        }

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
            from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
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

        res.json({
            piNo: newPi.piNo,
            status: status, // Use the status variable
            message: 'Proforma Invoice saved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        
            // Fetch the SalesPerson's team
            const teamMember = await TeamMember.findOne({ where: { userId } });
    


            if(teamMember){
                const teamId = teamMember.teamId;
    
                // Get the team lead's userId
                const team = await Team.findOne({ where: { id: teamId } });
                const teamLeadId = team.userId;
        
                // Get all user IDs in the team
                const teamMembers = await TeamMember.findAll({ where: { teamId } });
                const teamUserIds = teamMembers.map(member => member.userId);
        
                // Include the team lead's userId in the list of allowed user IDs
                teamUserIds.push(teamLeadId);
        
                // Update where clause to include all team user IDs
                where.salesPersonId = teamUserIds;
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
        res.status(500).send(error.message);
    }
});


router.patch('/bankslip/:id', authenticateToken, async (req, res) => {
    const { bankSlip, status } = req.body;
    
    try {
        let newStat;
        let statusArray;
        let pi;
        let recipientEmails = [];
      
        if (status === 'AM APPROVED') {
            newStat = 'CARD PAYMENT SUCCESS';
            pi = await PerformaInvoice.findByPk(req.params.id);
            const performaInvoiceId = req.params.id;
            if (!pi) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
            statusArray = new PerformaInvoiceStatus({ performaInvoiceId, status, date: new Date() });
            await statusArray.save();

     
            const users = await User.findAll({
                where: {
                    [Op.or]: [
                        { id: pi.salesPersonId },
                        { id: pi.kamId },
                        { id: pi.amId },
                        { id: pi.accountantId },
                        { id: pi.addedById }
                    ]
                }
            });
     
        const fileKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
        };

        const s3File = await s3.getObject(params).promise();
        const fileBuffer = s3File.Body;

            recipientEmails = users
                .filter(user => user.id !== pi.accountantId)
                .map(user => user.email);
        


            const emailSubject = `Card Payment Success for Invoice - ${pi.piNo}`
            const emailBody = `
                <p>Card payment has been successfully processed for proforma invoice ID: <strong>${pi.piNo}</strong>.</p>
                <br>
                <p>Please review the details at your earliest convenience.</p>
                <br>
                <p>Thank you!</p>
            `;

       
            const mailOptions = {
                from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
                to: recipientEmails.length > 0 ? recipientEmails.join(',') : process.env.DEFAULT_EMAIL,
                cc: process.env.FINANCE_EMAIL_USER,
                subject: emailSubject,
                html: emailBody,
                attachments: [
                    {
                        filename: bankSlip.split('/').pop(),
                        content: fileBuffer,
                        contentType: s3File.ContentType
                    }
                ]
            };


            if (recipientEmails.length > 0) {
                await transporter.sendMail(mailOptions);
                console.log('Card Payment Success email sent successfully.');
            } else {
                console.error('No recipients defined for Card Payment Success. Email not sent.');
            }

        } else if (status === 'AM VERIFIED') {
            newStat = 'BANK SLIP ISSUED';
            pi = await PerformaInvoice.findByPk(req.params.id);
            const performaInvoiceId = req.params.id;
            if (!pi) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
            statusArray = new PerformaInvoiceStatus({ performaInvoiceId, status, date: new Date() });
            await statusArray.save();

            const users = await User.findAll({
                where: {
                    [Op.or]: [
                        { id: pi.salesPersonId },
                        { id: pi.kamId },
                        { id: pi.amId },
                        { id: pi.accountantId },
                        { id: pi.addedById }
                    ]
                }
            });

            const fileKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
            };
    
            const s3File = await s3.getObject(params).promise();
            const fileBuffer = s3File.Body;
      
            recipientEmails = users
                .filter(user => user.id !== pi.accountantId)
                .map(user => user.email);


            const emailSubject = `Payslip Issued for Invoice - ${pi.piNo}`;
            const emailBody = `
                <p>A bank slip has been issued for proforma invoice ID: <strong>${pi.piNo}</strong>.</p>
                <br>
                <p>Please review the bank slip at your earliest convenience.</p>
                <br>
                <p>Thank you!</p>
            `;

            const mailOptions = {
                from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
                to: recipientEmails.length > 0 ? recipientEmails.join(',') : process.env.DEFAULT_EMAIL,
                cc: process.env.FINANCE_EMAIL_USER,
                subject: emailSubject,
                html: emailBody,
                attachments: [
                    {
                        filename: bankSlip.split('/').pop(),
                        content: fileBuffer,
                        contentType: s3File.ContentType
                    }
                ]
            };


            if (recipientEmails.length > 0) {
                await transporter.sendMail(mailOptions);
                console.log('Bank Slip Issued email sent successfully.');
            } else {
                console.error('No recipients defined for Bank Slip Issued. Email not sent.');
            }

        } else if (status === 'AM Verified') {
            newStat = 'PaymentCompleted';


            pi = await Expense.findByPk(req.params.id);
            if (!pi) {
                return res.status(404).json({ message: 'Expense not found' });
            }
            const fileKey = bankSlip.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
            };
    
            const s3File = await s3.getObject(params).promise();
            const fileBuffer = s3File.Body;
            const addedByUser = await User.findByPk(pi.userId);
            if (addedByUser) {
                recipientEmails.push(addedByUser.email);
            }
            const emailSubject = `Payment Completed for Invoice - ${pi.exNo}`;
            const emailBody = `
                <p>Payment has been successfully processed for proforma invoice ID: <strong>${pi.exNo}</strong>.</p>
                <br>
                <p>Please review the details at your earliest convenience.</p>
                <br>
                <p>Thank you!</p>
            `;
            const mailOptions = {
                from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
                to: recipientEmails.length > 0 ? recipientEmails.join(',') : process.env.DEFAULT_EMAIL,
                subject: emailSubject,
                html: emailBody,
                attachments: [
                    {
                        filename: bankSlip.split('/').pop(),
                        content: fileBuffer,
                        contentType: s3File.ContentType
                    }
                ]
            };

     
            if (recipientEmails.length > 0) {
                await transporter.sendMail(mailOptions);
                console.log('Payment Completed email sent successfully.');
            } else {
                console.error('No recipients defined for Payment Completed. Email not sent.');
            }
        }

     
        pi.bankSlip = bankSlip;
        pi.status = newStat;
        await pi.save();
      
        res.json({ p: pi, status: status });
    } catch (error) {
        console.error(error); 
        res.status(500).send({ message: error.message }); 
    }
});

router.patch('/updateBySE/:id', authenticateToken, async (req, res) => {
    let { url, kamId, supplierId, supplierSoNo, supplierPoNo, supplierCurrency, supplierPrice, purpose, 
        customerId, customerSoNo, customerPoNo, customerCurrency, poValue, notes, paymentMode, amId } = req.body;

    kamId = kamId === '' ? null : kamId;
    amId = amId === '' ? null : amId;
    customerId = customerId === '' ? null : customerId;

    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        if (!pi) {
            return res.status(404).send({ message: 'Proforma Invoice not found.' });
        }
        let status;
        let recipient;
        if(paymentMode === 'CreditCard'){
            if(amId == null){
                return res.send('Please Select Manager');
            }
            status = 'INITIATED'
            recipient = amId;
        } else {
            if(kamId == null){
                return res.send('Please Select Key Account Manager');
            }
            status = 'GENERATED'
            recipient=kamId
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
            performaInvoiceId: piId, status: status, date: new Date(), count: count
        })
        await piStatus.save();

        res.json({
            piNo: pi.piNo,
            status: piStatus.status,
            res: pi,
            message: 'Proforma Invoice updated successfully'
        });


        
        const supplier = await Company.findOne({ where: { id: supplierId } });
        const customer = await Company.findOne({ where: { id: customerId } });

         const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
          const customerName = customer ? customer.companyName : 'Unknown Customer';

          
         const recipientUser = await User.findOne({ where: { id: recipient } });
         const recipientEmail = recipientUser ? recipientUser.email : null;

    
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
            from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
            to: recipientEmail, 
            subject: `Proforma Invoice Updated - ${pi.piNo}`,
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


    } catch (error) {
        res.send(error.message);
    }
});

router.patch('/updateByKAM/:id', authenticateToken, async(req, res) => {
    let { url, kamId, amId, supplierId,supplierSoNo, supplierPoNo,supplierCurrency, supplierPrice, purpose, customerId,customerSoNo, customerPoNo,customerCurrency, poValue, notes, paymentMode} = req.body;
    
    let status;
    if(paymentMode === 'CreditCard'){
        status = 'INITIATED'
    } else {
        status = 'KAM VERIFIED'
    }
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
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

        // res.json({ p: pi, status: piStatus})
        res.json({
            piNo: pi.piNo,
            status: piStatus.status,
            res: pi,
            message: 'Proforma Invoice updated successfully'
        });


        const am = await User.findOne({ where: { id: amId } });
        if (!amId) {
            return res.status(404).send({ message: 'AM user not found.' });
        }
        const amEmail = am.email;

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
            from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
        to: amEmail, 
            subject: `Proforma Invoice Updated - ${pi.piNo}`,
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

    
    } catch (error) {
        res.send(error.message)
    }
});

router.patch('/updateByAM/:id', authenticateToken, async(req, res) => {
    let { url, kamId, accountantId, supplierId, supplierSoNo,supplierPoNo,supplierCurrency, supplierPrice, purpose, customerId, 
        customerPoNo,customerSoNo,customerCurrency, poValue,paymentMode, notes} = req.body;
        
    try {
        let status;
        let recipient;
        if(paymentMode === 'CreditCard'){
            if(kamId == null){
                return res.send('Please Select key Account Manager');
            
            }
            status = 'AM APPROVED';
            recipient = kamId; 
        } else {
            if(accountantId == null){
                return res.send('Please Select Accountant');
            }
            status = 'AM VERIFIED'
            recipient = accountantId;
        }
        const pi = await PerformaInvoice.findByPk(req.params.id);

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

    res.json({
        piNo: pi.piNo,
        status: piStatus.status,
        res: pi,
        message: 'Proforma Invoice updated successfully'
    });


    const supplier = await Company.findOne({ where: { id: supplierId } });
    const customer = await Company.findOne({ where: { id: customerId } });

    const supplierName = supplier ? supplier.companyName : 'Unknown Supplier';
    const customerName = customer ? customer.companyName : 'Unknown Customer';


    const recipientUser = await User.findOne({ where: { id: recipient } });
    const recipientEmail = recipientUser ? recipientUser.email : null;

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
    const piNo = pi.piNo;


    const mailOptions = {
        from: `Proforma Invoice <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `New Proforma Invoice Updated - ${piNo}`,
        html: `
            <p>A new Proforma Invoice has been updated  by <strong>${req.user.name}</strong></p>
            <p><strong>Entry Number:</strong> ${piNo}</p>
            <p><strong>Supplier Name:</strong> ${supplierName}</p>
            <p><strong>Supplier PO No:</strong> ${supplierPoNo}</p>
            <p><strong>Supplier SO No:</strong> ${supplierSoNo}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${purpose === 'Stock'
                ? `<p><strong>Purpose:</strong> Stock</p>`
                : `<p><strong>Purpose:</strong> Customer</p>
                   <p><strong>Customer Name:</strong> ${customerName}</p>
                   <p><strong>Customer PO No:</strong> ${customerPoNo}</p>
                   <p><strong>Customer SO No:</strong> ${customerSoNo}</p>`
            }
            <p><strong>Notes:</strong> ${pi.notes}</p>
            <p>Please find the attached documents related to this Proforma Invoice.</p>
        `,
        attachments,
    };


    if (recipientEmail) {
        await transporter.sendMail(mailOptions);
    } else {
        console.log('No recipient email found');
    }

} catch (error) {
    res.json({ error: error.message });
}
});

router.patch('/updatePIByAdminSuperAdmin/:id', authenticateToken, async(req, res) => {
    const { url, kamId,accountantId,supplierId, supplierSoNo,supplierPoNo,supplierCurrency, supplierPrice, purpose, customerId, customerPoNo,customerSoNo,customerCurrency, poValue,paymentMode, notes} = req.body;
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
            performaInvoiceId: piId, date: new Date(), count: count
        })
        await piStatus.save();

        
        // const acc = await User.findOne({ where: { id: accountantId } });
        // if (!accountantId) {
        //     return res.status(404).send({ message: 'AM user not found.' });
        // }
        // const accountantEmail = acc.email;

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
            return res.status(404).json({
              status: "fail",
              message: "PerformaInvoice with that ID not found",
            });
          }
      
          res.status(204).json();
        }  catch (error) {
        res.send({error: error.message})
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
        res.status(500).send({ error: error.message });
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
        res.status(500).send({ error: error.message });
    }
});

router.patch('/getforadminreport', authenticateToken, async (req, res) => {
    let invoices;
    try {
        invoices = await PerformaInvoice.findAll({
            include: [
                { model: PerformaInvoiceStatus },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] }
            ]
        })
    } catch (error) {
        res.send(error.message)
    }
    
    let invoiceNo = req.body.invoiceNo;
    let createdAt = req.body.createdAt;
    let addedBy = req.body.addedBy;
    let status = req.body.status;
    let date = req.body.date;
    
    if (invoiceNo) {
        const searchTerm = invoiceNo.replace(/\s+/g, '').trim().toLowerCase();
        
        invoices = invoices.filter(invoice => 
            invoice.piNo.replace(/\s+/g, '').trim().toLowerCase().includes(searchTerm)
        );
    }

    if (createdAt) {
        invoices = invoices.filter(invoice => invoice.createdAt === createdAt);
    }
    
    if (addedBy) {
        invoices = invoices.filter(invoice => invoice.addedById === addedBy);
    }

    if (status) {
        invoices = invoices.filter(invoice => invoice.status === status);
    }

    if (date) {
        invoices = invoices.filter(invoice => {
            // Convert both dates to local date strings (ignoring time and time zones)
            const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN'); // 'en-CA' returns YYYY-MM-DD format
            const filterDate = new Date(date).toLocaleDateString('en-IN');
            
            return invoiceDate === filterDate;
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
        console.log(invoiceCounts,"invoiceCountsinvoiceCountsinvoiceCountsinvoiceCountsinvoiceCountsinvoiceCounts");
        
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
        res.status(500).json({ error: 'An error occurred while fetching the invoice counts.' });
    }
});




module.exports = router;