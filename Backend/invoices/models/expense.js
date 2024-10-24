const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const Company = require('../../invoices/models/company');

const Expense = sequelize.define('expense',{
    exNo : {type : DataTypes.STRING, allowNull : false},
    url: { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
    bankSlip : {type : DataTypes.STRING},
    status: {type : DataTypes.STRING, defaultValue: 'Generated'},
    userId :{type : DataTypes.INTEGER },
    kamId : {type : DataTypes.INTEGER, allowNull : true},
    amId: {type : DataTypes.INTEGER, allowNull : true},
    accountantId : {type : DataTypes.INTEGER, allowNull : true},
    count: {type : DataTypes.INTEGER, defaultValue: 1},
    notes:  { type: DataTypes.STRING },
    expenseType: {type : DataTypes.STRING}
},

{
    freezeTableName: true,
    timestamps : true
})

// User.hasMany(Expense, { as: 'user', foreignKey: 'userId', onUpdate: 'CASCADE' });
// Expense.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// User.hasMany(Expense, { as: 'kam', foreignKey: 'kamId', onUpdate: 'CASCADE' });
// Expense.belongsTo(User, { as: 'kam', foreignKey: 'kamId' });

// User.hasMany(Expense, { as: 'am', foreignKey: 'amId', onUpdate: 'CASCADE' });
// Expense.belongsTo(User, { as: 'am', foreignKey: 'amId' });


// User.hasMany(Expense ,{as: 'accountant', foreignKey : 'accountantId', onUpdate : 'CASCADE'})
// Expense.belongsTo(User,{as: 'accountant', foreignKey : 'accountantId'})


Expense.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});


module.exports = Expense;


