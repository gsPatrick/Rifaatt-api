const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./src/Routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

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
