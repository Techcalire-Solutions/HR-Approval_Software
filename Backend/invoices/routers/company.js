const express = require("express");
const router = express.Router();
const Company = require("../models/company");
const { Op, where } = require('sequelize');


router.post("/", async (req, res) => {
  try {
    console.log("company body" + req.body);
    const {
      companyName,
      code,
      customer,
      supplier,
      contactPerson,
      designation,
      email,
      website,
      linkedIn,
      phoneNumber,
      address1,
      address2,
      city,
      country,
      state,
      zipcode,
      remarks,


    } = req.body;

    const compExist = await Company.findOne({ 
      where: { companyName: companyName }
    })
    if(compExist){
      return res.status(500).json({
        status: "error",
        message: 'There is already a company that exists under the same name.',
      });
    }

    const company = new Company({
      companyName,
      code,
      customer,
      supplier,
      contactPerson,
      designation,
      email,
      website,
      linkedIn,
      phoneNumber,
      address1,
      address2,
      city,
      country,
      state,
      zipcode,
      remarks,

    });
    await company.save();
    res.send(company)
    

  } catch (error) {
    res.send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const company = await Company.findAll({ 
      order: [['createdAt', 'DESC']],
    });
    res.send(company);
  } catch (error) {}
});

router.get("/suppliers", async (req, res) => {
  try {
    const companies = await Company.findAll({ 
      where: { supplier: true }, // Filter where supplier is true
      order: [['createdAt', 'DESC']],
    });
    res.send(companies);
  } catch (error) {
    console.error("Error fetching suppliers:", error); // Log the error for debugging
    res.status(500).send({ message: "Internal server error" }); // Send a 500 status if there's an error
  }
});

router.get("/customers", async (req, res) => {
  try {
    const companies = await Company.findAll({ 
      where: { customer: true }, // Filter where supplier is true
      order: [['createdAt', 'DESC']],
    });
    res.send(companies);
  } catch (error) {
    console.error("Error fetching suppliers:", error); // Log the error for debugging
    res.status(500).send({ message: "Internal server error" }); // Send a 500 status if there's an error
  }
});

// router.get("/paginated", async (req, res) => {
//   try {
//     let whereClause = {};
//     let limit;
//     let offset;

//     if (req.query.pageSize && req.query.page) {
//       limit = parseInt(req.query.pageSize, 10) || 10; // Default to 10 if not a valid number
//       offset = (parseInt(req.query.page, 10) - 1) * limit || 0;
//     }else {
//       whereClause = {
//         status : true
//       }
//     }
//     console.log(req.query.search);
//     if (req.query.search) {
//       const searchValue = %${req.query.search.trim()}%;
//       whereClause = {
//         [Op.or]: [
//           { companyName: { [Op.iLike]: searchValue } },
//           { contactPerson: { [Op.iLike]: searchValue } },
//           { phoneNumber: { [Op.iLike]: searchValue } },
//           { email: { [Op.iLike]: searchValue } },
//           { '$companyTerm.companyTermsName$': { [Op.iLike]: searchValue } } 
//         ]
//       };
//     }

//     const result = await Company.findAll({
//       where: whereClause,
//       include: [
//         {model: CompanyTerm, as: 'companyTerm', attributes: ['companyTermsName']}, 
//         {model: Team, attributes: ['teamName']},
//         {model: PartSupplier, as:'partSupplier', include: [
//           {model: Part}
//         ]}
//       ],
//       order: [['createdAt', 'DESC']],
//       limit, 
//       offset
//     });

//     let totalCount;
//     // Added where clause to count method
//     totalCount = await Company.count({ where: whereClause });
//     const response = {
//       count: totalCount,
//       items: result,
//     };

//     res.json(response);
//   } catch (error) {
//     res.send(error.message);
//   }
// });

router.get("/findone/:id", async (req, res) => {
  console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLll");
  
  try {
    const companyId = req.params.id;
    const company = await Company.findOne({ where: { id: companyId },
      include: [CompanyTerm, Team]  });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
  
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    const {
      companyName,
      code,
      customer,
      supplier,
      contactPerson,
      designation,
      email,
      website,
      linkedIn,
      phoneNumber,
      address1,
      address2,
      city,
      country,
      state,
      zipcode,
      remarks
    } = req.body;
    const company = await Company.findOne({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    company.companyName = companyName;
    company.code = code;
    company.customer = customer;
    company.supplier = supplier;
    company.contactPerson = contactPerson;
    company.designation = designation;
    company.email = email;
    company.website = website;
    company.linkedIn = linkedIn;
    company.phoneNumber = phoneNumber;
    company.address1 = address1;
    company.address2 = address2;
    company.city = city;
    company.country = country;
    company.state = state;
    company.zipcode = zipcode;
    company.remarks = remarks;
    await company.save();

    res.json(company);
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

    const company = await Company.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Company.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: company,
      };

      res.json(response);
    } else {
      // const filteredRoles = role.filter(role => 
      //   role.roleName !== 'Administrator' && role.roleName !== 'Super Administrator' && role.roleName !== 'HR Administrator'
      // );
      res.json(company);
    }
  } catch (error) {
    res.send(error.message);
  }


})
router.delete('/:id', async(req,res)=>{
  try {

      const result = await Company.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Company with that ID not found",
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
    const company = await Company.findAll({
      where: {supplier: true, id: { [Op.ne]: companyId }}, 
    });

    res.send(company);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

router.get("/getsuppliersforparts/:partid/:companyid", async (req, res) => {
  try {
    const companyId = req.params.companyid;
    const partId = req.params.partid
    const company = await Company.findAll({
      include : [ { model: PartSupplier, as: 'partSupplier'}],
      where: {supplier: true, id: { [Op.ne]: companyId }, '$partSupplier.partId$': partId},
    });

    res.send(company);
      
  } catch (error) {
    res.send({ error: error.message});
  }
});

router.get("/:id", async (req, res) => {
  try {
    const companyId = req.params.id;
    console.log('companyId:', companyId);

    const company = await Company.findOne({ where: { id: companyId } });
    console.log('company:', company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Send the company data as the response
    res.json(company);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;