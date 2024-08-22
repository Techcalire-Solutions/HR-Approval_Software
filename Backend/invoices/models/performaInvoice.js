const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');

const PerformaInvoice = sequelize.define('performaInvoice',{
    piNo : {type : DataTypes.STRING, allowNull : false},
    filename : {type : DataTypes.STRING},
    url : {type : DataTypes.STRING},
    bankSlip : {type : DataTypes.STRING},
    status: {type : DataTypes.STRING, defaultValue: 'Generated'},
    salesPersonId :{type : DataTypes.INTEGER },
    kamId : {type : DataTypes.INTEGER},
    amId: {type : DataTypes.INTEGER},
    accountantId : {type : DataTypes.INTEGER},
    count: {type : DataTypes.INTEGER, defaultValue: 1}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasMany(PerformaInvoice, { as: 'salesPerson', foreignKey: 'salesPersonId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'salesPerson', foreignKey: 'salesPersonId' });

User.hasMany(PerformaInvoice, { as: 'kam', foreignKey: 'kamId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'kam', foreignKey: 'kamId' });

User.hasMany(PerformaInvoice, { as: 'am', foreignKey: 'amId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'am', foreignKey: 'amId' });


User.hasMany(PerformaInvoice ,{as: 'accountant', foreignKey : 'accountantId', onUpdate : 'CASCADE'})
PerformaInvoice.belongsTo(User,{as: 'accountant', foreignKey : 'accountantId'})

PerformaInvoice.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});


module.exports = PerformaInvoice;


