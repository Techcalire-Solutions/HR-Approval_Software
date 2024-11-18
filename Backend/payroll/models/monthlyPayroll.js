/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const MonthlyPayroll = sequelize.define('monthlyPayroll', {
  userId: { type: DataTypes.INTEGER },

  basic: { type: DataTypes.DECIMAL(10, 2) },
  hra: { type: DataTypes.DECIMAL(10, 2) },
  conveyanceAllowance: { type: DataTypes.DECIMAL(10, 2) },
  lta: { type: DataTypes.DECIMAL(10, 2) },
  specialAllowance: { type: DataTypes.DECIMAL(10, 2) },
  grossSalary: { type: DataTypes.DECIMAL(10, 2) },

  pf: { type: DataTypes.DECIMAL(10, 2) },
  insurance: { type: DataTypes.DECIMAL(10, 2) },
  gratuity: { type: DataTypes.DECIMAL(10, 2) },
  employeeContribution: { type: DataTypes.DECIMAL(10, 2) },
  netPay: { type: DataTypes.DECIMAL(10, 2) },
  advanceAmount: { type: DataTypes.DECIMAL(10, 2) },
  leaveDays: { type: DataTypes.DECIMAL(10, 2) },

  payedFor: { type: DataTypes.STRING },
  payedAt: { type: DataTypes.DATEONLY },
}, {
  freezeTableName: true,
  timestamps: true,
});

MonthlyPayroll.sync({ alter: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });
  User.hasMany(MonthlyPayroll, {foreignKey: 'userId', onUpdate: 'CASCADE' });
  MonthlyPayroll.belongsTo(User, {foreignKey: 'userId' });

module.exports = MonthlyPayroll;
