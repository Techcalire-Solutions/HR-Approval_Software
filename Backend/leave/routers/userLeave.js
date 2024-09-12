
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization')
const sequelize = require('../../utils/db')
const { Op, fn, col, where } = require('sequelize');
const UserLeave = require('../models/userLeave')


router.post('/', authenticateToken,async(req,res)=>{
    try {
        const {
            userId,
            leaveTypeId,
            noOfDays,
            takenLeaves,
            leaveBalance
        } = req.body;

        const userLeave = new UserLeave({
            userId,
            leaveTypeId,
            noOfDays,
            takenLeaves,
            leaveBalance

        });
        await userLeave.save();
        res.send(userLeave)

        
    } catch (error) {
        res.send(error.message)
        
    }
})


router.get('/',authenticateToken, async(req,res)=>{
    try {
        const userLeave = await UserLeave.findAll({})
        res.send(userLeave)
        
    } catch (error) {
        res.send(error.message)
        
    }

})



module.exports = router;