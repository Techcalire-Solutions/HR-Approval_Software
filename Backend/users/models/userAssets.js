/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db');
const User = require('./user');
   const UserAssets = sequelize.define('userAssets',{
      userId: { type: DataTypes.INTEGER, allowNull: false },
      assetCode: { type: DataTypes.STRING, allowNull: false},
      assets: { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
   },{
      freezeTableName :true,
      timestamps : true
   })

User.hasMany(UserAssets, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserAssets.belongsTo(User);

 UserAssets.sync({alter:true})
.then(()=>console.log)

module.exports = UserAssets