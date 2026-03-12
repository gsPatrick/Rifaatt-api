const { Plan } = require('../../Models');

class PlanController {
    async list(req, res) {
        try {
            const plans = await Plan.findAll({
                where: req.user?.role !== 'ADMIN' ? { isPublic: true, status: 'active' } : {}
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
            const plan = await Plan.create(req.body);
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

            await plan.update(req.body);
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
