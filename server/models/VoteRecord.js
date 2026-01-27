const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoteRecord = sequelize.define('VoteRecord', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    programId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    awardType: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'vote_records',
    timestamps: true
});

module.exports = VoteRecord;
