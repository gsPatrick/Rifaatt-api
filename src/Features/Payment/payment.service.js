const mercadopago = require('mercadopago');
require('dotenv').config();

class PaymentService {
    constructor() {
        this.accessToken = process.env.MP_ACCESS_TOKEN;
    }

    async findPayment(paymentId) {
        // In real MP SDK v2:
        // const payment = new Payment(this.client);
        // return await payment.get({ id: paymentId });

        // Placeholder for MP API call
        // we assume for dev/test that if paymentId is 'TEST_OK' it returns success
        if (paymentId === 'TEST_OK_ACT') return { external_reference: 'ACT_UUID_HERE', status: 'approved' };
        if (paymentId === 'TEST_OK_RES') return { external_reference: 'RES_UUID_HERE', status: 'approved' };

        return null;
    }

    async processWebhook(data) {
        const { type, action, data: eventData } = data;

        // MP sends many types, we care about payment
        if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
            return { handled: false };
        }

        const paymentId = eventData?.id;
        if (!paymentId) return { handled: false };

        const payment = await this.findPayment(paymentId);
        if (!payment || payment.status !== 'approved') return { handled: false };

        const ref = payment.external_reference;
        if (!ref) return { handled: false };

        if (ref.startsWith('ACT_')) {
            const activationId = ref.replace('ACT_', '');
            const GroupActivation = require('../../Models/GroupActivation');
            const activation = await GroupActivation.findByPk(activationId);
            if (activation) {
                activation.status = 'active';
                const now = new Date();
                activation.expirationDate = new Date(now.setDate(now.getDate() + 30));
                await activation.save();
                return { handled: true, type: 'ACTIVATION', id: activationId };
            }
        }

        if (ref.startsWith('RES_')) {
            const reservationId = ref.replace('RES_', '');
            const Reservation = require('../../Models/Reservation');
            const reservation = await Reservation.findByPk(reservationId);
            if (reservation) {
                reservation.status = 'PAID';
                await reservation.save();
                return { handled: true, type: 'RESERVATION', id: reservationId };
            }
        }

        return { handled: false };
    }

    async createPixPayment(reservationId, amount, description) {
        // Placeholder for Pix generation
        try {
            /*
            const payment = new mercadopago.Payment(this.client);
            const body = {
                transaction_amount: amount,
                description: description,
                payment_method_id: 'pix',
                payer: {
                    email: 'comprador@email.com'
                }
            };
            const result = await payment.create({ body });
            return result;
            */
            return { message: "Pagamento Pix gerado (Placeholder)" };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new PaymentService();
