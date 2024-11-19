/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAccount = require('../models/userAccount');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, accountNo, ifseCode, paymentFrequency, modeOfPayment, branchName, bankName }  = req.body;
  try {
    try {
      const userExist = await UserAccount.findOne({
        where: { accountNo: accountNo}
      });
      if (userExist) {
        return res.send("The provided bank account has already been added.");
      }
    } catch (error) {
      res.send(error.message)
    } 

    try {
        const us = await UserAccount.findOne({
          where: { userId: userId}
        });
        if (us) {
          return res.send("Account details has already been added for the given user");
        }
    } catch (error) {
        res.send(error.message)
    } 
    
    const user = new UserAccount({ userId, accountNo, ifseCode, paymentFrequency, modeOfPayment, branchName, bankName });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserAccount.findOne({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { accountNo, ifseCode, paymentFrequency, modeOfPayment, branchName, bankName } = req.body
  try {
    let result = await UserAccount.findByPk(req.params.id);
    result.accountNo = accountNo;
    result.ifseCode = ifseCode;
    result.paymentFrequency = paymentFrequency;
    result.modeOfPayment = modeOfPayment;
    result.branchName = branchName;
    result.bankName = bankName;

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;