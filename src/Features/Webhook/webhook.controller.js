const WebhookService = require('./webhook.service');

class WebhookController {
    async handle(req, res) {
        try {
            console.log('--- NEW WEBHOOK PAYLOAD ---');
            console.log(JSON.stringify(req.body, null, 2));
            console.log('---------------------------');

            // Uazapi sends the event in the body
            await WebhookService.handleEvent(req.body);

            // Always return 200 to Uazapi to acknowledge receipt
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Webhook Controller Error:', error);
            // Even on error, it might be better to return 200 to prevent retries if the error is data-specific
            return res.status(200).json({ success: false, error: error.message });
        }
    }
}

module.exports = new WebhookController();
