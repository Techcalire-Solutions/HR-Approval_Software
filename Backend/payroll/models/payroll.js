const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const Payroll = sequelize.define('payroll', {
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
}, {
  freezeTableName: true,
  timestamps: true,
});

Payroll.sync({ alter: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });
  User.hasMany(Payroll, {foreignKey: 'userId', onUpdate: 'CASCADE' });
  Payroll.belongsTo(User, {foreignKey: 'userId' });
module.exports = Payroll;
