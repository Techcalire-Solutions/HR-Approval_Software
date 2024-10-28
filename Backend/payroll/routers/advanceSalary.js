const express = require("express");
const router = express.Router();
const AdvanceSalary = require("../models/advanceSalary");
const { Op, where } = require('sequelize');
const User = require('../../users/models/user');

router.post("/", async (req, res) => {
  try {
    console.log("AdvanceSalary body" + req.body);
    const {
        userId,
        scheme,
        amount,
        reason
    } = req.body;

    const advanceSalary = new AdvanceSalary({
        userId,
        scheme,
        amount,
        reason

    });
    await advanceSalary.save();
    res.send(advanceSalary)
    

  } catch (error) {
    res.send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const advanceSalary = await AdvanceSalary.findAll({ 
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
      order: [['createdAt', 'DESC']],
    });
    res.send(advanceSalary);
  } catch (error) {}
});


router.get("/:id", async (req, res) => {
  try {
    const advanceSalaryId = req.params.id;
    console.log('advanceSalaryId:', advanceSalaryId);

    const advanceSalary = await AdvanceSalary.findOne({ where: { id: advanceSalaryId } });
    console.log('advanceSalary:', advanceSalary);

    if (!advanceSalary) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Send the advanceSalary data as the response
    res.json(advanceSalary);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;