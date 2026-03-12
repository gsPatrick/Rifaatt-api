const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
    checkPassword(password) {
        return bcrypt.compare(password, this.password);
    }
}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'CLIENT'),
        defaultValue: 'CLIENT',
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'BLOCKED'),
        defaultValue: 'ACTIVE',
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'plans',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'User',
    hooks: {
        beforeSave: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 8);
            }
        },
    },
});

module.exports = User;
