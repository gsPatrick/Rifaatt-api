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

    async getAllActivities(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await ReportService.getAllActivities(userId, page, limit);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getParticipantProfile(req, res) {
        try {
            const userId = req.user.id;
            const participantId = decodeURIComponent(req.params.participantId);
            const profile = await ReportService.getParticipantProfile(userId, participantId);
            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
