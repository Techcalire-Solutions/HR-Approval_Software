/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');

const PayrollLog = sequelize.define('payrollLog', {
    userId: { type: DataTypes.INTEGER },
    oldIncome: { type: DataTypes.FLOAT},
    newIncome: { type: DataTypes.FLOAT},
    updatedDate: { type: DataTypes.DATE}
}, {
  freezeTableName: true,
  timestamps: true,
});

PayrollLog.sync({ alter: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });

User.hasMany(PayrollLog, {foreignKey: 'userId', onUpdate: 'CASCADE' });
PayrollLog.belongsTo(User, {foreignKey: 'userId' });

module.exports = PayrollLog;
