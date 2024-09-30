const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const UserDocument = sequelize.define('userdocument',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    docName:{type : DataTypes.STRING, allowNull : false},
    docUrl : {type : DataTypes.STRING}
},
{
    freezeTableName: true,
    timestamps : false
})

UserDocument.sync({ alter: true })
  .then(() => console.log("UserDocument table Sync"))
  .catch((err) => console.log("Error syncing table UserDocument:", err));


module.exports = UserDocument;


