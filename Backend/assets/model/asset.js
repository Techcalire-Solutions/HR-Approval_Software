/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db');

const Assets = sequelize.define('assets',{     
   assetName: { type: DataTypes.STRING, allowNull: false },
   identifierType: { type: DataTypes.STRING, allowNull: false },
   identificationNumber: { type: DataTypes.STRING, allowNull: false },
   description: { type: DataTypes.STRING },
   purchasedDate: { type: DataTypes.DATEONLY },
   purchasedFrom: { type: DataTypes.STRING  },
   invoiceNo: { type: DataTypes.STRING },
   assignedStatus: { type: DataTypes.BOOLEAN, defaultValue: false },
},{
   freezeTableName :true,
   timestamps : true
})

Assets.sync({alter:true}).then(()=>console.log)

module.exports = Assets