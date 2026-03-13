const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class SystemSetting extends Model {}

SystemSetting.init({
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
});

module.exports = SystemSetting;
