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
            where: { userId, status: 'connected' }
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
            if (curr.status !== 'PAID') return acc;
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

    async getParticipantProfile(userId, participantId) {
        // participantId is the buyerPhone (JID)
        const reservations = await Reservation.findAll({
            where: { buyerPhone: participantId },
            include: [{
                model: Raffle,
                required: true,
                include: [{
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                }, {
                    model: GroupActivation,
                    required: false
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        if (reservations.length === 0) {
            return { stats: { totalSpent: 'R$ 0,00', totalRaffles: 0, winRate: '0%', lastSeen: '-' }, spendingData: [], winHistory: [] };
        }

        // Stats
        const totalSpent = reservations.reduce((acc, r) => {
            if (r.status === 'PAID') {
                return acc + parseFloat(r.Raffle?.ticketValue || 0);
            }
            return acc;
        }, 0);

        const totalRaffles = reservations.length;
        const lastSeen = new Date(reservations[0].createdAt).toLocaleDateString('pt-BR');

        // Wins
        const wins = reservations.filter(r => 
            r.Raffle?.status === 'FINISHED' && r.Raffle?.winningNumber === r.number && r.status === 'PAID'
        );
        const winRate = totalRaffles > 0 ? `${Math.round((wins.length / totalRaffles) * 100)}%` : '0%';

        // Group distribution (spending by group)
        const groupMap = {};
        reservations.forEach(r => {
            const groupName = r.Raffle?.GroupActivation?.groupName || r.Raffle?.title || 'Outros';
            if (!groupMap[groupName]) groupMap[groupName] = 0;
            groupMap[groupName] += parseFloat(r.Raffle?.ticketValue || 0);
        });

        let spendingData = Object.entries(groupMap)
            .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
            .sort((a, b) => b.value - a.value);

        // Keep top 3 groups and group the rest into "Outros"
        if (spendingData.length > 4) {
            const top3 = spendingData.slice(0, 3);
            const rest = spendingData.slice(3).reduce((acc, item) => acc + item.value, 0);
            spendingData = [...top3, { name: 'Outros', value: Math.round(rest * 100) / 100 }];
        }

        // Win history
        const winHistory = wins.map(r => {
            const animal = r.number;
            return {
                id: r.id,
                raffle: r.Raffle?.title || 'Rifa',
                date: new Date(r.Raffle?.updatedAt || r.createdAt).toLocaleDateString('pt-BR'),
                prize: `R$ ${parseFloat(r.Raffle?.ticketValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                group: r.Raffle?.GroupActivation?.groupName || 'Grupo',
                number: animal
            };
        });

        return {
            stats: {
                totalSpent: `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                totalRaffles,
                winRate,
                winsCount: wins.length,
                lastSeen
            },
            spendingData,
            winHistory
        };
    }

    async getAllActivities(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const { count, rows } = await Reservation.findAndCountAll({
            limit,
            offset,
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

        const activities = rows.map(r => {
            const timeDiff = Date.now() - new Date(r.createdAt).getTime();
            const minutes = Math.floor(timeDiff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            let timeLabel = 'Agora';
            if (days > 0) timeLabel = `${days}d atrás`;
            else if (hours > 0) timeLabel = `${hours}h atrás`;
            else if (minutes > 0) timeLabel = `${minutes}min atrás`;

            return {
                id: r.id,
                type: 'new_reservation',
                message: `${getEmoji(r.number)} Nova reserva: dezena ${r.number} por ${r.buyerName} no grupo ${r.Raffle?.title || 'Rifa'}.`,
                time: timeLabel,
                status: r.status,
                createdAt: r.createdAt
            };
        });

        return {
            activities,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }
}

module.exports = new ReportService();
