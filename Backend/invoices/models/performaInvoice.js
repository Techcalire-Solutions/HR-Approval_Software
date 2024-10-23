const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');
const Company = require('../../invoices/models/company');

const PerformaInvoice = sequelize.define('performaInvoice',{
    piNo : {type : DataTypes.STRING, allowNull : false},
    filename : {type : DataTypes.STRING},
    url: { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: true },
    // url : {type : DataTypes.ARRAY(DataTypes.STRING)},
    bankSlip : {type : DataTypes.STRING},
    status: {type : DataTypes.STRING, defaultValue: 'Generated'},
    salesPersonId :{type : DataTypes.INTEGER },
    kamId : {type : DataTypes.INTEGER, allowNull : true},
    amId: {type : DataTypes.INTEGER, allowNull : true},
    accountantId : {type : DataTypes.INTEGER, allowNull : true},
    count: {type : DataTypes.INTEGER, defaultValue: 1},

    supplierId: { type: DataTypes.INTEGER},
    supplierSoNo: { type: DataTypes.STRING },
    supplierPoNo: { type: DataTypes.STRING },
    supplierCurrency: { type: DataTypes.STRING },
    supplierPrice: { type: DataTypes.STRING },
    
    customerId: { type: DataTypes.INTEGER, allowNull : true},
    customerSoNo: { type: DataTypes.STRING },
    customerPoNo: { type: DataTypes.STRING },
    customerCurrency: { type: DataTypes.STRING },
    poValue: { type: DataTypes.STRING },
    paymentMode:  { type: DataTypes.STRING },


    purpose: { type: DataTypes.STRING },
    addedById: { type: DataTypes.INTEGER },
    notes:  { type: DataTypes.STRING }
},

{
    freezeTableName: true,
    timestamps : true
})

User.hasMany(PerformaInvoice, { as: 'salesPerson', foreignKey: 'salesPersonId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'salesPerson', foreignKey: 'salesPersonId' });

User.hasMany(PerformaInvoice, { as: 'kam', foreignKey: 'kamId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'kam', foreignKey: 'kamId' });

User.hasMany(PerformaInvoice, { as: 'am', foreignKey: 'amId', onUpdate: 'CASCADE' });
PerformaInvoice.belongsTo(User, { as: 'am', foreignKey: 'amId' });


User.hasMany(PerformaInvoice ,{as: 'accountant', foreignKey : 'accountantId', onUpdate : 'CASCADE'})
PerformaInvoice.belongsTo(User,{as: 'accountant', foreignKey : 'accountantId'})

User.hasMany(PerformaInvoice ,{as: 'addedBy', foreignKey : 'addedById', onUpdate : 'CASCADE'})
PerformaInvoice.belongsTo(User,{as: 'addedBy', foreignKey : 'addedById'})

// Supplier association
Company.hasMany(PerformaInvoice, {as: 'suppliers', foreignKey: 'supplierId', onUpdate: 'CASCADE'});
PerformaInvoice.belongsTo(Company, {as: 'suppliers',foreignKey: 'supplierId',onUpdate: 'CASCADE'});

// Customer association
Company.hasMany(PerformaInvoice, {as: 'customers',foreignKey: 'customerId',onUpdate: 'CASCADE'});
PerformaInvoice.belongsTo(Company, {as: 'customers',foreignKey: 'customerId',onUpdate: 'CASCADE'});

  


PerformaInvoice.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});


module.exports = PerformaInvoice;


