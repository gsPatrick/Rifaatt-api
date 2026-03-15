const express = require('express');
const router = express.Router();
const instanceController = require('./instance.controller');

const authMiddleware = require('../../Middlewares/auth');

router.post('/init', authMiddleware, instanceController.init);
router.post('/connect/:id', authMiddleware, instanceController.connect);
router.post('/disconnect/:id', authMiddleware, instanceController.disconnect);
router.get('/status/:id', authMiddleware, instanceController.status);
router.get('/', authMiddleware, instanceController.list);
router.patch('/:id', authMiddleware, instanceController.update);
router.delete('/:id', authMiddleware, instanceController.delete);
router.post('/sync-webhooks', authMiddleware, instanceController.syncWebhooks);

module.exports = router;
