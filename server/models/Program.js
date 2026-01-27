const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bestProgram: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bestPerformance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bestCreativity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'programs',
  timestamps: true
});

module.exports = Program;