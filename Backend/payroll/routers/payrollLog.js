/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
const PayrollLog = require("../models/payrollLog");

router.get('/getbyuser/:id', async (req, res) => {
    try {
        const PL = await PayrollLog.findAll({ where: { userId: req.params.id } });
        res.send(PL);
    } catch (error) {
        res.send(error.message);
    }
});

module.exports = router;