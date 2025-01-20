/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const UserEmail = sequelize.define('userEmail',{
    email : {type : DataTypes.STRING, allowNull : false},
    appPassword:{type : DataTypes.STRING, allowNull : false},
    userId : {type : DataTypes.INTEGER, allowNull : false},
    type: {type : DataTypes.STRING, allowNull : false}
},
{
    freezeTableName: true,
    timestamps : false
})

UserEmail.sync({ alter: true })
  .then(() => console.log("Role table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = UserEmail;


