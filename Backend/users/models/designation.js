/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Role = require('./role');

const Designation = sequelize.define('designation',{
    designationName : {type : DataTypes.STRING, allowNull : false},
    abbreviation:{type : DataTypes.STRING, allowNull : false},
    roleId: {type : DataTypes.INTEGER, allowNull : true}
},
{
    freezeTableName: true,
    timestamps : false
})

Role.hasOne(Designation, { foreignKey: 'roleId', onUpdate: 'CASCADE' });
Designation.belongsTo(Role, { foreignKey: 'roleId', onUpdate: 'CASCADE' });

Designation.sync({ alter: true })
  .then(() => console.log("Designation table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = Designation;


