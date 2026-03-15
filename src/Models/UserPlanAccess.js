const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class UserPlanAccess extends Model { }

UserPlanAccess.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'plans',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'UserPlanAccess',
    tableName: 'user_plan_access',
});

module.exports = UserPlanAccess;
