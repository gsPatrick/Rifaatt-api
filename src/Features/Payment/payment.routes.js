const express = require('express');
const router = express.Router();
const PaymentController = require('./payment.controller');

router.post('/webhook', PaymentController.webhook);

module.exports = router;
