/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const router = express.Router();
const AdvanceSalary = require("../models/advanceSalary");
const User = require('../../users/models/user');
const authenticateToken = require('../../middleware/authorization');
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');

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
    let whereClause = { status: true };
    let limit;
    let offset;

    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('user.name'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('user.empNo'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              )
            ]
          },
          { status: true },
        ]
      };
    } else {
      if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
      }
    }

    const advanceSalary = await AdvanceSalary.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'empNo'],
        }
      ],
      order: [['createdAt', 'DESC']], 
      limit, offset
    });

    const totalCount = await AdvanceSalary.count({ where: whereClause });
    if (req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: advanceSalary 
      };

      res.json(response);
    } else {
      res.send(advanceSalary)
    }
  } catch (error) {
    res.send(error.message);
  }
});


router.get("/findall", authenticateToken, async (req, res) => {
  try {
    const advanceSalary = await AdvanceSalary.findAll({ 
        include:[
            { model: User, as: 'user', attributes: ['name','empNo']}
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

router.get("/findbyuseridall/:id", authenticateToken, async (req, res) => {
  try {
    let whereClause = { userId: req.params.id };
    let limit;
    let offset;

    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('amount'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              // sequelize.where(
              //   sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('user.empNo'), ' ', '')),
              //   { [Op.like]: `%${searchTerm}%` }
              // )
            ]
          },
          { userId: req.params.id },
        ]
      };
    } else {
      if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
      }
    }

    const advanceSalary = await AdvanceSalary.findAll({ 
      where: whereClause, limit: limit, offset: offset,
      include: [
        {
          model: User,
          attributes: ['name', 'empNo'],
        }
      ],
    });
    const totalCount = await AdvanceSalary.count({ where: whereClause });
    if (req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: advanceSalary 
      };

      res.json(response);
    } else {
      res.send(advanceSalary)
    }
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

router.delete('/delete/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await AdvanceSalary.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Advance with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

module.exports = router;