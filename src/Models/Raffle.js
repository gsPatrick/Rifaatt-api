const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class Raffle extends Model { }

Raffle.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    prize: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ticketValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    pixKey: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    drawDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    winningNumber: {
        type: DataTypes.STRING(3),
        allowNull: true,
    },
    numbersCount: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
    },
    status: {
        type: DataTypes.ENUM('CREATED', 'ACTIVE', 'FINALIZED', 'FINISHED'),
        defaultValue: 'CREATED',
    },
    groupJid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    instanceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'whatsapp_instances',
            key: 'id',
        },
    },
}, {
    sequelize,
    modelName: 'Raffle',
    tableName: 'raffles',
});

module.exports = Raffle;
