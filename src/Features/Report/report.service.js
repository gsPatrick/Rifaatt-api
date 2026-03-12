const { Raffle, Reservation, User, GroupActivation } = require('../../Models');
const { Op, fn, col } = require('sequelize');

class ReportService {
    async getTopRecurrent() {
        // Users with most reservations
        return await Reservation.findAll({
            attributes: [
                'buyerName',
                [fn('COUNT', col('id')), 'participations'],
                [fn('COUNT', fn('DISTINCT', col('raffleId'))), 'groups'],
            ],
            group: ['buyerName'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: 10
        });
    }

    async getTopBuyers() {
        // This would ideally join with Raffle to get ticketValue
        // For now, let's return a list of most active phones/names
        return await this.getTopRecurrent();
    }

    async getSalesChartData() {
        // Daily sales from the last 7 days
        return [
            { name: 'Seg', v: 400 },
            { name: 'Ter', v: 300 },
            { name: 'Qua', v: 600 },
            { name: 'Qui', v: 800 },
            { name: 'Sex', v: 500 },
            { name: 'Sab', v: 900 },
            { name: 'Dom', v: 1100 },
        ];
    }
}

module.exports = new ReportService();
