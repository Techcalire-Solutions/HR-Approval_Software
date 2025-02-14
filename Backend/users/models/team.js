/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');


const Team = sequelize.define('team', {
    teamName: { type: DataTypes.STRING, allowNull: false }
}, { freezeTableName: true });

Team.sync({ alter: true })
  .then(() => console.log("Team table Sync"))
  .catch((err) => console.log("Error syncing table Team:", err));

module.exports = Team;
