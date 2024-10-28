const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');

const AdvanceSalary = sequelize.define('advanceSalary', {
  userId: { type: DataTypes.INTEGER },

  scheme: {type : DataTypes.STRING},
  amount: {type : DataTypes.STRING},
  reason: {type : DataTypes.STRING},

 
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
