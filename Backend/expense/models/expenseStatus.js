/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Expense = require('./expense');

const ExpenseStatus = sequelize.define('expensestatus',{
    expenseId : {type : DataTypes.INTEGER, allowNull : false},
    status : {type : DataTypes.STRING},
    date : {type : DataTypes.DATE},
    remarks : {type : DataTypes.TEXT},
    count: {type : DataTypes.INTEGER, defaultValue : 1}
},

{
    freezeTableName: true,
    timestamps : true
})

Expense.hasMany(ExpenseStatus, { foreignKey: 'expenseId', onUpdate: 'CASCADE' });
ExpenseStatus.belongsTo(Expense, { foreignKey: 'expenseId' });


ExpenseStatus.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});


module.exports = ExpenseStatus;