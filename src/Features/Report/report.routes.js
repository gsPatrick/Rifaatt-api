const express = require('express');
const router = express.Router();
const ReportController = require('./report.controller');
const authMiddleware = require('../../Middlewares/auth');

router.get('/top-users', authMiddleware, ReportController.getTopUsers);
router.get('/sales-stats', authMiddleware, ReportController.getSalesStats);
router.get('/dashboard/summary', authMiddleware, ReportController.getDashboardSummary);
router.get('/activities', authMiddleware, ReportController.getAllActivities);

module.exports = router;
