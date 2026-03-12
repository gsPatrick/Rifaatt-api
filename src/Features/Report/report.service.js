const { Raffle, Reservation, WhatsAppInstance, GroupActivation } = require('../../Models');
const { Op, fn, col } = require('sequelize');

class ReportService {
    async getSalesStats(userId) {
        const results = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const count = await Reservation.count({
                include: [{
                    model: Raffle,
                    required: true,
                    include: [{
                        model: WhatsAppInstance,
                        where: { userId },
                        required: true
                    }]
                }],
                where: {
                    createdAt: { [Op.between]: [date, nextDate] }
                }
            });
            results.push({ name: days[date.getDay()], v: count });
        }

        const totalReservations = await Reservation.findAll({
            include: [{
                model: Raffle,
                required: true,
                include: [{
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                }]
            }]
        });

        const totalValue = totalReservations.reduce((acc, curr) => {
            const val = parseFloat(curr.Raffle?.ticketValue);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        return {
            chartData: results,
            totalSales: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            trend: '+12%'
        };
    }

    async getTopUsers(userId) {
        const reservations = await Reservation.findAll({
            include: [{
                model: Raffle,
                include: [{
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                }]
            }]
        });

        const userMap = {};
        reservations.forEach(r => {
            const phone = r.buyerPhone;
            if (!userMap[phone]) {
                userMap[phone] = {
                    id: phone,
                    name: r.buyerName,
                    participations: 0,
                    groups: new Set(),
                    total: 0,
                    wins: 0
                };
            }
            userMap[phone].participations += 1;
            userMap[phone].groups.add(r.raffleId);
            userMap[phone].total += parseFloat(r.Raffle?.ticketValue || 0);

            if (r.Raffle?.status === 'FINISHED' && r.Raffle?.winningNumber === r.number) {
                userMap[phone].wins += 1;
            }
        });

        const formatted = Object.values(userMap).map(u => ({
            id: u.id,
            name: u.name,
            participations: u.participations,
            groups: u.groups.size,
            value: `R$ ${u.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            wins: u.wins,
            totalWon: `R$ ${(u.wins * 500).toFixed(2)}`,
            luck: u.participations > 0 ? `${Math.round((u.wins / u.participations) * 100)}%` : '0%',
            spent: `R$ ${u.total.toFixed(2)}`
        }));

        return {
            recurrent: [...formatted].sort((a, b) => b.participations - a.participations).slice(0, 10),
            winners: [...formatted].filter(u => u.wins > 0).sort((a, b) => b.wins - a.wins).slice(0, 10),
            losers: [...formatted].filter(u => u.wins === 0).sort((a, b) => b.participations - a.participations).slice(0, 10),
            buyers: [...formatted].sort((a, b) => parseFloat(b.spent.replace('R$ ', '')) - parseFloat(a.spent.replace('R$ ', ''))).slice(0, 10)
        };
    }

    async getDashboardSummary(userId) {
        const activeGroups = await GroupActivation.count({
            include: [{
                model: WhatsAppInstance,
                where: { userId },
                required: true
            }]
        });

        const activeInstances = await WhatsAppInstance.count({
            where: { userId, status: 'CONNECTED' }
        });

        const totalReservations = await Reservation.findAll({
            include: [{
                model: Raffle,
                required: true,
                include: [{
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                }]
            }]
        });

        const totalValue = totalReservations.reduce((acc, curr) => {
            const val = parseFloat(curr.Raffle?.ticketValue);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        // Recent activities (last 5 reservations)
        const recentReservations = await Reservation.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Raffle,
                required: true,
                include: [{
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                }]
            }]
        });

        const getEmoji = (num) => {
            const dict = {
                '01': '🦢', '02': '🦢', '03': '🦢', '04': '🦢', '05': '🦅', '06': '🦅', '07': '🦅', '08': '🦅',
                '09': '🐴', '10': '🐴', '11': '🐴', '12': '🐴', '13': '🦋', '14': '🦋', '15': '🦋', '16': '🦋',
                '17': '🐶', '18': '🐶', '19': '🐶', '20': '🐶', '21': '🐐', '22': '🐐', '23': '🐐', '24': '🐐',
                '25': '🐏', '26': '🐏', '27': '🐏', '28': '🐏', '29': '🐫', '30': '🐫', '31': '🐫', '32': '🐫',
                '33': '🐍', '34': '🐍', '35': '🐍', '36': '🐍', '37': '🐇', '38': '🐇', '39': '🐇', '40': '🐇',
                '41': '🐎', '42': '🐎', '43': '🐎', '44': '🐎', '45': '🐘', '46': '🐘', '47': '🐘', '48': '🐘',
                '49': '🐔', '50': '🐔', '51': '🐔', '52': '🐔', '53': '🐈', '54': '🐈', '55': '🐈', '56': '🐈',
                '57': '🐊', '58': '🐊', '59': '🐊', '60': '🐊', '61': '🦁', '62': '🦁', '63': '🦁', '64': '🦁',
                '65': '🦍', '66': '🦍', '67': '🦍', '68': '🦍', '69': '🐷', '70': '🐷', '71': '🐷', '72': '🐷',
                '73': '🦚', '74': '🦚', '75': '🦚', '76': '🦚', '77': '🦃', '78': '🦃', '79': '🦃', '80': '🦃',
                '81': '🐃', '82': '🐃', '83': '🐃', '84': '🐃', '85': '🐅', '86': '🐅', '87': '🐅', '88': '🐅',
                '89': '🐻', '90': '🐻', '91': '🐻', '92': '🐻', '93': '🦌', '94': '🦌', '95': '🦌', '96': '🦌',
                '97': '🐄', '98': '🐄', '99': '🐄', '00': '🐄'
            };
            return dict[num.padStart(2, '0')] || '🎰';
        };

        const activities = recentReservations.map(r => ({
            id: r.id,
            type: 'new_reservation',
            message: `${getEmoji(r.number)} Nova reserva: dezena ${r.number} por ${r.buyerName} no grupo ${r.Raffle?.title || 'Rifa'}.`,
            time: 'Recente'
        }));

        return {
            activeGroups,
            activeInstances,
            totalValue: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            activities
        };
    }
}

module.exports = new ReportService();
