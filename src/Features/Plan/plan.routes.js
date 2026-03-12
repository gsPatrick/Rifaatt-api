const express = require('express');
const router = express.Router();
const PlanController = require('./plan.controller');
const authMiddleware = require('../../Middlewares/auth');

router.get('/', authMiddleware, PlanController.list);
router.post('/', authMiddleware, PlanController.create);
router.patch('/:id', authMiddleware, PlanController.update);
router.delete('/:id', authMiddleware, PlanController.delete);

module.exports = router;
