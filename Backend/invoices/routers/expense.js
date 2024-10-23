const express = require("express");
const router = express.Router();
const authenticateToke = require('../../middleware/authorization');
const Expense = require('../models/expense');

router.post('/save', authenticateToke, async(req, res) => {
    try {
        const { exNo, url, bankSlip, status, userId, kamId, amId, accountantId, count, notes, expenseType } = req.body;
        const expense = await Expense.create({ exNo, url, bankSlip, status, userId, kamId, amId, accountantId, count, notes, 
            expenseType });
        res.json(expense);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

module.exports = router;