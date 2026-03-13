const AsaasService = require('../../Services/asaas.service');
const { User, Plan } = require('../../Models');

class PaymentController {
    async createCheckout(req, res) {
        try {
            const { planId, document } = req.body;
            const userId = req.user.id;

            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            const plan = await Plan.findByPk(planId);
            if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

            // Update user document if provided and missing
            if (document && !user.document) {
                await user.update({ document });
            } else if (!user.document && !document) {
                return res.status(400).json({ error: 'CPF/CNPJ é obrigatórios para gerar o pagamento.' });
            }

            const customerId = await AsaasService.getOrCreateCustomer(user);
            
            // Generate payment
            const externalReference = `PLAN_${user.id}_${plan.id}_${Date.now()}`;
            const payment = await AsaasService.createPixPayment(
                customerId, 
                parseFloat(plan.price), 
                `Assinatura Plano ${plan.name} - Rifaatt`,
                externalReference
            );

            // Get QR Code
            const qrData = await AsaasService.getPixQrCode(payment.id);

            return res.json({
                paymentId: payment.id,
                invoiceUrl: payment.invoiceUrl,
                qrCode: qrData.encodedImage,
                payload: qrData.payload,
                status: payment.status
            });
        } catch (error) {
            console.error('Checkout Error:', error);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }

    async checkStatus(req, res) {
        try {
            const { paymentId } = req.params;
            const payment = await AsaasService.getPaymentStatus(paymentId);

            // If paid, we could update the user here too as a fallback for webhook
            if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
                const ref = payment.externalReference;
                if (ref && ref.startsWith('PLAN_')) {
                    const [, userId, planId] = ref.split('_');
                    const user = await User.findByPk(userId);
                    if (user && user.planId !== planId) {
                        await user.update({ planId });
                    }
                }
            }

            return res.json({ status: payment.status });
        } catch (error) {
            console.error('Check Status Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async webhook(req, res) {
        try {
            const { event, payment } = req.body;
            console.log('Asaas Webhook Received:', event, payment?.id);

            if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
                const ref = payment.externalReference;
                
                if (ref && ref.startsWith('PLAN_')) {
                    const [, userId, planId] = ref.split('_');
                    
                    const user = await User.findByPk(userId);
                    if (user) {
                        await user.update({ planId });
                        console.log(`Plan ${planId} fulfilled for user ${userId}`);
                    }
                }
            }

            return res.status(200).send('OK');
        } catch (error) {
            console.error('Webhook Error:', error);
            return res.status(200).send('OK'); 
        }
    }
}

module.exports = new PaymentController();
