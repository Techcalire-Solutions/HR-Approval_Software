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
  ot: { type: DataTypes.DECIMAL(10, 2) },
  incentive: { type: DataTypes.DECIMAL(10, 2) },
  payOut: { type: DataTypes.DECIMAL(10, 2) },
  pfDeduction: { type: DataTypes.DECIMAL(10, 2) },
  insurance: { type: DataTypes.DECIMAL(10, 2) },
  tds: { type: DataTypes.DECIMAL(10, 2) },
  advanceAmount: { type: DataTypes.DECIMAL(10, 2) },
  leaveDays: { type: DataTypes.DECIMAL(10, 2) },
  leaveDeduction: { type: DataTypes.DECIMAL(10, 2) },
  incentiveDeduction: { type: DataTypes.DECIMAL(10, 2) },
  
  toPay: { type: DataTypes.DECIMAL(10, 2) },
  payedFor: { type: DataTypes.STRING },
  payedAt: { type: DataTypes.DATEONLY },
  daysInMonth: { type: DataTypes.INTEGER},
  status: { type: DataTypes.STRING, defaultValue: 'Added' },
}, {
  freezeTableName: true,
  timestamps: true,
});

MonthlyPayroll.sync({ force: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });

User.hasMany(MonthlyPayroll, {foreignKey: 'userId', onUpdate: 'CASCADE' });
MonthlyPayroll.belongsTo(User, {foreignKey: 'userId' });

module.exports = MonthlyPayroll;
