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
            const { groupJid: groupId } = req.params;
            
            // Fetch the group activation by its record ID
            const { GroupActivation, WhatsAppInstance } = require('../../Models');
            const group = await GroupActivation.findOne({
                where: { id: groupId },
                include: [{ model: WhatsAppInstance, required: false }]
            });

            if (!group) {
                // Try finding by groupJid directly if groupId is actually a JID
                group = await GroupActivation.findOne({
                    where: { groupJid: groupId },
                    include: [{ model: WhatsAppInstance, required: false }]
                });
            }

            if (!group) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }

            const raffle = await RaffleService.getActiveRaffleByGroup(group.groupJid);

            return res.json({
                group,
                raffle
            });
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

    async getDashboard(req, res) {
        try {
            const userId = req.user.id;
            const dashboard = await RaffleService.getRaffleDashboard(userId);
            return res.json(dashboard);
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

    async deleteGroup(req, res) {
        try {
            const { id } = req.params;
            const result = await RaffleService.deleteGroupActivation(id);
            return res.json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getGroupInviteLink(req, res) {
        try {
            const { groupJid } = req.params;
            const { GroupActivation, WhatsAppInstance } = require('../../Models');
            
            // groupId could be UUID or JID
            const { Op } = require('sequelize');
            const group = await GroupActivation.findOne({
                where: { 
                    [Op.or]: [
                        { id: groupJid },
                        { groupJid: groupJid }
                    ]
                },
                include: [{ model: WhatsAppInstance }]
            });

            if (!group || !group.WhatsAppInstance) {
                return res.status(404).json({ error: 'Grupo ou instância não encontrados' });
            }

            const inviteLink = await InstanceService.getGroupInviteLink(
                group.WhatsAppInstance.token,
                group.groupJid,
                group.WhatsAppInstance.apiUrl
            );

            return res.json({ inviteLink });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new RaffleController();
