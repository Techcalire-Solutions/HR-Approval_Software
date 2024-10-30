const { DataTypes, STRING } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const Company = require('../../invoices/models/company');

const Expense = sequelize.define('expense',{
    exNo : {type : DataTypes.STRING, allowNull : false},
    url: { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
    bankSlip : {type : DataTypes.STRING},
    status: {type : DataTypes.STRING, defaultValue: 'Generated'},
    userId :{type : DataTypes.INTEGER },
    amId: {type : DataTypes.INTEGER, allowNull : true},
    accountantId : {type : DataTypes.INTEGER, allowNull : true},
    count: {type : DataTypes.INTEGER, defaultValue: 1},
    notes:  { type: DataTypes.TEXT },
    totalAmount: {type : DataTypes.FLOAT, allowNull : false},
    currency: {type : STRING, allowNull : false}
},

{
    freezeTableName: true,
    timestamps : true
})

User.hasMany(Expense, { foreignKey: 'userId', onUpdate: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Expense, { as: 'manager', foreignKey: 'amId', onUpdate: 'CASCADE' });
Expense.belongsTo(User, { as: 'manager', foreignKey: 'amId' });


User.hasMany(Expense ,{as: 'ma', foreignKey : 'accountantId', onUpdate : 'CASCADE'})
Expense.belongsTo(User,{as: 'ma', foreignKey : 'accountantId'})


Expense.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});


module.exports = Expense;


