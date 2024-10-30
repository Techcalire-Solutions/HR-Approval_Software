const express = require("express");
const router = express.Router();
const AdvanceSalary = require("../models/advanceSalary");
const { Op, where } = require('sequelize');
const User = require('../../users/models/user');
const authenticateToken = require('../../middleware/authorization');

router.post("/", authenticateToken, async (req, res) => {
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

router.get("/", authenticateToken, async (req, res) => {
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


router.get("/findbyid/:id", authenticateToken, async (req, res) => {
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
        // Handle any errors that occur during the update process
        res.send(error.message);
    });
} catch (error) {
    // Handle any unexpected errors
    res.send(error.message);
}

})

module.exports = router;