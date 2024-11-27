/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const router = express.Router();
const AdvanceSalary = require("../models/advanceSalary");
const User = require('../../users/models/user');
const authenticateToken = require('../../middleware/authorization');

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { userId, scheme,amount, reason, duration, monthlyPay } = req.body;

    const advanceSalary = new AdvanceSalary({ userId, scheme, amount, reason, duration, monthlyPay });
    await advanceSalary.save();
    res.send(advanceSalary)
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/notcompleted", authenticateToken, async (req, res) => {
  try {
    const advanceSalary = await AdvanceSalary.findAll({ 
        where: {status: true},
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
      order: [['createdAt', 'DESC']],
    });
    res.send(advanceSalary);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/findall", authenticateToken, async (req, res) => {
  try {
    const advanceSalary = await AdvanceSalary.findAll({ 
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
      order: [['createdAt', 'DESC']],
    });
    res.send(advanceSalary);
  } catch (error) {
    res.send(error.message);
  }
});


router.get("/findbyid/:id", authenticateToken, async (req, res) => {
  try {
    const advanceSalaryId = req.params.id;

    const advanceSalary = await AdvanceSalary.findOne({ where: { id: advanceSalaryId } });
    if (!advanceSalary) {
      return res.json({ error: "Company not found" });
    }

    // Send the advanceSalary data as the response
    res.json(advanceSalary);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/findbyuserid/:id", authenticateToken, async (req, res) => {
  try {

    const advanceSalary = await AdvanceSalary.findOne({ where: { userId: req.params.id, status: true } });
   
    res.json(advanceSalary);
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', authenticateToken, async(req,res)=>{
  try {
    const id = parseInt(req.params.id, 10);
    AdvanceSalary.update(req.body, {
        where: { id: id }
    })
    .then(num => {
        if (num == 1) {
            res.send({
                message: "Advance Salary was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Advance Salary with id=${roleId}. Maybe Advance Salary was not found or req.body is empty!`
            });
        }
    })
    .catch(error => {
        res.send(error.message);
    });
} catch (error) {
    res.send(error.message);
}

})

router.patch('/closeadvance/:id', authenticateToken, async(req, res)=>{
  try {
    console.log(req.params.id);
    
    let as = await AdvanceSalary.findByPk(req.params.id)
    as.status = false;
    as.completedDate = new Date();
    as.closeNote = req.body.closeNote;
    await as.save();
    res.send(as);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;