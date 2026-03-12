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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
