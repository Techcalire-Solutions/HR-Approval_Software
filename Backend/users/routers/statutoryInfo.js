/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const StatutoryInfo = require('../models/statutoryInfo');
const {Op} = require('sequelize');
const User = require('../models/user');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, adharNo, panNumber, esiNumber, uanNumber, insuranceNumber, pfNumber, passportNumber, passportExpiry }  = req.body;

  try {
    // Build a dynamic where condition to only include non-null and non-empty values
    let whereCondition = {
      [Op.or]: []
    };

    if (adharNo) {
      whereCondition[Op.or].push({ adharNo: { [Op.ne]: null, [Op.eq]: adharNo } });
    }
    if (panNumber) {
      whereCondition[Op.or].push({ panNumber: { [Op.ne]: null, [Op.eq]: panNumber } });
    }
    if (esiNumber) {
      whereCondition[Op.or].push({ esiNumber: { [Op.ne]: null, [Op.eq]: esiNumber } });
    }
    if (uanNumber) {
      whereCondition[Op.or].push({ uanNumber: { [Op.ne]: null, [Op.eq]: uanNumber } });
    }
    if (insuranceNumber) {
      whereCondition[Op.or].push({ insuranceNumber: { [Op.ne]: null, [Op.eq]: insuranceNumber } });
    }
    if (pfNumber) {
      whereCondition[Op.or].push({ pfNumber: { [Op.ne]: null, [Op.eq]: pfNumber } });
    }
    if (passportNumber) {
      whereCondition[Op.or].push({ passportNumber: { [Op.ne]: null, [Op.eq]: passportNumber } });
    }
    if (whereCondition[Op.or].length > 0) {
      const userExist = await StatutoryInfo.findOne({
        where: whereCondition,
        include: [
          {model: User}
        ]
      });
      
      if (userExist) {
        return res.send(`User with given statutory information already exists for the user ${userExist.user.name}`)
      }
    }

    // Check if the statutory information for this userId already exists
    const us = await StatutoryInfo.findOne({
      where: { userId: userId }
    });

    if (us) {
      return res.send("Statutory information has already been added for this user.");
    }

    // Create and save the new statutory information
    const user = new StatutoryInfo({ userId, adharNo, panNumber, esiNumber, uanNumber, insuranceNumber, pfNumber,
       passportNumber, passportExpiry });
    await user.save();
    res.send(user);
    
  } catch (error) {
    res.send(error.message);
  }
});


router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await StatutoryInfo.findOne({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { adharNo, panNumber, esiNumber, uanNumber, pfNumber, insuranceNumber, passportNumber, passportExpiry } = req.body
  try {
    let whereCondition = {
      [Op.or]: []
    };

    if (adharNo) {
      whereCondition[Op.or].push({ adharNo: { [Op.ne]: null, [Op.eq]: adharNo } });
    }
    if (panNumber) {
      whereCondition[Op.or].push({ panNumber: { [Op.ne]: null, [Op.eq]: panNumber } });
    }
    if (esiNumber) {
      whereCondition[Op.or].push({ esiNumber: { [Op.ne]: null, [Op.eq]: esiNumber } });
    }
    if (uanNumber) {
      whereCondition[Op.or].push({ uanNumber: { [Op.ne]: null, [Op.eq]: uanNumber } });
    }
    if (insuranceNumber) {
      whereCondition[Op.or].push({ insuranceNumber: { [Op.ne]: null, [Op.eq]: insuranceNumber } });
    }
    if (pfNumber) {
      whereCondition[Op.or].push({ pfNumber: { [Op.ne]: null, [Op.eq]: pfNumber } });
    }
    if (passportNumber) {
      whereCondition[Op.or].push({ passportNumber: { [Op.ne]: null, [Op.eq]: passportNumber } });
    }
    if (whereCondition[Op.or].length > 0) {
      const userExist = await StatutoryInfo.findOne({
        where: {
          ...whereCondition,
          id: { [Op.ne]: req.params.id }, 
        },
        include: [
          {model: User}
        ]
      });
      
      if (userExist) {
        return res.send(`User with given statutory information already exists for the user ${userExist.user.name}`)
      }
    }

    let result = await StatutoryInfo.findByPk(req.params.id);
    result.adharNo = adharNo;
    result.panNumber = panNumber;
    result.esiNumber = esiNumber;
    result.uanNumber = uanNumber;
    result.insuranceNumber = insuranceNumber;
    result.pfNumber = pfNumber;
    result.passportNumber = passportNumber;
    result.passportExpiry = passportExpiry;

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;