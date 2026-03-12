const RaffleService = require('./raffle.service');

class RaffleController {
    // Methods for frontend admin to manage raffles
    async create(req, res) {
        try {
            const raffle = await RaffleService.createRaffle(req.body);
            return res.status(201).json(raffle);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getActive(req, res) {
        try {
            const { groupJid } = req.params;
            const raffle = await RaffleService.getActiveRaffleByGroup(groupJid);
            return res.json(raffle);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listGroups(req, res) {
        try {
            const userId = req.user.id;
            const groups = await RaffleService.listGroups(userId);
            return res.json(groups);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const history = await RaffleService.getHistory(userId);
            return res.json(history);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async finalize(req, res) {
        try {
            const { id } = req.params;
            const { winningNumber } = req.body;
            const raffle = await RaffleService.finalizeWithWinner(id, winningNumber || '00');
            return res.json(raffle);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async createGroup(req, res) {
        try {
            const userId = req.user.id;
            const { instanceId, groupName } = req.body;
            const activation = await RaffleService.createAndActivateGroup(userId, instanceId, groupName);
            return res.status(201).json(activation);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async activate(req, res) {
        try {
            const userId = req.user.id;
            const { instanceId, jid, name } = req.body;
            const activation = await RaffleService.activateExistingGroup(userId, instanceId, jid, name);
            return res.status(201).json(activation);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getGroupsFromInstance(req, res) {
        try {
            const { instanceId } = req.params;
            const groups = await RaffleService.getGroupsFromInstance(instanceId);
            return res.json(groups);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new RaffleController();
