const instanceService = require('./instance.service');

class InstanceController {
    async init(req, res) {
        try {
            const { name, userId, apiUrl, adminToken } = req.body;
            const instance = await instanceService.initInstance(
                apiUrl,
                adminToken,
                name,
                userId || req.user.id
            );
            res.status(201).json(instance);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async connect(req, res) {
        try {
            const { id } = req.params;
            const data = await instanceService.connectInstance(id);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async status(req, res) {
        try {
            const { id } = req.params;
            const data = await instanceService.getInstanceStatus(id);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async list(req, res) {
        try {
            const userId = req.query.userId || (req.user ? req.user.id : null);
            const instances = await instanceService.listInstances(userId);
            res.json(instances);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const instance = await instanceService.updateInstance(id, req.body);
            res.json(instance);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await instanceService.deleteInstance(id);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async syncWebhooks(req, res) {
        try {
            const result = await instanceService.syncWebhooks();
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new InstanceController();
