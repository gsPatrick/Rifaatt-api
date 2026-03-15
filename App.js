const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./src/Routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// Create default admin if not exists
const User = require('./src/Models/User');
const createDefaultAdmin = async () => {
    try {
        const adminEmail = 'admin@admin.com';
        const adminExists = await User.findOne({ where: { email: adminEmail } });
        if (!adminExists) {
            await User.create({
                name: 'Administrador',
                email: adminEmail,
                password: 'admin',
                role: 'ADMIN',
                status: 'ACTIVE'
            });
            console.log('Default admin created: admin@admin.com / admin');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};
createDefaultAdmin();

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Auto-sync webhooks on startup to fix any URL mismatches or double slashes
    try {
        const instanceService = require('./src/Features/Instance/instance.service');
        console.log('[Startup] Syncing webhooks for all instances...');
        const syncResult = await instanceService.syncWebhooks();
        console.log(`[Startup] Webhook sync completed: ${syncResult.success} success, ${syncResult.failed} failed.`);

        // Fix raffles with 0 or NULL numbersCount
        const Raffle = require('./src/Models/Raffle');
        const { Op } = require('sequelize');
        console.log('[Startup] Checking for raffles with missing numbersCount...');
        const [fixedCount] = await Raffle.update(
            { numbersCount: 100 },
            { where: { [Op.or]: [{ numbersCount: 0 }, { numbersCount: null }] } }
        );
        if (fixedCount > 0) {
            console.log(`[Startup] Fixed ${fixedCount} raffles with 0 or NULL numbersCount.`);
        }
    } catch (error) {
        console.error('[Startup] Failed to run initialization scripts:', error);
    }
});

module.exports = app;
