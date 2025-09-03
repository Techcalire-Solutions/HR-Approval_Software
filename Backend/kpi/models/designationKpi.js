/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')
const Designation = require('../../users/models/designation')
const Kpi = require('./kpi')

const DesignationKpi = sequelize.define('designationKpi',{
    designationId: { type: DataTypes.INTEGER, allowNull: false },
    kpiId: { type: DataTypes.INTEGER, allowNull: false }
},{
    freezeTableName :true,
    timestamps : true
})

Designation.hasMany(DesignationKpi,{foreignKey : 'designationId', onUpdate : 'CASCADE'})
DesignationKpi.belongsTo(Designation)

Kpi.hasMany(DesignationKpi,{foreignKey : 'kpiId', onUpdate : 'CASCADE'})
DesignationKpi.belongsTo(Kpi)

DesignationKpi.sync({ alter:true }).then(()=>console.log)

module.exports = DesignationKpi