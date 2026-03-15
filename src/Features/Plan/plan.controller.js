const { Plan } = require('../../Models');

class PlanController {
    async list(req, res) {
        try {
            const { User, UserPlanAccess } = require('../../Models');
            const isAdmin = req.user?.role === 'ADMIN';
            const userId = req.user?.id;

            if (isAdmin) {
                // Admins see everything + allowed users
                const plans = await Plan.findAll({
                    include: [{
                        model: User,
                        as: 'allowedUsers',
                        attributes: ['id', 'name', 'email'],
                        through: { attributes: [] }
                    }]
                });
                return res.json(plans);
            }

            // Normal users see:
            // 1. All public active plans
            // 2. Private plans they were granted access to
            const plans = await Plan.findAll({
                where: {
                    status: 'active',
                    [require('sequelize').Op.or]: [
                        { isPublic: true },
                        userId ? { '$allowedUsers.id$': userId } : {}
                    ]
                },
                include: userId ? [{
                    model: User,
                    as: 'allowedUsers',
                    where: { id: userId },
                    required: false, // Don't filter out if no user allowed (Op.or handles it)
                    attributes: []
                }] : []
            });

            return res.json(plans);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }
            const { allowedUserIds, ...planData } = req.body;
            const plan = await Plan.create(planData);

            if (allowedUserIds && Array.isArray(allowedUserIds)) {
                await plan.setAllowedUsers(allowedUserIds);
            }

            return res.status(201).json(plan);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }
            const { id } = req.params;
            const plan = await Plan.findByPk(id);
            if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

            const { allowedUserIds, ...planData } = req.body;
            await plan.update(planData);

            if (allowedUserIds && Array.isArray(allowedUserIds)) {
                await plan.setAllowedUsers(allowedUserIds);
            }

            return res.json(plan);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado.' });
            }
            const { id } = req.params;
            const plan = await Plan.findByPk(id);
            if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

            await plan.destroy();
            return res.json({ message: 'Plano excluído com sucesso.' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new PlanController();
