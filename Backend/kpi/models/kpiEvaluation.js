/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')
const Kpi = require('./kpi')
const User = require('../../users/models/user');

const KpiEvaluation = sequelize.define('kpiEvaluation',{
    evaluationMonth: { type: DataTypes.DATEONLY, allowNull: false },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: false, validate: { min: 0, max: 100 }  },
    comments: { type: DataTypes.TEXT },
    kpiId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    evaluatedBy: { type: DataTypes.INTEGER, allowNull: false },
},{
    freezeTableName :true,
    timestamps : true
})

Kpi.hasMany(KpiEvaluation,{foreignKey : 'kpiId', onUpdate : 'CASCADE'})
KpiEvaluation.belongsTo(Kpi)

User.hasMany(KpiEvaluation,{foreignKey : 'userId', onUpdate : 'CASCADE'})
KpiEvaluation.belongsTo(User)

User.hasMany(KpiEvaluation,{foreignKey : 'evaluatedBy', as: 'EvaluatedBy', onUpdate : 'CASCADE'})
KpiEvaluation.belongsTo(User)

KpiEvaluation.sync({ alter:true }).then(()=>console.log)

module.exports = KpiEvaluation