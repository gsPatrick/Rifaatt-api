const axios = require('axios');
const { WhatsAppInstance, User, Plan } = require('../../Models');

class InstanceService {
    #getClient(apiUrl) {
        return axios.create({
            baseURL: apiUrl || process.env.UAZAPI_URL || 'https://api.uazapi.com',
        });
    }

    async initInstance(apiUrl, adminToken, name, userId) {
        // Limit Check
        const user = await User.findByPk(userId, { include: [Plan] });
        if (!user) throw new Error('Usuário não encontrado.');

        const instanceCount = await WhatsAppInstance.count({ where: { userId } });
        const limit = user.Plan ? user.Plan.instanceLimit : 1; // Default to 1 if no plan

        // Admin bypasses limits
        if (user.role !== 'ADMIN' && instanceCount >= limit) {
            throw new Error(`Limite de instâncias atingido para o seu plano (${limit}).`);
        }

        const finalApiUrl = apiUrl || process.env.UAZAPI_URL;
        const finalAdminToken = adminToken || process.env.UAZAPI_ADMIN_TOKEN;

        const client = this.#getClient(finalApiUrl);
        const response = await client.post('/instance/init', { name }, {
            headers: { admintoken: finalAdminToken }
        });

        const { token, instance } = response.data;

        const whatsappInstance = await WhatsAppInstance.create({
            name,
            instanceKey: instance.id,
            token: token,
            apiUrl: finalApiUrl,
            adminToken: finalAdminToken,
            userId: userId,
            status: 'disconnected'
        });

        // Set webhook automatically
        try {
            await this.#setWebhook(token, finalApiUrl);
        } catch (error) {
            console.error('Error auto-setting webhook:', error);
            // We don't throw here to not break the instance creation if only webhook fails
        }

        return whatsappInstance;
    }

    async #setWebhook(token, apiUrl) {
        const client = this.#getClient(apiUrl);
        const webhookUrl = `${process.env.APP_URL}/api/webhook`;

        console.log(`[InstanceService] Setting webhook for instance to: ${webhookUrl}`);

        await client.post('/webhook', {
            url: webhookUrl,
            enabled: true,
            events: ['messages', 'connection'],
            excludeMessages: ['wasSentByApi']
        }, {
            headers: { token }
        });
    }

    async connectInstance(instanceId) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instance not found');

        const client = this.#getClient(instance.apiUrl);
        const response = await client.post('/instance/connect', {}, {
            headers: { token: instance.token }
        });

        // If Uazapi returns a pairing code, store it
        if (response.data.pairingCode) {
            instance.pairingCode = response.data.pairingCode;
            await instance.save();
        }

        return response.data;
    }

    async getInstanceStatus(instanceId) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instance not found');

        const client = this.#getClient(instance.apiUrl);
        const response = await client.get('/instance/status', {
            headers: { token: instance.token }
        });

        // Update status in DB
        instance.status = response.data.instance.status;

        // If connected, clear pairing code
        if (instance.status === 'connected') {
            instance.pairingCode = null;
        }

        await instance.save();

        return response.data;
    }

    async listInstances(userId) {
        return await WhatsAppInstance.findAll({ where: { userId: userId } });
    }

    async sendMessage(token, number, text, apiUrl) {
        const client = this.#getClient(apiUrl);
        console.log(`[InstanceService] Sending message to ${number} | Token: ${token.substring(0, 5)}...`);
        try {
            const response = await client.post('/send/text', {
                number,
                text
            }, {
                headers: { token }
            });
            console.log(`[InstanceService] Send Message Response SUCCESS`);
            return response.data;
        } catch (error) {
            console.error(`[InstanceService] Send Message ERROR:`, error.response?.data || error.message);
            throw error;
        }
    }

    async createGroup(token, name, participants = [], apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/group/create', {
            name,
            participants
        }, {
            headers: { token }
        });
        return response.data; // returns { id, name, ... } where id is the JID
    }

    async reactToMessage(token, number, text, id, apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/message/react', {
            number,
            text,
            id
        }, {
            headers: { token }
        });
        return response.data;
    }

    async getGroupInfo(token, groupjid, apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/group/info', {
            groupjid
        }, {
            headers: { token }
        });
        return response.data;
    }

    async updateGroupParticipants(token, groupjid, action, participants, apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/group/updateParticipants', {
            groupjid,
            action,
            participants
        }, {
            headers: { token }
        });
        return response.data;
    }

    async updateGroupAnnounce(token, groupjid, announce, apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/group/updateAnnounce', {
            groupjid,
            announce
        }, {
            headers: { token }
        });
        return response.data;
    }

    async updateInstance(instanceId, data) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instance not found');

        await instance.update(data);
        return instance;
    }

    async deleteInstance(instanceId) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instance not found');

        // Delete from Uazapi first
        try {
            const client = this.#getClient(instance.apiUrl);
            await client.delete(`/instance`, {
                headers: { token: instance.token }
            });
        } catch (error) {
            console.error('Error deleting from Uazapi during local delete:', error.message);
            // We continue even if Uazapi fails to ensure local cleanup
        }

        await instance.destroy();
        return { success: true };
    }

    async fetchAllGroups(token, apiUrl) {
        const client = this.#getClient(apiUrl);
        const response = await client.get('/group/list', {
            headers: { token }
        });
        return response.data;
    }
    async syncWebhooks() {
        const instances = await WhatsAppInstance.findAll();
        const results = {
            total: instances.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (const instance of instances) {
            try {
                await this.#setWebhook(instance.token, instance.apiUrl);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    name: instance.name,
                    error: error.message
                });
                console.error(`[InstanceService] Failed to sync webhook for ${instance.name}:`, error.message);
            }
        }

        return results;
    }
}

module.exports = new InstanceService();
