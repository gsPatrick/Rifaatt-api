const express = require('express');
const router = express.Router();
const ReportController = require('./report.controller');
const authMiddleware = require('../../Middlewares/auth');

router.get('/top-users', authMiddleware, ReportController.getTopUsers);
router.get('/sales-stats', authMiddleware, ReportController.getSalesStats);

module.exports = router;
