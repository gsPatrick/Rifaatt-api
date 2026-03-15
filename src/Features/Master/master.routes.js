const express = require('express');
const router = express.Router();
const MasterController = require('./master.controller');
const authMiddleware = require('../../Middlewares/auth');

router.get('/settings', authMiddleware, MasterController.getSettings);
router.post('/settings', authMiddleware, MasterController.updateSettings);
router.get('/summary', authMiddleware, MasterController.getSummary);

module.exports = router;
