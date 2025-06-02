/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const { DataTypes } = require("sequelize");
const sequelize = require("../../utils/db");
const User = require("../../users/models/user");

const UserAssets = sequelize.define(
  "userAssets",
  {
    assetName: { type: DataTypes.STRING, allowNull: false },
    assetNumber: { type: DataTypes.STRING },
    assetHandoverNumber: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    serialNumber: { type: DataTypes.STRING },
    purchasedDate: { type: DataTypes.DATEONLY },
    purchasedFrom: { type: DataTypes.STRING },
    invoiceNo: { type: DataTypes.STRING },
    status: { type: DataTypes.BOOLEAN },
    assignedStatus: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

// User.hasMany(UserAssets, {
//   foreignKey: "userId",
//   onUpdate: "CASCADE",
//   onDelete: "CASCADE",
// });
// UserAssets.belongsTo(User);

UserAssets.sync({ alter: true }).then(() => console.log);

module.exports = UserAssets;
