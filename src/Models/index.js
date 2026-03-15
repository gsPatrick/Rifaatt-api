const User = require('./User');
const Plan = require('./Plan');
const UserPlanAccess = require('./UserPlanAccess');
const Raffle = require('./Raffle');
const Reservation = require('./Reservation');
const WhatsAppInstance = require('./WhatsAppInstance');
const GroupActivation = require('./GroupActivation');
const SystemSetting = require('./SystemSetting');

// Associations
User.belongsTo(Plan, { foreignKey: 'planId' });
Plan.hasMany(User, { foreignKey: 'planId' });

// Private Plan Access (Many-to-Many)
User.belongsToMany(Plan, { 
    through: UserPlanAccess, 
    foreignKey: 'userId', 
    otherKey: 'planId',
    as: 'accessiblePlans'
});
Plan.belongsToMany(User, { 
    through: UserPlanAccess, 
    foreignKey: 'planId', 
    otherKey: 'userId',
    as: 'allowedUsers'
});

User.hasMany(WhatsAppInstance, { foreignKey: 'userId' });
WhatsAppInstance.belongsTo(User, { foreignKey: 'userId' });

WhatsAppInstance.hasMany(GroupActivation, { foreignKey: 'instanceId' });
GroupActivation.belongsTo(WhatsAppInstance, { foreignKey: 'instanceId' });

WhatsAppInstance.hasMany(Raffle, { foreignKey: 'instanceId' });
Raffle.belongsTo(WhatsAppInstance, { foreignKey: 'instanceId' });

Raffle.hasMany(Reservation, { foreignKey: 'raffleId' });
Reservation.belongsTo(Raffle, { foreignKey: 'raffleId' });

Raffle.belongsTo(GroupActivation, { foreignKey: 'groupJid', targetKey: 'groupJid' });
GroupActivation.hasMany(Raffle, { foreignKey: 'groupJid', sourceKey: 'groupJid' });

module.exports = {
    User,
    Plan,
    UserPlanAccess,
    Raffle,
    Reservation,
    WhatsAppInstance,
    GroupActivation,
    SystemSetting
};
