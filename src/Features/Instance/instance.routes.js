const express = require('express');
const router = express.Router();
const instanceController = require('./instance.controller');

const authMiddleware = require('../../Middlewares/auth');

router.post('/init', authMiddleware, instanceController.init);
router.post('/:id/connect', authMiddleware, instanceController.connect);
router.get('/:id/status', authMiddleware, instanceController.status);
router.get('/', authMiddleware, instanceController.list);

module.exports = router;
