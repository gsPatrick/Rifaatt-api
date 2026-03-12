const User = require('./User');
const Raffle = require('./Raffle');
const Reservation = require('./Reservation');
const WhatsAppInstance = require('./WhatsAppInstance');
const GroupActivation = require('./GroupActivation');

// Associations
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
    Raffle,
    Reservation,
    WhatsAppInstance,
    GroupActivation
};
