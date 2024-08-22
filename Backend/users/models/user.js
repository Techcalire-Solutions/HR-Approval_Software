const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Role = require('./role');

const User = sequelize.define('user', {
  name: {type: DataTypes.STRING, allowNull: false},
  email:{type: DataTypes.STRING, allowNull: false},
  phoneNumber: {type: DataTypes.STRING},
  password: {type: DataTypes.STRING, allowNull: false},
  roleId: {type: DataTypes.INTEGER, allowNull: false},
  status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true}
},
{
  freezeTableName: true
});

Role.hasMany(User,{foreignKey : 'roleId', onUpdate : 'CASCADE'})
User.belongsTo(Role)

module.exports = User