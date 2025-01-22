/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db');
const Assets = require('./asset');
const UserAssets = require('./userAsset');
const UserAssetsDetails = sequelize.define('userAssetsDetails',{
    assetId: { type: DataTypes.INTEGER, allowNull: false },
    userAssetId: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT }, 
    returnDate: { type: DataTypes.DATEONLY },
    assignedDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.BOOLEAN },
},{
    freezeTableName :true,
    timestamps : true
})

Assets.hasMany(UserAssetsDetails, { foreignKey: 'assetId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserAssetsDetails.belongsTo(Assets);

UserAssets.hasMany(UserAssetsDetails, { foreignKey: 'userAssetId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserAssetsDetails.belongsTo(UserAssets);

 UserAssetsDetails.sync({alter:true})
.then(()=>console.log)

module.exports = UserAssetsDetails