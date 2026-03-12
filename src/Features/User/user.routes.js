const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/', userController.list);
router.patch('/:id/status', userController.updateStatus);
router.patch('/:id/plan', userController.updatePlan);

module.exports = router;
