/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db');

const Assets = sequelize.define('assets',{     
   assetName: { type: DataTypes.STRING, allowNull: false },
   assetNumber: { type: DataTypes.STRING },
   assetHandoverNumber: { type: DataTypes.STRING },
   serialNumber: { type: DataTypes.STRING },
   noOfItems: { type: DataTypes.INTEGER },
   description: { type: DataTypes.STRING }
},{
   freezeTableName :true,
   timestamps : true
})

Assets.sync({alter:true}).then(()=>console.log)

module.exports = Assets