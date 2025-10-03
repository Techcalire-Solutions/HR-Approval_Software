/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const  router = express.Router();
const authenticateToken = require('../../middleware/authorization');

const UserAssets = require('../model/userAsset');
const UserAssetDetails = require('../model/userAssetDetails');
const UserPosition = require('../../users/models/userPosition');
const User = require('../../users/models/user');
const Assets = require('../model/asset');
const { Op } = require('sequelize');

router.post('/', authenticateToken, async (req, res) => {
  const {
    assetName, assetNumber, assetHandoverNumber, serialNumber,
    description, purchasedDate, purchasedFrom, invoiceNo, assignedStatus
  } = req.body;

  // Validation
  if (!assetName) return res.status(400).send("assetName is required");

  try {
    const asset = await UserAssets.create({
      assetName,
      assetNumber,
      assetHandoverNumber,
      serialNumber,
      description,
      purchasedDate,
      purchasedFrom,
      invoiceNo,
      assignedStatus
    });

    res.status(201).send(asset);

  } catch (error) {
    console.error("Error saving asset:", error);
    res.status(500).send(error.message);
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    assetName, assetNumber, assetHandoverNumber, serialNumber,
    description, purchasedDate, purchasedFrom, invoiceNo, assignedStatus
  } = req.body;

  // Validation
  if (!assetName) return res.status(400).send("assetName is required");

  try {
    // Find the asset by ID
    const asset = await UserAssets.findByPk(id);
    
    if (!asset) {
      return res.send("Asset not found");
    }

    // Update the asset
    const updatedAsset = await asset.update({
      assetName,
      assetNumber,
      assetHandoverNumber,
      serialNumber,
      description,
      purchasedDate,
      purchasedFrom,
      invoiceNo,
      assignedStatus
    });

    res.send(updatedAsset);

  } catch (error) {
    res.send(error.message);
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Find the asset by ID
    const asset = await UserAssets.findByPk(id);

    if (!asset) {
      return res.status(404).send("Asset not found");
    }

    // Delete the asset
    await asset.destroy();

    res.status(200).send({ message: "Asset deleted successfully" });

  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).send(error.message);
  }
});

router.post('/save', authenticateToken, async (req, res) => {
    const { userId, assetCode, assets } = req.body;

    try {
        const userExists = await UserAssets.findOne({ where: { userId } });
        if (userExists) {
            return res.send("Asset already added");
        }
        const codeExists = await UserAssets.findOne({ where: { assetCode } });
        if (codeExists) {
            return res.send("The code is already allotted");
        }

        const ua = await UserAssets.create({ userId, assetCode });
        if (Array.isArray(assets) && assets.length > 0) {
            for (const asset of assets) {
                await Assets.update(
                    { assignedStatus: true }, 
                    { where: { id: asset.assetId } } 
                );
            }

            const updatedAssets = assets.map(asset => ({
                ...asset,
                userAssetId: ua.id
            }));
            const uad = await UserAssetDetails.bulkCreate(updatedAssets);
            return res.send(uad);
        } else {
            return res.send("No assets provided.");
        }

    } catch (error) {
        return res.send(error.message);
    }
});
 
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
              { [Op.like]: `%${searchTerm}%` }
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

      const asset = await UserAssets.findAll({
        order:['id'], limit, offset, where: whereClause
      })
  
      let totalCount;
      totalCount = await UserAssets.count({where: whereClause});
      
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

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
    try {
        const ua = await UserAssets.findOne({
            where: {userId: req.params.id},
            include: [
                { model: User, attributes: ['name']}, 
                { model: UserAssetDetails, include: [{
                    model: Assets
                }] }
            ]
        });
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

router.patch('/update/:id', authenticateToken, async (req, res) => {
    const { assets, assetCode } = req.body;
    try {
        // Check if UserAssets exists with the given ID
        const userAsset = await UserAssets.findByPk(req.params.id);
        if (!userAsset) {
            return res.send("UserAssets not found.");
        }

        // Update assetCode if provided and not already allotted
        if (assetCode) {
            const codeExists = await UserAssets.findOne({
                where: { assetCode, id: { [Op.ne]: req.params.id } } // Exclude current record
            });
            if (codeExists) {
                return res.send("The code is already allotted to another asset.");
            }
            userAsset.assetCode = assetCode;
        }

        await userAsset.save();

        if (Array.isArray(assets) && assets.length > 0) {
            const existingAssets = await UserAssetDetails.findAll({ where: { userAssetId: userAsset.id } });

            // Update assignedStatus to false for the assets that are being removed
            for (const existingAsset of existingAssets) {
                await Assets.update(
                    { assignedStatus: false },
                    { where: { id: existingAsset.assetId } }
                );
            }

            // Delete the existing assets in UserAssetDetails
            await UserAssetDetails.destroy({ where: { userAssetId: userAsset.id } });

            // Assign userAssetId to each new asset and set assignedStatus to true
            const updatedAssets = assets.map(asset => ({
                ...asset,
                userAssetId: userAsset.id
            }));

            // Bulk create new assets and set assignedStatus to true
            const uad = await UserAssetDetails.bulkCreate(updatedAssets);

            // Update the assignedStatus to true for the newly created assets
            for (const asset of updatedAssets) {
                await Assets.update(
                    { assignedStatus: true },
                    { where: { id: asset.assetId } }
                );
            }

            return res.send({ userAsset, updatedAssets });
        } else {
            return res.send("No assets provided.");
        }
    } catch (error) {
        return res.send(error.message);
    }
});

router.get('/getassigneduser/:id', authenticateToken, async (req, res) => {
    const assetId = req.params.id;
    try {
      const details = await UserAssetDetails.findOne({
        where: { assetId },
        include: [ {  model: UserAssets, attributes: ['userId'], include: [ {
            model: User, attributes: ['name'],
            } ]
          },
        ],
      });
  
      if (details && details.userAsset) {
        res.send({ userId: details.userAsset.user.name });
      } else {
        res.send({ userId: null }); // Use a consistent object response
      }
    } catch (error) {
      res.status(500).send({ error: 'An error occurred while fetching the assigned user.' });
    }
});
  
module.exports = router;