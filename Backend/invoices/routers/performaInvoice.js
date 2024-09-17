const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoice = require('../models/performaInvoice');
const TeamMember = require('../../users/models/teamMember');
const Team = require('../../users/models/team');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const User = require('../../users/models/user');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');
const s3 = require('../../utils/s3bucket');

router.post('/save', authenticateToken, async (req, res) => {
    const { piNo, url, kamId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue } = req.body;
    const userId = req.user.id;

    try {
        // Save the new PI
        const newPi = new PerformaInvoice({
            piNo, url, status: 'GENERATED', salesPersonId: userId, kamId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue
        });
        await newPi.save();

        // Save the PI status
        const piId = newPi.id;
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'GENERATED', date: new Date()
        });
        await piStatus.save();

     
        res.json({ p: newPi, status: piStatus});

    } catch (error) {
        res.send(error.message);
    }
});

router.post('/saveByKAM', authenticateToken, async (req, res) => {
    const { piNo, url, amId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue } = req.body;
    const userId = req.user.id;

    try {
        // Save the new PI
        const newPi = new PerformaInvoice({
            piNo, url,amId, status: 'KAM VERIFIED', kamId: userId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue
        });
        await newPi.save();

        // Save the PI status
        const piId = newPi.id;
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'KAM VERIFIED', date: new Date()
        });
        await piStatus.save();

        res.json({ p: newPi, status: piStatus });

    } catch (error) {
        res.send(error.message);
    }
});

router.post('/saveByAM', authenticateToken, async (req, res) => {
    const { piNo, url, accountantId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue } = req.body;
    const userId = req.user.id;

    try {
        // Save the new PI
        const newPi = new PerformaInvoice({
            piNo, url,accountantId, status: 'AM VERIFIED', amId: userId, supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue
        });
        await newPi.save();

        // Save the PI status
        const piId = newPi.id;
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'AM VERIFIED', date: new Date()
        });
        await piStatus.save();

        res.json({ p: newPi, status: piStatus });

    } catch (error) {
        res.send(error.message);
    }
});

router.get('/find', authenticateToken, async(req, res) => {

    let status = req.query.status;
    console.log(req.query, "_______________________");
    
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
            include: [
                {model: PerformaInvoiceStatus},
                {model: User, as: 'salesPerson', attributes: ['name']},
                {model: User, as: 'kam', attributes: ['name']},
                {model: User, as: 'am', attributes: ['name']}
            ]
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
        // Create S3 upload parameters
    
        const pi = await PerformaInvoice.findByPk(req.params.id, {include: [
            PerformaInvoiceStatus,
            {model: User, as: 'salesPerson', attributes: ['name']},
            {model: User, as: 'kam', attributes: ['name']},
            // {model: User, as: 'am', attributes: ['name']},
            // {model: User, as: 'accountant', attributes: ['name']},
        ]})

        let signedUrl = '';
        if (pi.url) {
            const fileUrl = pi.url;
            const key = fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');
            
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key, 
                Expires: 60,
              };
          
              signedUrl = s3.getSignedUrl('getObject', params);
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
    if (req.query.pageSize && req.query.page) {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
    }

    try {
        // Fetch the SalesPerson's team
        const teamMember = await TeamMember.findOne({ where: { userId } });

        // If no team is found, respond with an empty list or appropriate message
        if (!teamMember) {
            return res.json({ count: 0, items: [] });
        }

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

        const pi = await PerformaInvoice.findAll({
            where: where, limit, offset,
            order: [['id', 'DESC']],
            include: [
                { model: PerformaInvoiceStatus },
                { model: User, as: 'salesPerson', attributes: ['name'] },
                { model: User, as: 'kam', attributes: ['name'] },
                { model: User, as: 'am', attributes: ['name'] },
                { model: User, as: 'accountant', attributes: ['name'] }
            ]
        });

        const totalCount = await PerformaInvoice.count({ where: where });

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



// router.get('/findbysp', authenticateToken, async(req, res) => {
//     let status = req.query.status;
//     let user = req.user.id;
    
//     let where = { salesPersonId: user };

//     if (status !== '' && status !== 'undefined' && status !== 'REJECTED') {
//         where.status = status;
//     } else if (status === 'REJECTED') {
//         where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
//     }
    
//     if (req.query.search !== '' && req.query.search !== 'undefined') {
//         const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
//         where[Op.or] = [
//             ...(where[Op.or] || []),
//             sequelize.where(
//                 sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('piNo'), ' ', '')),
//                 {
//                     [Op.like]: `%${searchTerm}%`
//                 }
//             )
//         ];
//     }  

//     let limit; 
//     let offset; 
//     if (req.query.pageSize && req.query.page ) {
//         limit = req.query.pageSize;
//         offset = (req.query.page - 1) * req.query.pageSize;
//       }
//     try {
//         const pi = await PerformaInvoice.findAll({
//             where: where, limit, offset,
//             order: [['id', 'DESC']],
//             include: [
//                 {model: PerformaInvoiceStatus},
//                 {model: User, as: 'salesPerson', attributes: ['name']},
//                 {model: User, as: 'kam', attributes: ['name']},
//                 {model: User, as: 'am', attributes: ['name']},
//                 {model: User, as: 'accountant', attributes: ['name']},

//             ]
//         })

//         let totalCount;
//         totalCount = await PerformaInvoice.count({
//           where: where
//         });
        
//         if (req.query.page && req.query.pageSize != 'undefined') {
//             const response = {
//               count: totalCount,
//               items: pi,
//             };
//             res.json(response);
//           } else {
//             res.send(pi);
//           }
//     } catch (error) {
//         res.send(error.message)
//     }
// })

router.get('/findbkam', authenticateToken, async(req, res) => {
    let status = req.query.status;
    let user = req.user.id;
    console.log(req.query);
    
    let where = { kamId: user };

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

            ]
        })
        console.log(pi);
        
        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize != 'undefined') {
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
    if (req.query.pageSize && req.query.page ) {
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

            ]
        })

        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize != 'undefined') {
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
    if (req.query.pageSize && req.query.page ) {
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

            ]
        })

        let totalCount;
        totalCount = await PerformaInvoice.count({
          where: where
        });
        
        if (req.query.page && req.query.pageSize != 'undefined') {
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
    let user = req.user.id;
    let userRole = req.user.role; // Assuming role is part of the user object

    // Default where condition
    let where = {};

    // If the user is not an Administrator, apply the accountantId filter
    if (userRole == 'Administrator') {
        where.accountantId = user;

        if (status !== '' && status !== 'undefined' && status !== 'REJECTED') {
            where.status = status;
        } else if (status === 'REJECTED') {
            where.status = { [Op.or]: ['KAM REJECTED', 'AM REJECTED'] };
        }
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
    if (req.query.pageSize && req.query.page) {
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

router.patch('/bankslip/:id', authenticateToken, async(req, res) => {
    const { bankSlip} = req.body;
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id)
        pi.bankSlip = bankSlip;
        pi.status = 'BANK SLIP ISSUED';
        await pi.save();

        const piId = pi.id;
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'BANK SLIP ISSUED', date: new Date()
        })
        await piStatus.save();
        res.json({ p: pi, status: piStatus})
    } catch (error) {
        res.send(error.message)
    }
});

router.patch('/updateBySE/:id', authenticateToken, async(req, res) => {
    const { piNo, url, kamId,supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue} = req.body;
    const userId = req.user.id;
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        pi.url = url;
        pi.kamId = kamId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = `GENERATED`;
        pi.supplierName=supplierName;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerName=customerName;
        pi.customerPoNo=customerPoNo;
        pi.poValue=poValue;

        await pi.save();

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'GENERATED', date: new Date(), count: count
        })
        await piStatus.save();
        res.json({ p: pi, status: piStatus})
    } catch (error) {
        res.send(error.message)
    }
});

router.patch('/updateByKAM/:id', authenticateToken, async(req, res) => {
    const { piNo, url, kamId,supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue} = req.body;
    const userId = req.user.id;
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        pi.url = url;
        pi.kamId = kamId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = `KAM VERIFIED`;
        pi.supplierName=supplierName;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerName=customerName;
        pi.customerPoNo=customerPoNo;
        pi.poValue=poValue;

        await pi.save();

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'KAM VERIFIED', date: new Date(), count: count
        })
        await piStatus.save();
        res.json({ p: pi, status: piStatus})
    } catch (error) {
        res.send(error.message)
    }
});

router.patch('/updateByAM/:id', authenticateToken, async(req, res) => {
    const { piNo, url, kamId,supplierName, supplierPoNo, supplierPrice, purpose, customerName, customerPoNo, poValue} = req.body;
    const userId = req.user.id;
    try {
        const pi = await PerformaInvoice.findByPk(req.params.id);
        pi.url = url;
        pi.kamId = kamId;
        let count = pi.count + 1;
        pi.count = count;
        pi.status = `AM VERIFIED`;
        pi.supplierName=supplierName;
        pi.supplierPoNo=supplierPoNo;
        pi.supplierPrice=supplierPrice;
        pi.purpose=purpose;
        pi.customerName=customerName;
        pi.customerPoNo=customerPoNo;
        pi.poValue=poValue;

        await pi.save();

        const piId = pi.id;
        
        const piStatus = new PerformaInvoiceStatus({
            performaInvoiceId: piId, status: 'AM VERIFIED', date: new Date(), count: count
        })
        await piStatus.save();
        res.json({ p: pi, status: piStatus})
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

module.exports = router;