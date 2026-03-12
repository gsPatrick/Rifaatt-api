const ReportService = require('./report.service');

class ReportController {
    async getTopUsers(req, res) {
        try {
            const userId = req.user.id;
            const rankings = await ReportService.getTopUsers(userId);
            res.json(rankings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSalesStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await ReportService.getSalesStats(userId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getDashboardSummary(req, res) {
        try {
            const userId = req.user.id;
            const summary = await ReportService.getDashboardSummary(userId);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
