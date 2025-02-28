
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const BackUpLog = sequelize.define('backUpLog',{
    tableName : {type : DataTypes.STRING, allowNull : false},
    backUpTime:{type : DataTypes.DATE, allowNull : false},
    url: {type : DataTypes.TEXT, allowNull : false}
},
{
    freezeTableName: true,
    timestamps : false
})

BackUpLog.sync({ force: true })
  .then(() => console.log("BackUpLog table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = BackUpLog;


