const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');
const { Op } = require('sequelize');
const cron = require('node-cron');
const moment = require('moment');
const LeaveType = require('../models/leaveType')



// -----------------------------Leave Accumulation function-----------------------------------------------
cron.schedule('0 0 1 * *', async () => {
  try {

    const leaveTypes = await LeaveType.findAll();
    const sickLeaveType = leaveTypes.find(type => type.leaveTypeName === 'Sick Leave');
    const casualLeaveType = leaveTypes.find(type => type.leaveTypeName === 'Casual Leave');


    if (sickLeaveType && casualLeaveType) {
      const userLeaves = await UserLeave.findAll({
        where: {
          leaveTypeId: {
            [Op.in]: [sickLeaveType.id, casualLeaveType.id]
          }
        }
      });

  
      for (let userLeave of userLeaves) {
        userLeave.leaveBalance += 1; 
        await userLeave.save();
      }

    } else {
      console.error('Sick Leave or Casual Leave type not found.');
    }
  } catch (error) {
    console.error('Error updating leave balances:', error);
  }
});

//---------------------------------Leave count---------------------------------------------------------------
router.get('/leavecount/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const userLeaves = await UserLeave.findAll({
      where: { userId },
      include: [
        {
          model: LeaveType,
          as: 'leaveType', 
          attributes: ['leaveTypeName'],
        },
      ],
    });

    if (!userLeaves.length) {
      return res.status(404).json({ message: 'No leave records found for this user.' });
    }

    const leaveCounts = userLeaves.map(({ leaveTypeId, leaveBalance, takenLeaves, leaveType }) => ({
      leaveTypeId,
      leaveTypeName: leaveType.leaveTypeName,
      leaveBalance,
      takenLeaves,
    }));

    res.json(leaveCounts);
  } catch (error) {
  res.send(error.message)
  }
});


router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, leaveTypeId, noOfDays, takenLeaves, leaveBalance } = req.body;

    const userLeave = new UserLeave({
      userId,
      leaveTypeId,
      noOfDays,
      takenLeaves,
      leaveBalance,
    });

    await userLeave.save();
    res.send(userLeave);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findAll({});
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



router.get('/byuserandtype/:userid/:typeid', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findOne({
      where: { userId : req.params.userid, leaveTypeId: req.params.typeid}
    });
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});






router.patch('/update', authenticateToken, async (req, res) => {
  let  data  = req.body;
  try {
    let updated = [];
    for( let i = 0; i < data.length; i++ ){
      let ulExist = await UserLeave.findOne({
        where: { userId: data[i].userId, leaveTypeId: data[i].leaveTypeId }
      })
      if(ulExist){
        ulExist.noOfDays  = +data[i].noOfDays;
        ulExist.takenLeaves = +data[i].takenLeaves;
        ulExist.leaveBalance = +data[i].leaveBalance;

        await ulExist.save();
        updated.push(ulExist);
      }else{
        let userLeave = new UserLeave({
          userId: data[i].userId,
          leaveTypeId: data[i].leaveTypeId,
          noOfDays: +data[i].noOfDays,
          takenLeaves: +data[i].takenLeaves,
          leaveBalance: +data[i].leaveBalance
        })
        await userLeave.save();
        updated.push(userLeave);
      }
    }
    res.send(updated);
  } catch (error) {
    res.send(error.message)
  }
})




module.exports = router;
