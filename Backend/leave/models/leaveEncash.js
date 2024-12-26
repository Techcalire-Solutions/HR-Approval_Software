const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const LeaveEncash = sequelize.define('leaveEncash', {
    userId:{type: DataTypes.STRING, allowNull: true},
    leaveTypeId: {type: DataTypes.STRING, allowNull: true},
    encashedDays:{type: DataTypes.STRING, allowNull: true},
    amount:{type: DataTypes.STRING, allowNull: true},
    encashDate:{type: DataTypes.STRING, allowNull: true},
}, {
  freezeTableName: true,
  timestamps: true,
});




LeaveEncash.sync({ alter: true })
  .then(() => console.log('LeaveEncash table synchronized successfully'))
  .catch((error) => console.error('Error synchronizing LeaveEncash table:', error));



module.exports = LeaveEncash;
