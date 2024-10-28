const express = require("express");
const router = express.Router();
const MonthlyPayroll = require("../models/monthlyPayroll");
const { Op, where } = require('sequelize');
const User = require('../../users/models/user');
router.post("/", async (req, res) => {
  try {
    console.log("MonthlyPayroll body" + req.body);
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

    // const compExist = await MonthlyPayroll.findOne({ 
    //   where: { companyName: companyName }
    // })
    // if(compExist){
    //   return res.status(500).json({
    //     status: "error",
    //     message: 'There is already a monthlyPayroll that exists under the same name.',
    //   });
    // }

    const monthlyPayroll = new MonthlyPayroll({
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
    await monthlyPayroll.save();
    res.send(monthlyPayroll)
    

  } catch (error) {
    res.send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
        include:[
            { model: User, attributes: ['name','empNo']}
        ],
      // order: [['createdAt', 'DESC']],
    });
    res.send(monthlyPayroll);
  } catch (error) {}
});

router.get("/:id", async (req, res) => {
  console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLll");
  
  try {
    const userId = req.params.id;
    console.log('userId',userId);
    
    const monthlyPayroll = await MonthlyPayroll.findOne({ where: { userId: userId },
     });
    // if (!monthlyPayroll) {
    //   return res.status(404).json({ error: "MonthlyPayroll not found" });
    // }
    return res.status(200).json(monthlyPayroll);
  
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
    const monthlyPayroll = await MonthlyPayroll.findOne({ where: { id: companyId } });
    if (!monthlyPayroll) {
      return res.status(404).json({ error: "MonthlyPayroll not found" });
    }
    monthlyPayroll.userId = userId;
    monthlyPayroll.basic = basic;
    monthlyPayroll.hra = hra;
    monthlyPayroll.conveyanceAllowance = conveyanceAllowance;
    monthlyPayroll.lta = lta;
    monthlyPayroll.specialAllowance = specialAllowance;
    monthlyPayroll.grossSalary = grossSalary;
    monthlyPayroll.pf = pf;
    monthlyPayroll.insurance = insurance;
    monthlyPayroll.gratuity = gratuity;
    monthlyPayroll.employeeContribution = employeeContribution;
    await monthlyPayroll.save();

    res.json(monthlyPayroll);
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

    const monthlyPayroll = await MonthlyPayroll.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Company.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: monthlyPayroll,
      };

      res.json(response);
    } else {
 
      res.json(monthlyPayroll);
    }
  } catch (error) {
    res.send(error.message);
  }


})
router.delete('/:id', async(req,res)=>{
  try {

      const result = await MonthlyPayroll.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "MonthlyPayroll with that ID not found",
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
    const monthlyPayroll = await Company.findAll({
      where: {supplier: true, id: { [Op.ne]: companyId }}, 
    });

    res.send(monthlyPayroll);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

router.get("/getsuppliersforparts/:partid/:companyid", async (req, res) => {
  try {
    const companyId = req.params.companyid;
    const partId = req.params.partid
    const monthlyPayroll = await Company.findAll({
      include : [ { model: PartSupplier, as: 'partSupplier'}],
      where: {supplier: true, id: { [Op.ne]: companyId }, '$partSupplier.partId$': partId},
    });

    res.send(monthlyPayroll);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

router.get("/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    console.log('companyId:', companyId);

    const monthlyPayroll = await Company.findOne({ where: { id: companyId } });
    console.log('monthlyPayroll:', monthlyPayroll);

    if (!monthlyPayroll) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Send the monthlyPayroll data as the response
    res.json(monthlyPayroll);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;