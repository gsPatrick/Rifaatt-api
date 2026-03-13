const express = require('express');
const router = express.Router();
const PaymentController = require('./payment.controller');
const authMiddleware = require('../../Middlewares/auth');

router.post('/checkout', authMiddleware, PaymentController.createCheckout);
router.get('/status/:paymentId', authMiddleware, PaymentController.checkStatus);
router.post('/webhook', PaymentController.webhook);

module.exports = router;
