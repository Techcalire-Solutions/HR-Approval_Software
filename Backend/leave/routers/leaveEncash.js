const express = require('express');
const router =  express.Router();
const authenticateToken = require('../../middleware/authorization');

const UserLeave = require('../models/userLeave');
const LeaveEncash = require('../models/leaveEncash');

router.post('/',authenticateToken,async(req,res)=>{
    try {
        const { userId, leaveTypeId, encashedDays, amount } = req.body;

        // Fetch user leave balance
        const userLeave = await UserLeave.findOne({
            where: { userId, leaveTypeId },
        });

        if (!userLeave || userLeave.leaveBalance < encashedDays) {
            return res.status(400).json({ message: 'Insufficient leave balance' });
        }

        // Deduct encashed days from the user's leave balance
        userLeave.leaveBalance -= encashedDays;
        await userLeave.save();

        // Record the leave encashment
        const encashment = await LeaveEncash.create({
            userId,
            leaveTypeId,
            encashedDays,
            amount,
            encashDate: new Date(),
        });

        res.status(200).json({
            message: 'Leave encashed successfully',
            encashment,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }

})



module.exports=router;