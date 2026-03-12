const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class Plan extends Model { }

Plan.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    instanceLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    groupLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    features: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    }
}, {
    sequelize,
    modelName: 'Plan',
    tableName: 'plans',
});

module.exports = Plan;
