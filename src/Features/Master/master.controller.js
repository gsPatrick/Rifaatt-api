const { SystemSetting } = require('../../Models');

class MasterController {
    async getSettings(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const settings = await SystemSetting.findAll();
            const formattedSettings = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            return res.json(formattedSettings);
        } catch (error) {
            console.error('Get Settings Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const settings = req.body; // { key: value, ... }

            for (const [key, value] of Object.entries(settings)) {
                await SystemSetting.upsert({ key, value });
            }

            return res.json({ success: true });
        } catch (error) {
            console.error('Update Settings Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async getSummary(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const { WhatsAppInstance, GroupActivation, User } = require('../../Models');
            const { Op } = require('sequelize');

            const totalActiveGroups = await GroupActivation.count({
                where: { status: 'active' }
            });

            const totalActiveInstances = await WhatsAppInstance.count({
                where: { 
                    status: { [Op.in]: ['CONNECTED', 'open'] }
                }
            });

            // Instances that are NOT connected but belong to users who have a plan assigned
            const paidInactiveInstances = await WhatsAppInstance.count({
                where: {
                    status: { [Op.ne]: 'CONNECTED' }
                },
                include: [{
                    model: User,
                    where: {
                        planId: { [Op.ne]: null }
                    },
                    required: true
                }]
            });

            return res.json({
                totalActiveGroups,
                totalActiveInstances,
                paidInactiveInstances
            });
        } catch (error) {
            console.error('Get Summary Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new MasterController();
