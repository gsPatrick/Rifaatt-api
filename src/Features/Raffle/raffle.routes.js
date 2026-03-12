const express = require('express');
const router = express.Router();
const RaffleController = require('./raffle.controller');

router.post('/', RaffleController.create);
router.get('/groups', RaffleController.listGroups);
router.get('/history', RaffleController.getHistory);
router.get('/active/:groupJid', RaffleController.getActive);
router.post('/finalize/:id', RaffleController.finalize);
router.post('/create-group', RaffleController.createGroup);
router.get('/groups-from-instance/:instanceId', RaffleController.getGroupsFromInstance);

module.exports = router;
