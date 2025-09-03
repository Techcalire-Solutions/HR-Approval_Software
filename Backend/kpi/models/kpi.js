/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Kpi = sequelize.define('kpi',{
    parameter : {type : DataTypes.STRING, allowNull : false},
},
{
    freezeTableName: true,
    timestamps : false
})

Kpi.sync({ alter: true })
  .then(() => console.log("Kpi table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = Kpi;


