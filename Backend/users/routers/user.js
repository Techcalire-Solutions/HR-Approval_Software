const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Role = require('../models/role')
const {Op, fn, col, where} = require('sequelize');
const sequelize = require('../../utils/db'); 

router.post('/add', async (req, res) => {
  console.log(req.body);
  const { name, email, phoneNumber, password, roleId, status} = req.body;
  try {
    try {
      const userExist = await User.findOne({
        where: { email: email}
      });
      if (userExist) {
        return res.send('User already exists' )  
      }
      console.log(userExist);
    } catch (error) {
      res.send(error.message)
    } 
    const pass = await bcrypt.hash(password, 10);
    
    const user = new User({name, email, phoneNumber, password: pass, roleId, status});
    await user.save();
    console.log(user);
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/find/', async (req, res) => {
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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('phoneNumber'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('email'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('role.roleName'), ' ', '')),
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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
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

    const users = await User.findAll({
      where: whereClause,
      include: [
        {model: Role, as: 'role', attributes: ['roleName']}
      ],
      order: ["id"],
      limit, 
      offset
    });

    let totalCount;
    totalCount = await User.count();

    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: users,
      };

      res.json(response);
    } else {
      res.json(users);
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/search/name', async (req, res) => {
  try {
    let whereClause = {};
    if (req.query.search) {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')),
            {
              [Op.like]: `%${searchTerm}%`
            }
          )
        ]
      };
    }

    const result = await User.findAll({
      where: whereClause,
      order: [["id", "ASC"]]
    });

    res.send(result); // Send the results to the client
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/statusupdate/:id', async(req,res)=>{
  try {
    let status = req.body.status;
    let result = await User.findByPk(req.params.id);
    result.status = status
    await result.save();
    res.send(result);
    } catch (error) {
      res.send(error.message);
    }
})

router.get('/findone/:id', async(req,res)=>{
  let id = req.params.id;
  try {
    const user = await User.findByPk(id);
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { name, email, phoneNumber, password, roleId, status} = req.body;
  const pass = await bcrypt.hash(password, 10);
  try {
    let result = await User.findByPk(req.params.id);
    result.name = name;
    result.email = email;
    result.phoneNumber = phoneNumber;
    result.password = pass;
    result.roleId = roleId;
    result.status = status;

    await result.save();
    res.send(result);
    } catch (error) {
      res.send(error.message);
    }
})

router.delete('/delete/:id', authenticateToken, async(req, res)=>{
  const id = req.params.id
  try {
      const user = await User.findByPk(id)

      const result = await user.destroy({
        force: true
      });
      if (result === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Brand with that ID not found",
      });
    }

    res.status(204).json();
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/findbyrole/:id', async (req, res) => {
  try {
    const user = await User.findAll({
      where: {roleId: req.params.id}
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})
module.exports = router;
 