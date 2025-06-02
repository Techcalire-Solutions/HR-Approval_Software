/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db');
const UserAssets = require('./userAsset');
const User = require('../../users/models/user');
const UserAssetsDetails = sequelize.define('userAssetsDetails',{
    userAssetId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT },
    returnDate: { type: DataTypes.DATEONLY },
    assignedDate: { type: DataTypes.DATEONLY },
},{
    freezeTableName :true,
    timestamps : true
})

User.hasMany(UserAssetsDetails, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserAssetsDetails.belongsTo(User);

UserAssets.hasMany(UserAssetsDetails, { foreignKey: 'userAssetId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserAssetsDetails.belongsTo(UserAssets);

UserAssetsDetails.sync({alter:true})
.then(()=>console.log)

module.exports = UserAssetsDetails