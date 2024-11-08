/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Company = sequelize.define('company',{
    companyName: {type : DataTypes.STRING, unique: true},
    code:{type: DataTypes.STRING},
    contactPerson: {type : DataTypes.STRING},
    designation:{type : DataTypes.STRING},
    email:{type : DataTypes.STRING},
    website: {type : DataTypes.STRING},
    phoneNumber:{type : DataTypes.STRING},
    address1:{type : DataTypes.STRING},
    address2:{type : DataTypes.STRING},
    city:{type : DataTypes.STRING},
    country:{type : DataTypes.STRING},
    state:{type : DataTypes.STRING},
    zipcode:{type : DataTypes.STRING},
    linkedIn:{type : DataTypes.STRING},
    remarks:{type : DataTypes.STRING},
    customer: { type: DataTypes.BOOLEAN },
    supplier:{type:DataTypes.BOOLEAN}, 
  
},
{
    freezeTableName: true,
    timestamps : true
})
Company.sync({ alter: true }).then(() => {
    console.log('Tables synced successfully.');
}).catch(err => {
    console.error('Error syncing tables:', err);
});

module.exports = Company;