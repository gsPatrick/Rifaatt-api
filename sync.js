const sequelize = require('./src/Config/database');
require('./src/Models/User');
require('./src/Models/WhatsAppInstance');
require('./src/Models/GroupActivation');
require('./src/Models/Raffle');
require('./src/Models/Reservation');

async function syncDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

syncDB();
