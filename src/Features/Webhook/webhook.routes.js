const express = require('express');
const router = express.Router();
const WebhookController = require('./webhook.controller');

router.post('/', WebhookController.handle);

module.exports = router;
