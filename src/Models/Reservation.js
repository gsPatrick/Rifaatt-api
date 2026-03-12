const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class Reservation extends Model { }

Reservation.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    raffleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'raffles',
            key: 'id',
        },
    },
    number: {
        type: DataTypes.STRING(3), // 00-99 or 000
        allowNull: false,
    },
    buyerName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    buyerPhone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PAID'),
        defaultValue: 'PENDING',
    },
}, {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
});

module.exports = Reservation;
