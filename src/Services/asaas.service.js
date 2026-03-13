const axios = require('axios');
const { SystemSetting } = require('../Models');
require('dotenv').config();

class AsaasService {
    async getSettings() {
        const settings = await SystemSetting.findAll({
            where: {
                key: ['asaas_api_key', 'asaas_environment']
            }
        });
        
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async getClient() {
        const settings = await this.getSettings();
        const apiKey = settings.asaas_api_key || process.env.ASAAS_API_KEY;
        const env = settings.asaas_environment || process.env.NODE_ENV || 'development';
        
        const baseUrl = (env === 'production') 
            ? 'https://www.asaas.com/api/v3' 
            : 'https://sandbox.asaas.com/api/v3';

        return axios.create({
            baseURL: baseUrl,
            headers: {
                'access_token': apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    async getOrCreateCustomer(user) {
        if (user.asaasCustomerId) {
            return user.asaasCustomerId;
        }

        try {
            const client = await this.getClient();
            // Check if customer already exists by email
            const search = await client.get(`/customers?email=${user.email}`);
            if (search.data.data.length > 0) {
                const customerId = search.data.data[0].id;
                await user.update({ asaasCustomerId: customerId });
                return customerId;
            }

            // Create new customer
            const response = await client.post('/customers', {
                name: user.name,
                email: user.email,
                phone: user.phone,
                cpfCnpj: user.document,
                notificationDisabled: true
            });

            const customerId = response.data.id;
            await user.update({ asaasCustomerId: customerId });
            return customerId;
        } catch (error) {
            console.error('Asaas getOrCreateCustomer Error:', error.response?.data || error.message);
            throw new Error('Erro ao processar cliente no Asaas.');
        }
    }

    async createPixPayment(customerId, amount, description, externalReference) {
        try {
            const client = await this.getClient();
            const response = await client.post('/payments', {
                customer: customerId,
                billingType: 'PIX',
                value: amount,
                dueDate: new Date().toISOString().split('T')[0],
                description: description,
                externalReference: externalReference
            });

            return response.data;
        } catch (error) {
            console.error('Asaas createPixPayment Error:', error.response?.data || error.message);
            throw new Error('Erro ao gerar cobrança PIX no Asaas.');
        }
    }

    async getPixQrCode(paymentId) {
        try {
            const client = await this.getClient();
            const response = await client.get(`/payments/${paymentId}/pixQrCode`);
            return response.data;
        } catch (error) {
            console.error('Asaas getPixQrCode Error:', error.response?.data || error.message);
            throw new Error('Erro ao obter QR Code do PIX.');
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const client = await this.getClient();
            const response = await client.get(`/payments/${paymentId}`);
            return response.data;
        } catch (error) {
            console.error('Asaas getPaymentStatus Error:', error.response?.data || error.message);
            throw new Error('Erro ao consultar status do pagamento.');
        }
    }
}

module.exports = new AsaasService();
