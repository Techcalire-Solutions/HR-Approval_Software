const express = require('express');
const UserPersonal = require('../models/userPersonal');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, empNo, dateOfJoining, probationPeriod, confirmationDate, isTemporary, maritalStatus, dateOfBirth, gender, 
    parentName, spouseName, referredBy, reportingManger} = req.body;
  try {
    // try {
    //   const userExist = await UserPersonal.findOne({
    //     where: { empNo: empNo}
    //   });
    //   if (userExist) {
    //     return res.status(400).send('Employee with the given employee number already exists.');
    //   }
    // } catch (error) {
    //   res.send(error.message)
    // }
    
    try {
      const us = await UserPersonal.findOne({
        where: { userId: userId}
      });
      if (us) {
        return res.send("Personal details has already been added for the given user");
      }
    } catch (error) {
        res.send(error.message)
    } 
    
    const user = new UserPersonal({userId, empNo,  dateOfJoining: new Date(dateOfJoining), probationPeriod, 
      confirmationDate: new Date(confirmationDate), isTemporary, maritalStatus, dateOfBirth: new Date(dateOfBirth), gender, 
      parentName, spouseName, referredBy, reportingManger});
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/find', authenticateToken, async (req, res) => {
  try {
    const user = await UserPersonal.findAll({})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserPersonal.findOne({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;