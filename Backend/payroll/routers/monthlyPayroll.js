/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const router = express.Router();
const MonthlyPayroll = require("../models/monthlyPayroll");
const User = require('../../users/models/user');
const AdvanceSalary = require("../models/advanceSalary");
const sequelize = require('../../utils/db');
const UserPersonal = require("../../users/models/userPersonal");
const UserAccount = require("../../users/models/userAccount");
const StatutoryInfo = require("../../users/models/statutoryInfo");
const UserPosition = require("../../users/models/userPosition");
const Designation = require("../../users/models/designation");
const { where } = require("sequelize");

router.post("/save", async (req, res) => {
  const data = req.body.payrolls;
  
  try {
    for (let i = 0; i < data.length; i++) {
      const { userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, insurance, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, leaveDays, daysInMonth} = data[i];
      const monthlyPayroll = new MonthlyPayroll({userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, insurance, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt: new Date(), leaveDays, daysInMonth});

      const advanceSalary = await AdvanceSalary.findOne({ where: { userId: userId, status: true } });
      if(advanceSalary){
        advanceSalary.completed += 1;
        if(advanceSalary.duration === advanceSalary.completed){
          advanceSalary.status = false
        }
        await advanceSalary.save();
      }
      await monthlyPayroll.save();
    }
    res.send("Payrolls saved successfully");
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/find", async (req, res) => {
  try {
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
    });
    res.send(monthlyPayroll);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/findbyuser/:id", async (req, res) => {
  console.log(req.params.id,"aaaaaaaaaaaaaaaaaaaaa");
  
  try {
    const monthlyPayroll = await MonthlyPayroll.findAll({
        where: {userId: req.params.id}, 
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
    });
    res.send(monthlyPayroll);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/bypayedfor", async (req, res) => {
  try {
    const { payedFor } = req.query;
    
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
      where: { payedFor: payedFor }, include: [
        {model: User, attributes: ['name','empNo']}
      ]
    });

    return res.status(200).json(monthlyPayroll);
  
  } catch (error) {
    res.send(error.message)
  }
});

router.post("/update", async (req, res) => {
  const data = req.body.payrolls;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).send("Invalid payroll data provided.");
  }

  const transaction = await sequelize.transaction();

  try {

    for (const payroll of data) {
      
      const {userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, insurance, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt, leaveDays
      } = payroll;

      // Check if a payroll record exists for the given user and period
      const existingPayroll = await MonthlyPayroll.findOne({
        where: { userId, payedFor },
        transaction
      });

      if (existingPayroll) {
        await existingPayroll.update({ basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, insurance, tds,
          advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt, leaveDays }, { transaction });
      } else 
        await MonthlyPayroll.create({ basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, insurance, tds,
          advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt, leaveDays }, { transaction });
    }

    await transaction.commit();
    res.send("Payrolls updated successfully");
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating payrolls:", error);
    res.status(500).send("An error occurred while updating payrolls.");
  }
});

router.get('/findbyid/:id', async (req, res) => {
  try {
    const monthlyPayroll = await MonthlyPayroll.findByPk(req.params.id,{ 
      include: [
        {model: User, attributes: ['name','empNo'], include: [
          {model: UserPersonal, attributes: ['dateOfJoining']},
          {model: UserAccount},
          {model: StatutoryInfo, attributes: ['panNumber', 'uanNumber', 'pfNumber']},
          {model: UserPosition, attributes: ['designationId', 'department', 'location'], include:[
            {model: Designation, attributes: ['designationName']}
          ]}
        ]}
      ]
    });

    return res.status(200).json(monthlyPayroll);
  
  } catch (error) {
    res.send(error.message)
  }
})



module.exports = router;