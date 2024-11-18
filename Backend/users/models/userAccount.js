/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../models/user');

const UserAccount = sequelize.define('useraccount',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    accountNo : {type : DataTypes.STRING, allowNull : false},
    ifseCode : {type : DataTypes.STRING, allowNull : false},
    paymentFrequency : {type : DataTypes.STRING, allowNull : false},
    modeOfPayment : {type : DataTypes.STRING, allowNull : false},
    branchName : {type : DataTypes.STRING}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasOne(UserAccount, { foreignKey: 'userId', onUpdate: 'CASCADE' });
UserAccount.belongsTo(User, { foreignKey: 'userId', as: 'manager'  });

UserAccount.sync({ alter: true })
  .then(() => console.log("UserAccount table Sync"))
  .catch((err) => console.log("Error syncing table UserAccount:", err));


module.exports = UserAccount;


