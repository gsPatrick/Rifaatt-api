const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

const auth = require('../../Middlewares/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.me);
router.get('/', auth, userController.list);
router.patch('/:id/status', auth, userController.updateStatus);
router.patch('/:id/plan', auth, userController.updatePlan);

module.exports = router;
