const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Role = require('./role');
const User = require('./user');

const UserPersonal = sequelize.define('userPersonal', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  empNo: { type: DataTypes.STRING, allowNull: false },
  dateOfJoining: { type: DataTypes.DATEONLY },
  probationPeriod: { type: DataTypes.STRING, allowNull: false },
  confirmationDate: { type: DataTypes.DATEONLY },
  isTemporary: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },

  maritalStatus: { type: DataTypes.STRING, allowNull: false },
  dateOfBirth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING, allowNull: false },
  parentName: { type: DataTypes.STRING },
  spouseName: { type: DataTypes.STRING },
  referredBy: { type: DataTypes.STRING },
  reportingManger: { type: DataTypes.INTEGER }
},
{
  freezeTableName: true,
  timestamps: true
});

User.hasMany(UserPersonal, { foreignKey: 'userId', onUpdate: 'CASCADE' });
UserPersonal.belongsTo(User);

// Synchronizing the model with the database
UserPersonal.sync({ alter: true })
  .then(() => console.log("User table synced successfully"))
  .catch((err) => console.log("Error syncing User table:", err));

module.exports = UserPersonal;
