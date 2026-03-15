const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

const auth = require('../../Middlewares/auth');

router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));
router.get('/me', auth, (req, res) => userController.me(req, res));
router.get('/', auth, (req, res) => userController.list(req, res));
router.put('/:id', auth, (req, res) => userController.update(req, res));
router.delete('/:id', auth, (req, res) => userController.delete(req, res));
router.patch('/:id/status', auth, (req, res) => userController.updateStatus(req, res));
router.patch('/:id/plan', auth, (req, res) => userController.updatePlan(req, res));
router.post('/me/onboarding/clear', auth, (req, res) => userController.clearOnboarding(req, res));

module.exports = router;
