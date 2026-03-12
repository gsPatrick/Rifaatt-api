const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class WhatsAppInstance extends Model { }

WhatsAppInstance.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    instanceKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    apiUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://api.uazapi.com',
    },
    adminToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'disconnected',
    },
    pairingCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize,
    modelName: 'WhatsAppInstance',
    tableName: 'whatsapp_instances',
});

module.exports = WhatsAppInstance;
