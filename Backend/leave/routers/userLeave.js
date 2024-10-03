const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user');
const { Op, where } = require('sequelize');
const cron = require('node-cron');
const moment = require('moment');

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
    console.log(data);
    let updated = [];
    for( let i = 0; i < data.length; i++ ){
      let ulExist = await UserLeave.findOne({
        where: { userId: data[i].userId, leaveTypeId: data[i].leaveTypeId }
      })
      if(ulExist){
        ulExist.noOfDays  = data[i].noOfDays;
        ulExist.takenLeaves = data[i].takenLeaves;
        ulExist.leaveBalance = data[i].leaveBalance;

        await ulExist.save();
        updated.push(ulExist);
      }else{
        let userLeave = new UserLeave({
          userId: data[i].userId,
          leaveTypeId: data[i].leaveTypeId,
          noOfDays: data[i].noOfDays,
          takenLeaves: data[i].takenLeaves,
          leaveBalance: data[i].leaveBalance
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
