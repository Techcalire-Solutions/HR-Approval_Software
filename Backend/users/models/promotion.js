/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require("sequelize");
const sequelize = require("../../utils/db");
const User = require("./user");
const Designation = require("./designation");

const Promotion = sequelize.define(
  "Promotion",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    oldDesignationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    designationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    newSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    promotionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    promotionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    paranoid: true, // Enable soft deletion
  }
);
Promotion.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onUpdate: "CASCADE"
});
User.hasMany(Promotion, { foreignKey: "userId" });

// Promotion belongs to the new designation
Promotion.belongsTo(Designation, {
  foreignKey: "designationId",
  as: "Designation", // Capital D to match your query alias
  onUpdate: "CASCADE"
});
Designation.hasMany(Promotion, { foreignKey: "designationId" });

// Promotion belongs to the old designation
Promotion.belongsTo(Designation, {
  foreignKey: "oldDesignationId",
  as: "oldDesignation",
  onUpdate: "CASCADE"
});
Designation.hasMany(Promotion, { foreignKey: "oldDesignationId" });

Promotion.sync({ alter: true })
  .then(() => console.log("Promotion table Sync"))
  .catch((err) => console.log("Error syncing table Promotion:", err));

module.exports = Promotion;
