const express = require('express');
const router = express.Router();
const instanceController = require('./instance.controller');

router.post('/init', instanceController.init);
router.post('/:id/connect', instanceController.connect);
router.get('/:id/status', instanceController.status);
router.get('/', instanceController.list);

module.exports = router;
