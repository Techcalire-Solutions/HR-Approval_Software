const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const UserAccount = sequelize.define('useraccount',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    accountNo : {type : DataTypes.STRING, allowNull : false},
    ifseCode : {type : DataTypes.STRING, allowNull : false},
    paymentFrequency : {type : DataTypes.STRING, allowNull : false},
    modeOfPayment : {type : DataTypes.STRING, allowNull : false}
},
{
    freezeTableName: true,
    timestamps : false
})

UserAccount.sync({ alter: true })
  .then(() => console.log("UserAccount table Sync"))
  .catch((err) => console.log("Error syncing table UserAccount:", err));


module.exports = UserAccount;


