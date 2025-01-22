/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');

const UserAssets = require('../model/userAsset');
const UserAssetDetails = require('../model/userAssetDetails');
const UserPosition = require('../../users/models/userPosition');
const User = require('../../users/models/user');
const Assets = require('../model/asset');
const { Op } = require('sequelize');

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
 
router.get('/find', authenticateToken, async (req, res) => {
    try {
        const department = req.query.department;
        const ua = await UserAssets.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    required: true, // Ensures only UserAssets with matching Users are included
                    include: [
                        {
                            model: UserPosition,
                            attributes: [],
                            required: true, // Ensures UserPositions must match the department filter
                            where: {
                                department: department // Matching the specified department
                            }
                        }
                    ]
                }
            ]
        });
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

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
        console.log('Assigned User ID:', details.userAsset.userId);
        // Wrap the userId in an object or array
        res.send({ userId: details.userAsset.user.name });
      } else {
        console.log('No user found for the given asset ID.');
        res.send({ userId: null }); // Use a consistent object response
      }
    } catch (error) {
      console.error('Error fetching assigned user:', error);
      res.status(500).send({ error: 'An error occurred while fetching the assigned user.' });
    }
});
  
module.exports = router;