/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const UserQualification = sequelize.define('userQualification',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    qualification : { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
    experience : { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
},
{
    freezeTableName: true,
    timestamps : false
})


User.hasOne(UserQualification, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserQualification.belongsTo(User, { foreignKey: 'userId' });

UserQualification.sync({ alter: true })
  .then(() => console.log("UserQualification table Sync"))
  .catch((err) => console.log("Error syncing table UserQualification:", err));


module.exports = UserQualification;


