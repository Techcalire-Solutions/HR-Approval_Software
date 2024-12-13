/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');

const AdvanceSalary = sequelize.define('advanceSalary', {
  userId: {type : DataTypes.INTEGER, allowNull: false },
  scheme: {type : DataTypes.STRING, allowNull: false},
  amount: {type : DataTypes.STRING, allowNull: false},
  reason: {type : DataTypes.STRING},
  duration: {type : DataTypes.INTEGER, allowNull: false},
  monthlyPay: {type : DataTypes.FLOAT, allowNull: false},
  status: {type : DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
  completed: {type : DataTypes.INTEGER, defaultValue: 0},
  completedDate: {type : DataTypes.DATEONLY},
  closeNote: {type : DataTypes.STRING}
}, {
  freezeTableName: true,
  timestamps: true,
});

AdvanceSalary.sync({ alter: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });

  User.hasMany(AdvanceSalary, {foreignKey: 'userId', onUpdate: 'CASCADE' });
  AdvanceSalary.belongsTo(User, {foreignKey: 'userId' });
  
module.exports = AdvanceSalary;
