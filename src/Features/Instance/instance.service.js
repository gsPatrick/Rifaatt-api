const axios = require('axios');
const WhatsAppInstance = require('../../Models/WhatsAppInstance');

class InstanceService {
    #getClient(apiUrl) {
        return axios.create({
            baseURL: apiUrl || process.env.UAZAPI_URL || 'https://api.uazapi.com',
        });
    }

    async initInstance(apiUrl, adminToken, name, userId) {
        const client = this.#getClient(apiUrl);
        const response = await client.post('/instance/init', { name }, {
            headers: { admintoken: adminToken }
        });

        const { token, instance } = response.data;

        const whatsappInstance = await WhatsAppInstance.create({
            name,
            instanceKey: instance.id,
            token: token,
            apiUrl: apiUrl,
            adminToken: adminToken,
            userId: userId,
            status: 'disconnected'
        });

        // Set webhook automatically
        try {
            await this.#setWebhook(token, apiUrl);
        } catch (error) {
            console.error('Error auto-setting webhook:', error);
            // We don't throw here to not break the instance creation if only webhook fails
        }

        return whatsappInstance;
    }

    async #setWebhook(token, apiUrl) {
        const client = this.#getClient(apiUrl);
        const webhookUrl = `${process.env.APP_URL}/api/webhooks`;

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
        const response = await client.post('/send/text', {
            number,
            text
        }, {
            headers: { token }
        });
        return response.data;
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
}

module.exports = new InstanceService();
