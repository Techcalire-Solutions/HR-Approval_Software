const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Role = require('./role');

const User = sequelize.define('user', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  teamId : { type: DataTypes.INTEGER, allowNull: true },
  teamMemberId : { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  userImage: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING },
},
{
  freezeTableName: true,
  timestamps: true
});

Role.hasMany(User, { foreignKey: 'roleId', onUpdate: 'CASCADE' });
User.belongsTo(Role);


// User.sync({ alter: true })
//   .then(() => console.log("User table synced successfully"))
//   .catch((err) => console.log("Error syncing User table:", err));

module.exports = User;
