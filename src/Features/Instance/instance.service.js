const axios = require('axios');
const WhatsAppInstance = require('../../Models/WhatsAppInstance');
require('dotenv').config();

const uazapi = axios.create({
    baseURL: process.env.UAZAPI_URL,
});

class InstanceService {
    async initInstance(name, userId) {
        const response = await uazapi.post('/instance/init', { name }, {
            headers: { admintoken: process.env.UAZAPI_ADMIN_TOKEN }
        });

        const { token, instance } = response.data;

        return await WhatsAppInstance.create({
            name,
            instanceKey: instance.id,
            token: token,
            userId: userId,
            status: 'disconnected'
        });
    }

    async connectInstance(instanceId) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instance not found');

        const response = await uazapi.post('/instance/connect', {}, {
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

        const response = await uazapi.get('/instance/status', {
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

    async sendMessage(token, number, text) {
        const response = await uazapi.post('/send/text', {
            number,
            text
        }, {
            headers: { token }
        });
        return response.data;
    }

    async createGroup(token, name, participants = []) {
        const response = await uazapi.post('/group/create', {
            name,
            participants
        }, {
            headers: { token }
        });
        return response.data; // returns { id, name, ... } where id is the JID
    }

    async reactToMessage(token, number, text, id) {
        const response = await uazapi.post('/message/react', {
            number,
            text,
            id
        }, {
            headers: { token }
        });
        return response.data;
    }

    async getGroupInfo(token, groupjid) {
        const response = await uazapi.post('/group/info', {
            groupjid
        }, {
            headers: { token }
        });
        return response.data;
    }

    async updateGroupParticipants(token, groupjid, action, participants) {
        const response = await uazapi.post('/group/updateParticipants', {
            groupjid,
            action,
            participants
        }, {
            headers: { token }
        });
        return response.data;
    }

    async updateGroupAnnounce(token, groupjid, announce) {
        const response = await uazapi.post('/group/updateAnnounce', {
            groupjid,
            announce
        }, {
            headers: { token }
        });
        return response.data;
    }
}

module.exports = new InstanceService();
