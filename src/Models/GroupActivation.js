const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class GroupActivation extends Model { }

GroupActivation.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    groupJid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    groupName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'expiring'),
        defaultValue: 'active',
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
    modelName: 'GroupActivation',
    tableName: 'group_activations',
});

module.exports = GroupActivation;
