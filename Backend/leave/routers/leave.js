const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Leave = require('../models/leave');
const UserLeave = require('../models/userLeave');

// Route to create a leave request
router.post('/', authenticateToken, async (req, res) => {
  const { leaveTypeId, startDate, endDate, notes } = req.body;
  const userId = req.user.id; // added by Amina 
  if (!leaveTypeId || !startDate || !endDate) {
    return res.send('Missing required fields');
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.send('Invalid date format');
    }

    const noOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const userLeave = await UserLeave.findOne({ where: { userId, leaveTypeId } });
    if (!userLeave) return res.send('User leave mapping not found');
    if (userLeave.leaveBalance < noOfDays) return res.send('Not enough leave balance');

    const leave = await Leave.create({ userId, leaveTypeId, startDate, endDate, noOfDays, notes, status: 'requested' });

    userLeave.takenLeaves += noOfDays;
    userLeave.leaveBalance -= noOfDays;
    await userLeave.save();

    res.send(leave);
  } catch (error) {
    res.send('Internal Server Error');
  }
});



// Route to get all leave requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({});
    res.status(200).send(leaves);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to approve/reject leave request
router.put('/:leaveId/status', authenticateToken, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.status(404).send('Leave request not found');
    }

    leave.status = status;
    await leave.save();

    res.status(200).send(leave);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
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
