const express = require('express');
const router = express.Router();
const RaffleController = require('./raffle.controller');

const authMiddleware = require('../../Middlewares/auth');

router.post('/', authMiddleware, RaffleController.create);
router.get('/groups', authMiddleware, RaffleController.listGroups);
router.get('/history', authMiddleware, RaffleController.getHistory);
router.get('/active/:groupJid', authMiddleware, RaffleController.getActive);
router.post('/finalize/:id', authMiddleware, RaffleController.finalize);
router.post('/create-group', authMiddleware, RaffleController.createGroup);
router.post('/groups', authMiddleware, RaffleController.activate);
router.get('/groups-from-instance/:instanceId', authMiddleware, RaffleController.getGroupsFromInstance);

module.exports = router;
