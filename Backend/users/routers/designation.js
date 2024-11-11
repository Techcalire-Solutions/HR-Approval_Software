const express = require('express');
const Role = require('../models/role');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Designation = require('../models/designation');

router.post('/add', authenticateToken, async (req, res) => {
  const { designationName, abbreviation } = req.body;
    try {
          const role = new Designation({ designationName, abbreviation });
          await role.save();
          
          res.send(role);

    } catch (error) {
        res.send(error.message);
    }
})

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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('roleName'), ' ', '')),
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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('roleName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    }

    const role = await Designation.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Designation.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: role,
      };

      res.json(response);
    } else{
      res.send(role)
    }
    // else {
    //   const filteredRoles = role.filter(role => 
    //     role.roleName !== 'Administrator' && role.roleName !== 'Super Administrator' && role.roleName !== 'HR Administrator'
    //   );
    //   res.json(filteredRoles);
    // }
  } catch (error) {
    res.send(error.message);
  }
})

router.patch('/update/:id', authenticateToken, async (req, res) => {
  try {
    const role = await Designation.findByPk(req.params.id);
    role.designationName = req.body.designationName;
    role.abbreviation = req.body.abbreviation;
    await role.save();
    res.send(role);
  } catch (error) {
    res.send( error.message );
  }
});

router.delete('/delete/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await Designation.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Role with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

module.exports = router;