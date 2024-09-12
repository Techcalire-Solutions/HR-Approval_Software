
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization')
const sequelize = require('../../utils/db')
const { Op, fn, col, where } = require('sequelize');
const LeaveType = require('../models/leaveType')


router.post('/', authenticateToken,async(req,res)=>{
    try {
        const {
            leaveTypeName
        } = req.body;

        const leaveType = new LeaveType({
            leaveTypeName

        });
        await leaveType.save();
        res.send(leaveType)

        
    } catch (error) {
        res.send(error.message)
        
    }
})


router.get('/',authenticateToken, async(req,res)=>{
    try {
        const leaveType = await LeaveType.findAll({})
        res.send(leaveType)
        
    } catch (error) {
        res.send(error.message)
        
    }

})



module.exports = router;