/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Designation = sequelize.define('designation',{
    designationName : {type : DataTypes.STRING, allowNull : false},
    abbreviation:{type : DataTypes.STRING, allowNull : false},
},
{
    freezeTableName: true,
    timestamps : false
})

Designation.sync({ alter: true })
  .then(() => console.log("Designation table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = Designation;


