const express = require("express");
const router = express.Router();
const Payroll = require("../models/payroll");
const { Op, where } = require('sequelize');

router.post("/", async (req, res) => {
  try {
    console.log("payroll body" + req.body);
    const {
        userId,
        basic,
        hra,
        conveyanceAllowance,
        lta,
        specialAllowance,
        grossSalary,
        pf,
        insurance,
        gratuity,
        employeeContribution
     


    } = req.body;

    // const compExist = await Payroll.findOne({ 
    //   where: { companyName: companyName }
    // })
    // if(compExist){
    //   return res.status(500).json({
    //     status: "error",
    //     message: 'There is already a payroll that exists under the same name.',
    //   });
    // }

    const payroll = new Payroll({
        userId,
        basic,
        hra,
        conveyanceAllowance,
        lta,
        specialAllowance,
        grossSalary,
        pf,
        insurance,
        gratuity,
        employeeContribution

    });
    await payroll.save();
    res.send(payroll)
    

  } catch (error) {
    res.send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const payroll = await Payroll.findAll({ 
    //   include:[
    //     { model: User, attributes: ['name','empNo']}
    // ],
    //   order: [['createdAt', 'DESC']],
    });
    res.send(payroll);
  } catch (error) {}
});

router.get("/:id", async (req, res) => {
  console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLll");
  
  try {
    const userId = req.params.id;
    console.log('userId',userId);
    
    const payroll = await Payroll.findOne({ where: { userId: userId },
     });
    // if (!payroll) {
    //   return res.status(404).json({ error: "Payroll not found" });
    // }
    return res.status(200).json(payroll);
  
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    const {
        userId,
        basic,
        hra,
        conveyanceAllowance,
        lta,
        specialAllowance,
        grossSalary,
        pf,
        insurance,
        gratuity,
        employeeContribution
    } = req.body;
    const payroll = await Payroll.findOne({ where: { id: companyId } });
    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }
    payroll.userId = userId;
    payroll.basic = basic;
    payroll.hra = hra;
    payroll.conveyanceAllowance = conveyanceAllowance;
    payroll.lta = lta;
    payroll.specialAllowance = specialAllowance;
    payroll.grossSalary = grossSalary;
    payroll.pf = pf;
    payroll.insurance = insurance;
    payroll.gratuity = gratuity;
    payroll.employeeContribution = employeeContribution;
    await payroll.save();

    res.json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/find', async (req, res) => {
  console.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP");
  
  try {
    let whereClause = {}
    let limit;
    let offset;
    console.log(req.query.pageSize, req.query.page,"PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPp");
    
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
router.delete('/:id', async(req,res)=>{
  try {

      const result = await Payroll.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Payroll with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
      res.send({error: error.message})
  }
  
})

router.get("/getsuppliers/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    const payroll = await Company.findAll({
      where: {supplier: true, id: { [Op.ne]: companyId }}, 
    });

    res.send(payroll);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

router.get("/getsuppliersforparts/:partid/:companyid", async (req, res) => {
  try {
    const companyId = req.params.companyid;
    const partId = req.params.partid
    const payroll = await Company.findAll({
      include : [ { model: PartSupplier, as: 'partSupplier'}],
      where: {supplier: true, id: { [Op.ne]: companyId }, '$partSupplier.partId$': partId},
    });

    res.send(payroll);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

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