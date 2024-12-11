/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserNominee = require('../models/userNominee');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, nomineeName, nomineeContactNumber, nomineeRelation, aadhaarNumber }  = req.body;
  try {
    try {
        const us = await UserNominee.findOne({
          where: { userId: userId}
        });
        if (us) {
          return res.send("Nominee details has already been added for the given user");
        }
    } catch (error) {
        res.send(error.message)
    } 
    
    const user = new UserNominee({ userId, nomineeName, nomineeContactNumber, nomineeRelation, aadhaarNumber });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserNominee.findOne({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { nomineeName, nomineeContactNumber, nomineeRelation, aadhaarNumber } = req.body
  try {
    let result = await UserNominee.findByPk(req.params.id);
    result.nomineeName = nomineeName;
    result.nomineeContactNumber = nomineeContactNumber;
    result.nomineeRelation = nomineeRelation;
    result.aadhaarNumber = aadhaarNumber;

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;