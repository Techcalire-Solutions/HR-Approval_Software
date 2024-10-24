const express = require("express");
const router = express.Router();
const Expense = require('../models/expense');
const authenticateToken = require("../../middleware/authorization");

router.post('/save', authenticateToken, async(req, res) => {
    try {
        const { exNo, url, bankSlip, status, userId, kamId, amId, accountantId, count, notes, expenseType } = req.body;
        const expense = await Expense.create({ exNo, url, bankSlip, status, userId, kamId, amId, accountantId, count, notes, 
            expenseType });
        res.json(expense);
    } catch (error) {
        res.json({ error: error.message });
    }
})

router.get('/find', authenticateToken, async(req, res) => {
    try {
        const expense = await Expense.find({})
        res.send(expense);
    } catch (error) {
        res.send(error.message)
    }
})

module.exports = router;