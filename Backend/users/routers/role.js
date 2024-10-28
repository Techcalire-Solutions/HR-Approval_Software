const express = require('express');
const Role = require('../models/role');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');


router.post('/', authenticateToken, async (req, res) => {
  const { roleName, abbreviation, status } = req.body;
    try {
      let rrr = await Role.findAll({})
      console.log(rrr);
      
          const role = new Role({roleName, abbreviation, status});
          await role.save();
          
          res.send(role);

    } catch (error) {
      console.log(error);
      
        res.send(error.message);
    }
})

router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await Role.findAll({});

    res.send(roles);
  } catch (error) {
    res.status(500).send({ error: error.message });
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
          ], 
          status: true
        };
      } else {
        whereClause = {
          status: true
        };
      }
    }

    const role = await Role.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Role.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: role,
      };

      res.json(response);
    } else {
      // const filteredRoles = role.filter(role => 
      //   role.roleName !== 'Administrator' && role.roleName !== 'Super Administrator' && role.roleName !== 'HR Administrator'
      // );
      res.json(role);
    }
  } catch (error) {
    res.send(error.message);
  }


})

router.get('/findbyid/:id', authenticateToken,  async (req, res) => {
  try {
    const role = await Role.findOne({where: {id: req.params.id}, order:['id']})

    res.send(role);
  } catch (error) {
    res.send(error.message);
  }  
})

router.get('/rolename', authenticateToken, async (req, res) => {
  try {
    const roles = await Role.findOne({
      where: { roleName: req.query.role }, 
      order: ["id"]
    });

    res.send(roles);
  } catch (error) {
    res.send(error.message);
  }
});


router.delete('/:id', authenticateToken, async(req,res)=>{
    try {
        const result = await Role.destroy({
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

router.patch('/:id', authenticateToken, async(req,res)=>{
  try {
    const roleId = parseInt(req.params.id, 10);

    if ([1, 2, 3, 4, 5].includes(roleId)) {
        return res.send("Role cannot be updated");
    }
    Role.update(req.body, {
        where: { id: roleId }
    })
    .then(num => {
        if (num == 1) {
            res.send({
                message: "Role was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Role with id=${roleId}. Maybe Role was not found or req.body is empty!`
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

router.patch('/statusupdate/:id', authenticateToken, async(req,res)=>{
  try {

    let status = req.body.status;
    let result = await Role.findByPk(req.params.id);
    result.status = status

    await result.save();
    res.send(result);
    } catch (error) {
      res.send(error.message);
    }
})

router.get('/search/name', async (req, res) => {
  try {
    let whereClause = {};
    if (req.query.search) {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('roleName')),
            {
              [Op.like]: `%${searchTerm}%`
            }
          )
        ]
      };
    }

    const result = await Role.findAll({
      where: whereClause,
      order: [["id", "ASC"]]
    });

    res.send(result); // Send the results to the client
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;