/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const Monthend = sequelize.define('monthend', {
  userId: { type: DataTypes.INTEGER },
  payedMonth: { type: DataTypes.STRING}, 
  date: { type: DataTypes.DATEONLY} ,
  basic: { type: DataTypes.DECIMAL(10, 2) },
  hra: { type: DataTypes.DECIMAL(10, 2) },
  conveyanceAllowance: { type: DataTypes.DECIMAL(10, 2) },
  lta: { type: DataTypes.DECIMAL(10, 2) },
  specialAllowance: { type: DataTypes.DECIMAL(10, 2) },
  grossSalary: { type: DataTypes.DECIMAL(10, 2) },

  pf: { type: DataTypes.DECIMAL(10, 2) },
  insurance: { type: DataTypes.DECIMAL(10, 2) },
  gratuity: { type: DataTypes.DECIMAL(10, 2) },
}, {
  freezeTableName: true,
  timestamps: true,
});

Monthend.sync({ alter: true })
  .then(() => {
    console.log('Tables synced successfully.');
  })
  .catch(err => {
    console.error('Error syncing tables:', err);
  });

User.hasMany(Monthend, {foreignKey: 'userId', onUpdate: 'CASCADE' });
Monthend.belongsTo(User, {foreignKey: 'userId' });

module.exports = Monthend;
