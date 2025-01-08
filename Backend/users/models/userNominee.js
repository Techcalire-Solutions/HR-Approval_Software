/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const UserNominee = sequelize.define('usernNominee',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    nomineeName:{type : DataTypes.STRING, allowNull : false},
    nomineeContactNumber : {type : DataTypes.STRING},
    nomineeRelation:{type : DataTypes.STRING},
    aadhaarNumber:{type : DataTypes.STRING},
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasMany(UserNominee, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserNominee.belongsTo(User);

UserNominee.sync({ alter: true })
  .then(() => console.log("UserNominee table Sync"))
  .catch((err) => console.log("Error syncing table UserNominee:", err));


module.exports = UserNominee;


