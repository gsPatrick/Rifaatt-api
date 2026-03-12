const express = require('express');
const router = express.Router();
const instanceController = require('./instance.controller');

const authMiddleware = require('../../Middlewares/auth');

router.post('/init', authMiddleware, instanceController.init);
router.get('/connect/:id', authMiddleware, instanceController.connect);
router.get('/status/:id', authMiddleware, instanceController.status);
router.get('/', authMiddleware, instanceController.list);
router.patch('/:id', authMiddleware, instanceController.update);
router.delete('/:id', authMiddleware, instanceController.delete);

module.exports = router;
