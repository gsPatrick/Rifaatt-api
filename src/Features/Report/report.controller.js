const ReportService = require('./report.service');

class ReportController {
    async getTopUsers(req, res) {
        try {
            const recurrent = await ReportService.getTopRecurrent();
            const winners = []; // To wrap logic later
            const losers = [];

            res.json({
                recurrent,
                winners,
                losers,
                buyers: recurrent
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSalesStats(req, res) {
        try {
            const chartData = await ReportService.getSalesChartData();
            res.json({
                chartData,
                totalSales: "R$ 12.450,00",
                trend: "+12%"
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
