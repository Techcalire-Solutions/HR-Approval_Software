/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const ExcelLog = sequelize.define('excelLog',{
    invoiceNo: {type : DataTypes.STRING},
    fromDate : {type : DataTypes.DATEONLY},
    toDate:{type : DataTypes.DATEONLY},
    status : {type : DataTypes.STRING, defaultValue : true},
    userId: {type : DataTypes.INTEGER},
    downloadedDate : {type : DataTypes.DATEONLY, allowNull: false},
    fileName: {type : DataTypes.STRING, allowNull: false},
    type: {type : DataTypes.STRING},
},
{
    freezeTableName: true,
    timestamps : false
})

ExcelLog.sync({ alter: true })
  .then(() => console.log("ExcelLog table Sync"))
  .catch((err) => console.log("Error syncing table ExcelLog:", err));


module.exports = ExcelLog;


