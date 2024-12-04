/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const UserDocument = sequelize.define('userdocument',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    docName:{type : DataTypes.STRING, allowNull : false},
    docUrl : {type : DataTypes.STRING}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasMany(UserDocument, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserDocument.belongsTo(User);

UserDocument.sync({ alter: true })
  .then(() => console.log("UserDocument table Sync"))
  .catch((err) => console.log("Error syncing table UserDocument:", err));


module.exports = UserDocument;


