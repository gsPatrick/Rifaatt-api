const PaymentService = require('./payment.service');

class PaymentController {
    async webhook(req, res) {
        try {
            console.log('Mercado Pago Webhook Received:', req.body);
            await PaymentService.processWebhook(req.body);
            return res.status(200).send('OK');
        } catch (error) {
            console.error('Webhook Error:', error);
            return res.status(200).send('OK'); // Always OK to MP to avoid loops if error is code-related
        }
    }
}

module.exports = new PaymentController();
