/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
const Payroll = require("../models/payroll");
const PayrollLog = require("../models/payrollLog");
const { Op } = require('sequelize');
const User = require('../../users/models/user')

router.post("/", async (req, res) => {
  try {
    const { userId, basic, hra, conveyanceAllowance, lta, grossPay, pf, insurance, gratuity, netPay, specialAllowance, pfDeduction, esi } = req.body;

    const payroll = new Payroll({userId, basic, hra, conveyanceAllowance, lta, grossPay, pf, insurance, gratuity, netPay, specialAllowance, pfDeduction, esi });
    await payroll.save();
    res.send(payroll)
  } catch (error) {
    res.send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const payroll = await Payroll.findAll({ 
      include:[
        { model: User, attributes: ['name','empNo']}
      ] 
    });
    res.send(payroll);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    
    const payroll = await Payroll.findOne({ where: { userId: userId } });
    if (!payroll) {
      return res.send("Payroll not found");
    }
    return res.status(200).json(payroll);
  
  } catch (error) {
    res.send(error.message);
  }
});


router.patch("/:id", async (req, res) => {
  const { basic, hra, conveyanceAllowance, lta, grossPay, pf, insurance, gratuity, netPay, specialAllowance, pfDeduction } = req.body;
  try {
    const payroll = await Payroll.findOne({ where: { id: req.params.id } });
    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }

    const log = new PayrollLog({ userId: payroll.userId, oldIncome: payroll.netPay, newIncome: netPay, updatedDate: new Date()})
    
    await log.save();

    payroll.basic = basic;
    payroll.hra = hra;
    payroll.conveyanceAllowance = conveyanceAllowance;
    payroll.lta = lta;
    payroll.grossPay = grossPay;
    payroll.pf = pf;
    payroll.insurance = insurance;
    payroll.gratuity = gratuity;
    payroll.netPay = netPay;
    payroll.specialAllowance = specialAllowance;
    payroll.pfDeduction = pfDeduction;
    payroll.esi = esi;

    await payroll.save();

    res.json({payroll, log});
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/find', async (req, res) => {
  try {
    let whereClause = {}
    let limit;
    let offset;
    
    if (req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('companyName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    } else {
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('companyName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ], 
          // status: true
        };
      }
      //  else {
      //   whereClause = {
      //     status: true
      //   };
      // }
    }

    const payroll = await Payroll.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Company.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: payroll,
      };

      res.json(response);
    } else {
      // const filteredRoles = role.filter(role => 
      //   role.roleName !== 'Administrator' && role.roleName !== 'Super Administrator' && role.roleName !== 'HR Administrator'
      // );
      res.json(payroll);
    }
  } catch (error) {
    res.send(error.message);
  }


})

router.get("/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    console.log('companyId:', companyId);

    const payroll = await Company.findOne({ where: { id: companyId } });
    console.log('payroll:', payroll);

    if (!payroll) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Send the payroll data as the response
    res.json(payroll);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;