/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Role = require('./role');

const User = sequelize.define('user', {
  name: { type: DataTypes.STRING, allowNull: false },
  empNo: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  userImage: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING },
  director: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},

  paswordReset: { type: DataTypes.BOOLEAN, defaultValue: false},
  isTemporary: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  separated: { type: DataTypes.BOOLEAN, defaultValue: false},
  separationNote: { type: DataTypes.TEXT},
  separationDate: { type: DataTypes.DATEONLY}
},
{
  freezeTableName: true,
  timestamps: true
});

Role.hasMany(User, { foreignKey: 'roleId', onUpdate: 'CASCADE' });
User.belongsTo(Role);


User.sync({ alter: true })
  .then(() => console.log("User table synced successfully"))
  .catch((err) => console.log("Error syncing User table:", err));

module.exports = User;
