const Raffle = require('../../Models/Raffle');
const Reservation = require('../../Models/Reservation');
const { GroupActivation, User, Plan } = require('../../Models');
const WhatsAppInstance = require('../../Models/WhatsAppInstance');
const InstanceService = require('../Instance/instance.service');
const { Op } = require('sequelize');

class RaffleService {
    async createRaffle(data) {
        // Validation: Verify if the group is active
        const activation = await GroupActivation.findOne({
            where: { groupJid: data.groupJid, status: 'active' }
        });

        if (!activation) {
            throw new Error('Este grupo não está ativado. Ative o grupo antes de criar uma rifa.');
        }

        // Check if there is already a raffle for this group that is NOT finished
        const existingRaffle = await Raffle.findOne({
            where: {
                groupJid: data.groupJid,
                status: { [Op.in]: ['CREATED', 'PENDING', 'ACTIVE'] }
            }
        });

        if (existingRaffle) {
            // If it's active, block ticketValue changes
            if (existingRaffle.status === 'ACTIVE' && data.ticketValue && parseFloat(data.ticketValue) !== parseFloat(existingRaffle.ticketValue)) {
                throw new Error('Não é possível alterar o valor da dezena de uma rifa ativa.');
            }
            
            // Update existing raffle
            return await existingRaffle.update(data);
        }

        return await Raffle.create(data);
    }

    async getLatestRaffleByGroup(groupJid) {
        return await Raffle.findOne({
            where: {
                groupJid,
                status: { [Op.in]: ['CREATED', 'ACTIVE'] }
            },
            order: [['createdAt', 'DESC']]
        });
    }

    async getActiveRaffleByGroup(groupJid) {
        console.log(`[RaffleService] Searching for active raffle in group: ${groupJid}`);
        const raffle = await Raffle.findOne({
            where: { groupJid, status: 'ACTIVE' },
            include: [
                { model: Reservation, required: false },
                { model: WhatsAppInstance, required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        if (raffle) {
            console.log(`[RaffleService] Active raffle FOUND: ${raffle.title} (ID: ${raffle.id})`);
        } else {
            console.log(`[RaffleService] No active raffle found in DB for group: ${groupJid}`);
            // Diagnostic: Check if any raffle exists for this group at all
            const anyRaffle = await Raffle.findOne({ where: { groupJid } });
            if (anyRaffle) {
                console.log(`[RaffleService] DIAGNOSTIC: Found a raffle for this group but status is: ${anyRaffle.status}`);
            } else {
                console.log(`[RaffleService] DIAGNOSTIC: No raffle record exists for this group JID.`);
            }
        }
        return raffle;
    }

    async getAnimalForNumber(numStr) {
        const num = parseInt(numStr);
        const dict = {
            '01': { e: '🦩', n: 'Avestruz' }, '02': { e: '🦩', n: 'Avestruz' }, '03': { e: '🦩', n: 'Avestruz' }, '04': { e: '🦩', n: 'Avestruz' },
            '05': { e: '🦅', n: 'Águia' }, '06': { e: '🦅', n: 'Águia' }, '07': { e: '🦅', n: 'Águia' }, '08': { e: '🦅', n: 'Águia' },
            '09': { e: '🫏', n: 'Burro' }, '10': { e: '🫏', n: 'Burro' }, '11': { e: '🫏', n: 'Burro' }, '12': { e: '🫏', n: 'Burro' },
            '13': { e: '🦋', n: 'Borboleta' }, '14': { e: '🦋', n: 'Borboleta' }, '15': { e: '🦋', n: 'Borboleta' }, '16': { e: '🦋', n: 'Borboleta' },
            '17': { e: '🐶', n: 'Cachorro' }, '18': { e: '🐶', n: 'Cachorro' }, '19': { e: '🐶', n: 'Cachorro' }, '20': { e: '🐶', n: 'Cachorro' },
            '21': { e: '🐐', n: 'Cabra' }, '22': { e: '🐐', n: 'Cabra' }, '23': { e: '🐐', n: 'Cabra' }, '24': { e: '🐐', n: 'Cabra' },
            '25': { e: '🐑', n: 'Carneiro' }, '26': { e: '🐑', n: 'Carneiro' }, '27': { e: '🐑', n: 'Carneiro' }, '28': { e: '🐑', n: 'Carneiro' },
            '29': { e: '🐫', n: 'Camelo' }, '30': { e: '🐫', n: 'Camelo' }, '31': { e: '🐫', n: 'Camelo' }, '32': { e: '🐫', n: 'Camelo' },
            '33': { e: '🐍', n: 'Cobra' }, '34': { e: '🐍', n: 'Cobra' }, '35': { e: '🐍', n: 'Cobra' }, '36': { e: '🐍', n: 'Cobra' },
            '37': { e: '🐇', n: 'Coelho' }, '38': { e: '🐇', n: 'Coelho' }, '39': { e: '🐇', n: 'Coelho' }, '40': { e: '🐇', n: 'Coelho' },
            '41': { e: '🐎', n: 'Cavalo' }, '42': { e: '🐎', n: 'Cavalo' }, '43': { e: '🐎', n: 'Cavalo' }, '44': { e: '🐎', n: 'Cavalo' },
            '45': { e: '🐘', n: 'Elefante' }, '46': { e: '🐘', n: 'Elefante' }, '47': { e: '🐘', n: 'Elefante' }, '48': { e: '🐘', n: 'Elefante' },
            '49': { e: '🐓', n: 'Galo' }, '50': { e: '🐓', n: 'Galo' }, '51': { e: '🐓', n: 'Galo' }, '52': { e: '🐓', n: 'Galo' },
            '53': { e: '🐈', n: 'Gato' }, '54': { e: '🐈', n: 'Gato' }, '55': { e: '🐈', n: 'Gato' }, '56': { e: '🐈', n: 'Gato' },
            '57': { e: '🐊', n: 'Jacaré' }, '58': { e: '🐊', n: 'Jacaré' }, '59': { e: '🐊', n: 'Jacaré' }, '60': { e: '🐊', n: 'Jacaré' },
            '61': { e: '🦁', n: 'Leão' }, '62': { e: '🦁', n: 'Leão' }, '63': { e: '🦁', n: 'Leão' }, '64': { e: '🦁', n: 'Leão' },
            '65': { e: '🐒', n: 'Macaco' }, '66': { e: '🐒', n: 'Macaco' }, '67': { e: '🐒', n: 'Macaco' }, '68': { e: '🐒', n: 'Macaco' },
            '69': { e: '🐖', n: 'Porco' }, '70': { e: '🐖', n: 'Porco' }, '71': { e: '🐖', n: 'Porco' }, '72': { e: '🐖', n: 'Porco' },
            '73': { e: '🦚', n: 'Pavão' }, '74': { e: '🦚', n: 'Pavão' }, '75': { e: '🦚', n: 'Pavão' }, '76': { e: '🦚', n: 'Pavão' },
            '77': { e: '🦃', n: 'Peru' }, '78': { e: '🦃', n: 'Peru' }, '79': { e: '🦃', n: 'Peru' }, '80': { e: '🦃', n: 'Peru' },
            '81': { e: '🐃', n: 'Touro' }, '82': { e: '🐃', n: 'Touro' }, '83': { e: '🐃', n: 'Touro' }, '84': { e: '🐃', n: 'Touro' },
            '85': { e: '🐯', n: 'Tigre' }, '86': { e: '🐯', n: 'Tigre' }, '87': { e: '🐯', n: 'Tigre' }, '88': { e: '🐯', n: 'Tigre' },
            '89': { e: '🐻', n: 'Urso' }, '90': { e: '🐻', n: 'Urso' }, '91': { e: '🐻', n: 'Urso' }, '92': { e: '🐻', n: 'Urso' },
            '93': { e: '🦌', n: 'Veado' }, '94': { e: '🦌', n: 'Veado' }, '95': { e: '🦌', n: 'Veado' }, '96': { e: '🦌', n: 'Veado' },
            '97': { e: '🐄', n: 'Vaca' }, '98': { e: '🐄', n: 'Vaca' }, '99': { e: '🐄', n: 'Vaca' }, '00': { e: '🐄', n: 'Vaca' }
        };
        const normalized = numStr.padStart(2, '0');
        return dict[normalized] || { e: '❓', n: 'Desconhecido' };
    }

    async generateVisualList(raffleId) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        const reservations = await Reservation.findAll({ where: { raffleId: raffleId } });
        const resMap = {};
        reservations.forEach(r => {
            resMap[r.number] = r;
        });

        let message = `🎰 *${raffle.title}*\n`;
        message += `🎁 *PRÊMIO:* ${raffle.prize}\n`;
        message += `💰 *VALOR:* R$ ${raffle.ticketValue}\n`;
        message += `🔑 *PIX:* ${raffle.pixKey}\n\n`;

        const padSize = (raffle.numbersCount || 100).toString().length - 1;
        const total = raffle.numbersCount || 100;
        
        for (let i = 0; i < total; i++) {
            const num = i.toString().padStart(padSize, '0');
            const animal = await this.getAnimalForNumber(num);
            const res = resMap[num];

            let status = "";
            let buyer = "";

            if (res) {
                status = res.status === 'PAID' ? '✅' : '⏳';
                buyer = ` ${res.buyerName}`;
            }

            message += `${animal.e}${num}.${buyer} ${status}\n`;
        }

        return message;
    }

    async generateAvailableList(raffleId) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        const reservations = await Reservation.findAll({ where: { raffleId: raffleId } });
        const takenNumbers = reservations.map(r => r.number);

        let message = `🎰 *${raffle.title}*\n`;
        message += `🎁 *PRÊMIO:* ${raffle.prize}\n`;
        message += `💰 *VALOR:* R$ ${raffle.ticketValue}\n`;
        message += `🔑 *PIX:* ${raffle.pixKey}\n\n`;
        message += `✅ *DEZENAS DISPONÍVEIS:* \n\n`;

        const padSize = (raffle.numbersCount || 100).toString().length - 1;
        const total = raffle.numbersCount || 100;
        
        const available = [];
        for (let i = 0; i < total; i++) {
            const num = i.toString().padStart(padSize, '0');
            if (!takenNumbers.includes(num)) {
                available.push(num);
            }
        }

        if (available.length === 0) {
            message += "⚠️ Todas as dezenas já foram vendidas!";
        } else {
            // Group by animal for better display
            let currentAnimal = "";
            for (const num of available) {
                const animal = await this.getAnimalForNumber(num);
                if (animal.n !== currentAnimal) {
                    message += `\n*${animal.e} ${animal.n}:* `;
                    currentAnimal = animal.n;
                }
                message += `${num} `;
            }
        }

        return message;
    }

    async getUserSummary(raffleId, buyerPhone) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        const reservations = await Reservation.findAll({
            where: { raffleId, buyerPhone }
        });

        if (reservations.length === 0) return null;

        const paid = reservations.filter(r => r.status === 'PAID');
        const pending = reservations.filter(r => r.status === 'PENDING');
        const total = reservations.length * raffle.ticketValue;
        
        const buyerName = reservations[0].buyerName;

        let message = `👤 *RESUMO: ${buyerName}*\n\n`;
        
        if (pending.length > 0) {
            message += `⏳ *Pendentes (${pending.length}):* ${pending.map(r => r.number).join(', ')}\n`;
        }
        if (paid.length > 0) {
            message += `✅ *Pagos (${paid.length}):* ${paid.map(r => r.number).join(', ')}\n`;
        }
        
        message += `\n💰 *Total:* R$ ${total.toFixed(2)}\n`;
        message += `🔑 *PIX:* ${raffle.pixKey}\n\n`;
        message += `📌 Após pagar, envie o comprovante para confirmar suas dezenas.`;

        return message;
    }

    async reserveNumbers(raffleId, numbersStr, buyerName, buyerPhone) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        // Determine padding based on numbersCount (2 for 100, 3 for 1000)
        const padSize = (raffle.numbersCount || 100).toString().length - 1;
        const maxNumber = raffle.numbersCount || 100;

        // Parse and normalize numbers: handles 3 5 6 or 45/34/12 or 01,02 or multiline
        const numbers = numbersStr.split(/[\s,.\-/:\n]+/)
            .filter(n => n.length > 0)
            .map(n => parseInt(n)) // Convert to integer first to clean up (e.g., 001 -> 1)
            .filter(n => !isNaN(n)) // Keep only valid numbers
            .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
            .map(n => n.toString().padStart(padSize, '0')); // Re-pad to correct size (e.g., 1 -> 01)

        if (numbers.length === 0) {
            return { success: false, error: 'Nenhum número válido fornecido.' };
        }

        // Validate range
        const outOfRange = numbers.filter(num => parseInt(num) >= maxNumber || parseInt(num) < 0);
        if (outOfRange.length > 0) {
            return {
                success: false,
                error: `Número(s) fora do intervalo (0-${maxNumber - 1}): ${outOfRange.join(', ')}.`
            };
        }

        // Check availability
        const existing = await Reservation.findAll({
            where: {
                raffleId,
                number: { [Op.in]: numbers }
            }
        });

        const alreadyTaken = existing.map(r => r.number);
        const available = numbers.filter(n => !alreadyTaken.includes(n));

        if (available.length === 0) {
            return {
                success: false,
                status: 'ALL_TAKEN',
                alreadyTaken
            };
        }

        const reserved = await Promise.all(available.map(number =>
            Reservation.create({
                raffleId,
                buyerName,
                buyerPhone,
                number,
                status: 'PENDING'
            })
        ));

        return {
            success: true,
            status: alreadyTaken.length > 0 ? 'PARTIAL' : 'FULL',
            reserved: reserved.map(r => r.number),
            alreadyTaken,
            totalReserved: reserved.length
        };
    }

    async markAsPaid(raffleId, buyerPhone) {
        const result = await Reservation.update(
            { status: 'PAID' },
            { where: { raffleId, buyerPhone } }
        );
        return result[0];
    }

    async listGroups(userId) {
        return await GroupActivation.findAll({
            include: [{
                model: WhatsAppInstance,
                where: { userId }
            }]
        });
    }

    async getRaffleDashboard(userId) {
        const groups = await GroupActivation.findAll({
            include: [{
                model: WhatsAppInstance,
                where: { userId },
                required: true
            }, {
                model: Raffle,
                required: false,
                include: [{ model: Reservation, required: false }]
            }],
            order: [
                ['groupName', 'ASC'],
                [Raffle, 'createdAt', 'DESC']
            ]
        });

        return groups.map(group => {
            const raffles = group.Raffles || [];
            const latestRaffle = raffles[0] || null;
            
            let stats = null;
            if (latestRaffle) {
                const reservations = latestRaffle.Reservations || [];
                const paid = reservations.filter(r => r.status === 'PAID').length;
                const reserved = reservations.filter(r => r.status === 'PENDING').length;
                stats = {
                    total: latestRaffle.numbersCount || 100,
                    paid,
                    reserved,
                    free: (latestRaffle.numbersCount || 100) - paid - reserved
                };
            }

            const groupData = group.toJSON();
            delete groupData.Raffles; // Remove the full list

            return {
                ...groupData,
                latestRaffle: latestRaffle ? {
                    ...latestRaffle.toJSON(),
                    stats,
                    Reservations: undefined // Remove reservations detail to keep it light
                } : null
            };
        });
    }

    async getHistory(userId) {
        return await Raffle.findAll({
            where: { status: 'FINISHED' },
            include: [
                {
                    model: WhatsAppInstance,
                    where: { userId },
                    required: true
                },
                {
                    model: Reservation,
                    required: false
                },
                {
                    model: GroupActivation,
                    required: false
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
    }

    async getFinanceSummary(raffleId) {
        const raffle = await Raffle.findByPk(raffleId, {
            include: [{ model: Reservation }]
        });
        if (!raffle) throw new Error('Rifa não encontrada.');

        const reservations = raffle.Reservations || [];
        const paid = reservations.filter(r => r.status === 'PAID');
        const pending = reservations.length - paid.length;

        return {
            total: reservations.length,
            paid: paid.length,
            pending: pending,
            paidValue: paid.length * raffle.ticketValue,
            pendingValue: pending * raffle.ticketValue,
            totalValue: reservations.length * raffle.ticketValue
        };
    }

    async getDetailedLog(raffleId) {
        const raffle = await Raffle.findByPk(raffleId, {
            include: [{ model: Reservation }]
        });
        if (!raffle) throw new Error('Rifa não encontrada.');

        const reservations = raffle.Reservations || [];
        if (reservations.length === 0) {
            return "🏷️ A rifa ainda não possui participantes.";
        }

        const userGroups = {};
        for (const res of reservations) {
            const key = res.buyerPhone || res.buyerName || 'Desconhecido';
            if (!userGroups[key]) {
                userGroups[key] = {
                    name: res.buyerName || 'Desconhecido',
                    reservations: [],
                    totalPending: 0
                };
            }
            userGroups[key].reservations.push(res);
            if (res.status !== 'PAID') {
                userGroups[key].totalPending += Number(raffle.ticketValue);
            }
        }

        let message = `🏷️ Lista de Participantes da Rifa (Dezenas):\n\n`;

        for (const key in userGroups) {
            const group = userGroups[key];
            const isFullyPaid = group.totalPending === 0;

            message += `👤 Nome: ${group.name}\n`;
            message += `🧾 Dezena(s) escolhida(s):\n`;

            group.reservations.sort((a, b) => parseInt(a.number) - parseInt(b.number));

            for (const res of group.reservations) {
                message += `${res.number} ~> 1x = R$ ${Number(raffle.ticketValue).toFixed(2)}\n`;
            }

            message += `💰 Valor a Pagar: R$ ${group.totalPending.toFixed(2)}\n`;
            if (isFullyPaid) {
                message += `Status de Pagamento: ✅ Pago\n\n`;
            } else {
                message += `Status de Pagamento: ⏳ Não Pago\n\n`;
            }
        }

        return message.trim();
    }

    async removeReservations(raffleId, numbersStr) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        const padSize = (raffle.numbersCount || 100).toString().length - 1;

        const numbers = numbersStr.split(/[\s,.\-/:\n]+/)
            .filter(n => n.length > 0)
            .map(n => parseInt(n))
            .filter(n => !isNaN(n))
            .map(n => n.toString().padStart(padSize, '0'));

        return await Reservation.destroy({
            where: {
                raffleId,
                number: { [Op.in]: numbers }
            }
        });
    }

    async createAndActivateGroup(userId, instanceId, groupName) {
        const user = await User.findByPk(userId, { include: [Plan] });
        if (!user) throw new Error('Usuário não encontrado.');

        const groupCount = await GroupActivation.count({
            include: [{
                model: WhatsAppInstance,
                where: { userId }
            }],
            where: { status: 'active' }
        });

        const limit = user.Plan ? user.Plan.groupLimit : 1;
        if (user.role !== 'ADMIN' && groupCount >= limit) {
            throw new Error(`Limite de grupos ativos atingido para o seu plano (${limit}).`);
        }

        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instância não encontrada.');
        if (instance.status !== 'connected') throw new Error('A instância deve estar conectada para criar um grupo.');

        const groupData = await InstanceService.createGroup(instance.token, groupName, [], instance.apiUrl);
        if (!groupData.id) throw new Error('Falha ao obter JID do novo grupo.');

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        const activation = await GroupActivation.create({
            groupJid: groupData.id,
            groupName: groupName,
            instanceId: instanceId,
            expirationDate,
            status: 'active'
        });

        return activation;
    }

    async activateExistingGroup(userId, instanceId, jid, name) {
        const user = await User.findByPk(userId, { include: [Plan] });
        if (!user) throw new Error('Usuário não encontrado.');

        const existingActivation = await GroupActivation.findOne({ where: { groupJid: jid, status: 'active' } });
        
        // If it's already active, we don't count it as a "new" activation for the limit check if it's just a refresh
        // But if it's inactive and we are activating, or it's a new one:
        if (!existingActivation) {
            const groupCount = await GroupActivation.count({
                include: [{
                    model: WhatsAppInstance,
                    where: { userId }
                }],
                where: { status: 'active' }
            });

            const limit = user.Plan ? user.Plan.groupLimit : 1;
            if (user.role !== 'ADMIN' && groupCount >= limit) {
                throw new Error(`Limite de grupos ativos atingido para o seu plano (${limit}).`);
            }
        }

        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instância não encontrada.');
        if (instance.status !== 'connected') throw new Error('Instância offline.');

        // Set expiration to 30 days by default
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        // Check if already activated
        const existing = await GroupActivation.findOne({ where: { groupJid: jid } });
        if (existing) {
            existing.status = 'active';
            existing.expirationDate = expirationDate;
            existing.instanceId = instanceId;
            existing.groupName = name;
            await existing.save();
            return existing;
        }

        const activation = await GroupActivation.create({
            groupJid: jid,
            groupName: name,
            instanceId: instanceId,
            expirationDate,
            status: 'active'
        });

        return activation;
    }

    async finalizeWithWinner(raffleId, winningNumber) {
        const raffle = await Raffle.findByPk(raffleId, {
            include: [{ model: WhatsAppInstance }]
        });
        if (!raffle) throw new Error('Rifa não encontrada.');

        const padSize = (raffle.numbersCount || 100).toString().length - 1;
        const normalizedNumber = winningNumber.toString().padStart(padSize, '0');

        raffle.winningNumber = normalizedNumber;
        raffle.status = 'FINISHED';
        await raffle.save();

        const winner = await Reservation.findOne({
            where: { raffleId, number: normalizedNumber, status: 'PAID' }
        });

        const instance = raffle.WhatsAppInstance;
        if (!instance) return raffle;

        if (winner) {
            const congratMsg = `🥳 *PARABÉNS!* 🥳\n\nVocê ganhou a rifa *${raffle.title}* com o número *${winningNumber}*! 🏆\n\nPrêmio: ${raffle.prize}`;
            await InstanceService.sendMessage(instance.token, winner.buyerPhone, congratMsg, instance.apiUrl);

            const mentionJid = winner.buyerPhone;
            const groupMsg = `📢 *RESULTADO DA RIFA* 📢\n\nO grande vencedor da rifa *${raffle.title}* foi @${mentionJid.split('@')[0]} (*${winner.buyerName}*) com o número *${winningNumber}*! 🏆🥂\n\nParabéns ao ganhador!`;
            await InstanceService.sendMessage(instance.token, raffle.groupJid, groupMsg, instance.apiUrl, [mentionJid]);
        } else {
            const groupMsg = `📢 *RESULTADO DA RIFA* 📢\n\nA rifa *${raffle.title}* foi encerrada e o número sorteado foi *${winningNumber}*!\n\n⚠️ Como este número estava livre (não foi vendido) ou não teve o pagamento confirmado, não teve ganhadores.`;
            await InstanceService.sendMessage(instance.token, raffle.groupJid, groupMsg, instance.apiUrl);
        }

        return raffle;
    }

    async getGroupsFromInstance(instanceId) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instância não encontrada.');
        if (instance.status !== 'connected') throw new Error('Instância offline.');

        const data = await InstanceService.fetchAllGroups(instance.token, instance.apiUrl);
        
        // Uazapi /group/list returns { groups: [...] }
        const groups = data.groups || [];

        if (!Array.isArray(groups)) return [];

        // Correctly filter by OwnerIsAdmin and map to frontend fields
        return groups
            .filter(g => g.OwnerIsAdmin === true)
            .map(g => ({
                id: g.JID,
                subject: g.Name
            }));
    }

    async deleteGroupActivation(id) {
        // Find the group
        const group = await GroupActivation.findByPk(id);
        if (!group) throw new Error('Grupo não encontrado.');

        // Check for active raffles
        const activeRaffle = await Raffle.findOne({
            where: {
                groupJid: group.groupJid,
                status: 'ACTIVE'
            }
        });

        if (activeRaffle) {
            throw new Error('Não é possível excluir o grupo pois existe uma rifa em andamento. Finalize a rifa primeiro.');
        }

        // Delete the group activation
        await group.destroy();
        return { message: 'Grupo excluído com sucesso.' };
    }
}

module.exports = new RaffleService();
