const express = require('express');
const router = express.Router();

const userRoutes = require('../Features/User/user.routes');
const instanceRoutes = require('../Features/Instance/instance.routes');
const webhookRoutes = require('../Features/Webhook/webhook.routes');
const raffleRoutes = require('../Features/Raffle/raffle.routes');
const paymentRoutes = require('../Features/Payment/payment.routes');
const reportRoutes = require('../Features/Report/report.routes');
const planRoutes = require('../Features/Plan/plan.routes');

router.use('/users', userRoutes);
router.use('/instances', instanceRoutes);
router.use('/webhook', webhookRoutes);
router.use('/raffles', raffleRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/plans', planRoutes);

module.exports = router;
