/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const UserPersonal = sequelize.define('userPersonal', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  dateOfJoining: { type: DataTypes.DATEONLY },
  confirmationDate: { type: DataTypes.DATEONLY },
  bloodGroup: { type: DataTypes.STRING},
  emergencyContactNo: { type: DataTypes.STRING },
  emergencyContactName: { type: DataTypes.STRING },
  emergencyContactRelation: { type: DataTypes.STRING },
  maritalStatus: { type: DataTypes.STRING, allowNull: false },
  dateOfBirth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING, allowNull: false },
  parentName: { type: DataTypes.STRING },
  spouseName: { type: DataTypes.STRING },
  referredBy: { type: DataTypes.STRING },
  reportingMangerId: { type: DataTypes.INTEGER },
  spouseContactNo: { type: DataTypes.STRING },
  parentContactNo: { type: DataTypes.STRING },
  motherName: { type: DataTypes.STRING },
  motherContactNo: { type: DataTypes.STRING },
  temporaryAddress: { type: DataTypes.TEXT},
  permanentAddress: { type: DataTypes.TEXT},
  qualification: { type: DataTypes.STRING },
  experience: { type: DataTypes.STRING}
},
{
  freezeTableName: true,
  timestamps: true
});

User.hasMany(UserPersonal, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
UserPersonal.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserPersonal, { foreignKey: 'reportingMangerId', onUpdate: 'CASCADE' });
UserPersonal.belongsTo(User, { foreignKey: 'reportingMangerId', as: 'manager'  });

// Synchronizing the model with the database
UserPersonal.sync({ alter: true })
  .then(() => console.log("User table synced successfully"))
  .catch((err) => console.log("Error syncing User table:", err));

module.exports = UserPersonal;
