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

Raffle.hasMany(Reservation, { foreignKey: 'raffleId' });
Reservation.belongsTo(Raffle, { foreignKey: 'raffleId' });

module.exports = {
    User,
    Raffle,
    Reservation,
    WhatsAppInstance,
    GroupActivation
};
