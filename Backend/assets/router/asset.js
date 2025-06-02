/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const Asset = require('../model/asset');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');
const UserAssetsDetails = require('../model/userAssetDetails');

router.post('/add', authenticateToken, async (req, res) => {
    const { assetName, assetNumber, assetHandoverNumber, serialNumber, noOfItems, description } = req.body;

    try {
          const asset = new Asset({ assetName, assetNumber, assetHandoverNumber, serialNumber, noOfItems, description });
          await asset.save();
          
          res.send(asset);

    } catch (error) {
        res.send(error.message);
    }
})

router.get('/find', async (req, res) => {
    try {
      let whereClause = {}
      let limit;
      let offset;

      if (req.query.pageSize && req.query.page && req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
        limit = req.query.pageSize;
        offset = (req.query.page - 1) * req.query.pageSize;
      }else {
        whereClause = {
          assignedStatus: false
        }
      }

      if (req.query.search &&req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('assetName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('assetNumber'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('serialNumber'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            )
          ]
        };
      }

      const asset = await Asset.findAll({
        order:['id'], limit, offset, where: whereClause
      })
  
      let totalCount;
      totalCount = await Asset.count({where: whereClause});
      
      if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
        const response = {
          count: totalCount,
          items: asset,
        };
  
        res.json(response);
      } else {
        res.send(asset);
      }
    } catch (error) {
      res.send(error.message);
    }
})

router.delete('/delete/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await Asset.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.send(`Asset with the ID ${req.params.id} not found `);
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

router.get('/findbyid/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await Asset.findByPk({});

      if (result === 0) {
          return res.send(`Asset with the ID ${req.params.id} not found `);
        }
    
        res.send(result);
      }  catch (error) {
        res.send(error.message);
  }
  
})


router.patch('/update/:id', authenticateToken, async (req, res) => {
  const { assetName, assetNumber, assetHandoverNumber, serialNumber, noOfItems, description } = req.body;
  try {
    const asset = await Asset.findByPk(req.params.id);
    asset.assetName = assetName;
    asset.assetNumber = assetNumber;
    asset.assetHandoverNumber = assetHandoverNumber;
    asset.serialNumber = serialNumber;
    asset.noOfItems = noOfItems;
    asset.description = description
    await asset.save();
    res.send(asset);
  } catch (error) {
    res.send( error.message );
  }
});


  
module.exports = router;