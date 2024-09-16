
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization')
const sequelize = require('../../utils/db')
const { Op, fn, col, where } = require('sequelize');
const Leave = require('../models/leave')


router.post('/', authenticateToken,async(req,res)=>{
    try {
        const {
          
            leaveTypeId,
            startDate,
            endDate,
            noOfDays,
            notes,
            status
        } = req.body;
        const userId = req.user.id; // added by Amina 
        const leave = new Leave({
            userId,
            leaveTypeId,
            startDate,
            endDate,
            noOfDays,
            notes,
            status

        });
        await leave.save();
        res.send(leave)

        
    } catch (error) {
        res.send(error.message)
        
    }
})


router.get('/',authenticateToken, async(req,res)=>{
    try {
        const leave = await Leave.findAll({})
        res.send(leave)
        
    } catch (error) {
        res.send(error.message)
        
    }

})



module.exports = router;