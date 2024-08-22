const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const PerformaInvoice = require('./performaInvoice');

const PerformaInvoiceStatus = sequelize.define('performaInvoiceStatus',{
    performaInvoiceId : {type : DataTypes.INTEGER, allowNull : false},
    status : {type : DataTypes.STRING},
    date : {type : DataTypes.DATE},
    remarks : {type : DataTypes.STRING},
    count: {type : DataTypes.INTEGER, defaultValue : 1}
},
{
    freezeTableName: true,
    timestamps : false
})

PerformaInvoice.hasMany(PerformaInvoiceStatus, {foreignKey : 'performaInvoiceId'})
PerformaInvoiceStatus.belongsTo(PerformaInvoice);

PerformaInvoiceStatus.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});

module.exports = PerformaInvoiceStatus;


