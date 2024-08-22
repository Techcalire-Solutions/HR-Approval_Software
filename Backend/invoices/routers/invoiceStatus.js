const express = require('express');
const router = express.Router();
const {Op, fn, col, where} = require('sequelize');
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoiceStatus = require('../models/invoiceStatus');
const PerformaInvoice = require('../models/performaInvoice');

router.post('/updatestatus', authenticateToken, async (req, res) => {
    const { performaInvoiceId,  remarks, amId, accountantId} = req.body;
    console.log(req.body);
    
    try {
        const status = new PerformaInvoiceStatus({ performaInvoiceId, status: req.body.status, date: Date.now(), remarks });
        await status.save();

        let pi = await PerformaInvoice.findByPk(performaInvoiceId)
        pi.status = req.body.status;
        if (amId != null) pi.amId = amId;
        if (accountantId != null) pi.accountantId = accountantId
        await pi.save();

    
        res.json({pi, status});
    } catch (error) {
        res.send(error.message)
    }
})

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

router.get('/findbypi/:id', authenticateToken, async (req, res) => {
    try {
        const piStatus = await PerformaInvoiceStatus.findAll({
            where: {performaInvoiceId: req.params.id}
        })
        res.send(piStatus);
    } catch (error) {
        res.send(error.message)
    }
})
module.exports = router