const express = require('express');
const  router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAssetDetails = require('../model/userAssetDetails');
const User = require('../../users/models/user');
const UserAssets = require('../model/userAsset');
const sequelize = require('../../utils/db');

router.post('/', authenticateToken, async (req, res) => {
  const { userId, assets } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const updatedAssets = [];

    for (const asset of assets) {
      const { assetId, assignedDate } = asset;

      // 1. Create UserAssetDetails record
      await UserAssetDetails.create(
        {
          userId,
          userAssetId: assetId,
          assignedDate,
        },
        { transaction }
      );

      // 2. Update UserAssets.assignedStatus to true
      await UserAssets.update(
        { assignedStatus: true },
        {
          where: { id: assetId },
          transaction,
        }
      );

      // 3. Fetch the updated asset to send back
      const updatedAsset = await UserAssets.findOne({
        where: { id: assetId },
        transaction,
      });

      updatedAssets.push(updatedAsset);
    }

    await transaction.commit();
    res.json({ assets: updatedAssets });

  } catch (error) {
    await transaction.rollback();
    console.error("Error saving assets:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
    try {
        const ua = await UserAssetDetails.findAll({
            where: {userId: req.params.id},
            include: [
                { model: User, attributes: ['name']}, 
                { model: UserAssets }
            ]
        });
        console.log(ua, "asset for user......");
        
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

router.patch('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { assets: requestedAssets } = req.body;
  
  // Validate request body
  if (!requestedAssets || !Array.isArray(requestedAssets)) {
    return res.json({
      success: false,
      message: 'Assets array is required in the request body'
    });
  }

  // Check for duplicate assetIds in the request
  const uniqueRequestedAssets = [];
  const seenAssetIds = new Set();
  for (const asset of requestedAssets) {
    if (!asset.assetId) {
      return res.json({
        success: false,
        message: 'assetId is required for all assets'
      });
    }
    if (seenAssetIds.has(asset.assetId)) {
      return res.json({
        success: false,
        message: `Duplicate assetId found in request: ${asset.assetId}`
      });
    }
    seenAssetIds.add(asset.assetId);
    uniqueRequestedAssets.push(asset);
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Get current assets from database
    const currentAssets = await UserAssetDetails.findAll({
      where: { userId },
      transaction,
    });
    
    // 2. Extract IDs for comparison
    const currentAssetIds = currentAssets.map(a => a.userAssetId);
    const requestedAssetIds = uniqueRequestedAssets.map(a => a.assetId);
    
    // 3. Identify changes
    const assetsToAdd = uniqueRequestedAssets.filter(a => {
      return !currentAssetIds.includes(a.assetId);
    });

    const assetsToRemove = currentAssets.filter(
      a => !requestedAssetIds.includes(a.userAssetId)
    );
    
    // 4. Process additions with validation
    for (const asset of assetsToAdd) {
      if (!asset.assignedDate) {
        throw new Error('assignedDate is required for new assets');
      }

      // Check if asset exists in UserAssets table
      const existingAsset = await UserAssets.findOne({
        where: { id: asset.assetId },
        transaction,
      });

      if (!existingAsset) {
        throw new Error(`Asset with ID ${asset.assetId} not found`);
      }

      // Check if asset is already assigned to another user
      if (existingAsset.assignedStatus) {
        const assignedToUser = await UserAssetDetails.findOne({
          where: { userAssetId: asset.assetId },
          transaction,
        });
        
        if (assignedToUser && assignedToUser.userId !== userId) {
          throw new Error(`Asset with ID ${asset.assetId} is already assigned to another user`);
        }
      }

      // Create new assignment
      await UserAssetDetails.create(
        {
          userId,
          userAssetId: asset.assetId,
          assignedDate: asset.assignedDate,
        },
        { transaction }
      );

      // Update assignedStatus to true
      await UserAssets.update(
        { assignedStatus: true },
        {
          where: { id: asset.assetId },
          transaction,
        }
      );
    }

    // 5. Process removals
    for (const asset of assetsToRemove) {
      await UserAssetDetails.destroy({
        where: {
          userId,
          userAssetId: asset.userAssetId,
        },
        transaction,
      });

      await UserAssets.update(
        { assignedStatus: false },
        {
          where: { id: asset.userAssetId },
          transaction,
        }
      );
    }

    // 6. Process updates (for assignedDate changes)
    // for (const asset of uniqueRequestedAssets) {
    //   if (currentAssetIds.includes(asset.assetId)) {
    //     if (!asset.assignedDate) {
    //       throw new Error('assignedDate is required for updates');
    //     }
        
    //     await UserAssetDetails.update(
    //       { assignedDate: asset.assignedDate },
    //       {
    //         where: {
    //           userId,
    //           userAssetId: asset.assetId,
    //         },
    //         transaction,
    //       }
    //     );
    //   }
    // }
// 6. Process updates (for assignedDate changes)
for (const asset of uniqueRequestedAssets) {
  if (currentAssetIds.includes(asset.assetId)) {
    if (!asset.assignedDate) {
      throw new Error('assignedDate is required for updates');
    }
    
        const existingAssignment = await UserAssetDetails.findOne({
          where: {
            userId,
            userAssetId: asset.assetId,
          },
          transaction,
        });

        if (existingAssignment.assignedDate !== asset.assignedDate) {
          // Update assignedDate
          await UserAssetDetails.update(
            { assignedDate: asset.assignedDate },
            {
              where: {
                userId,
                userAssetId: asset.assetId,
              },
              transaction,
            }
          );

          // (Optional) Explicitly maintain assignedStatus as true
          await UserAssets.update(
            { assignedStatus: true },
            {
              where: { id: asset.assetId },
              transaction,
            }
          );
        }
  }
}
    // 7. Return updated state
    const updatedAssets = await UserAssetDetails.findAll({
      where: { userId },
      include: [{ model: UserAssets }],
      transaction,
    });
    
    await transaction.commit();
    res.json({
      success: true,
      message: 'Assets synchronized successfully',
      assets: updatedAssets,
    });

  } catch (error) {
    await transaction.rollback();
    res.json({ success: false, message: error.message });
  }
});

router.patch('/return-asset/:assetId', authenticateToken, async (req, res) => {
  const { assetId } = req.params;
  const { returnDate, note } = req.body;

  // Validate request parameters and body
  if (!assetId) {
    return res.status(400).json({
      success: false,
      message: 'Asset ID is required in the URL parameters'
    });
  }

  if (!returnDate) {
    return res.status(400).json({
      success: false,
      message: 'Return date is required in the request body'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Find the asset record
    const assetRecord = await UserAssetDetails.findOne({
      where: { id: assetId },
      transaction,
    });

    if (!assetRecord) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Asset record not found'
      });
    }

    // 2. Update the asset details
    assetRecord.returnDate = returnDate;
    assetRecord.note = note || null; // Set to null if notes is undefined
    
    await assetRecord.save({ transaction });

    // 3. Update the main asset status to available (false)
    await UserAssets.update(
      { assignedStatus: false },
      {
        where: { id: assetRecord.userAssetId },
        transaction,
      }
    );

    // 4. Commit transaction and return updated asset
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Asset returned successfully',
      data: {
        assetDetails: assetRecord,
        assetId: assetId
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error returning asset:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to return asset'
    });
  }
});

module.exports = router;