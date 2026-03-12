const Raffle = require('../../Models/Raffle');
const Reservation = require('../../Models/Reservation');
const GroupActivation = require('../../Models/GroupActivation');
const WhatsAppInstance = require('../../Models/WhatsAppInstance');
const InstanceService = require('../Instance/instance.service');
const { Op } = require('sequelize');

class RaffleService {
    async createRaffle(data) {
        return await Raffle.create(data);
    }

    async getActiveRaffleByGroup(groupJid) {
        return await Raffle.findOne({
            where: { groupJid, status: 'ACTIVE' },
            include: [
                { model: Reservation, required: false },
                { model: GroupActivation, required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
    }

    async getAnimalForNumber(numStr) {
        const num = parseInt(numStr);
        const normalizedNum = (num === 0) ? 100 : num;

        const animals = [
            "🦢 Cisne", "🦅 Águia", "🐴 Cavalo", "🦋 Borboleta", "🐶 Cachorro",
            "🐐 Cabra", "🐏 Carneiro", "🐫 Camelo", "🐍 Cobra", "🐇 Coelho",
            "🐎 Cavalo", "🐘 Elefante", "🐔 Galo", "🐈 Gato", "🐊 Jacaré",
            "🦁 Leão", "🦍 Macaco", "🐷 Porco", "🦚 Pavão", "🦃 Peru",
            "🐃 Touro", "🐅 Tigre", "🐻 Urso", "🦌 Veado", "🐄 Vaca"
        ];

        const index = Math.ceil(normalizedNum / 4) - 1;
        return animals[index] || "❓ Desconhecido";
    }

    async generateVisualList(raffleId) {
        const raffle = await Raffle.findByPk(raffleId);
        if (!raffle) throw new Error('Rifa não encontrada.');

        if (!raffle.title || !raffle.prize) {
            return "⚠️ *Aviso*: A rifa precisa de um Título e um Prêmio definidos para gerar a lista.";
        }

        const reservations = await Reservation.findAll({ where: { raffleId: raffleId } });
        const resMap = {};
        reservations.forEach(r => {
            resMap[r.number] = r;
        });

        let message = `🎰 *${raffle.title}*\n`;
        message += `🎁 Prêmio: ${raffle.prize}\n`;
        message += `💰 Valor: R$ ${raffle.ticketValue}\n`;
        message += `🔑 PIX: ${raffle.pixKey}\n\n`;

        const numbers = [];
        for (let i = 1; i <= 99; i++) numbers.push(i.toString().padStart(2, '0'));
        numbers.push('00');

        let currentAnimal = "";
        let line = "";

        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            const animal = await this.getAnimalForNumber(num);
            const res = resMap[num];

            let statusEmoji = "";
            let buyerName = "";

            if (res) {
                statusEmoji = res.status === 'PAID' ? '✅' : '❌';
                buyerName = ` ${res.buyerName}`;
            }

            const animalEmoji = animal.split(' ')[0];
            const item = `${animalEmoji}${num}.${buyerName}${statusEmoji}`;

            if (animal !== currentAnimal) {
                if (line) message += line + "\n";
                currentAnimal = animal;
                line = item;
            } else {
                line += " | " + item;
            }
        }
        message += line;

        return message;
    }

    async reserveNumbers(raffleId, numbersStr, buyerName, buyerPhone) {
        // Parse numbers: handles 3 5 6 or 45/34/12 or 01,02
        const numbers = numbersStr.split(/[\s,/]+/)
            .filter(n => n.length > 0)
            .map(n => n.padStart(2, '0'));

        if (numbers.length === 0) {
            return { success: false, error: 'Nenhum número válido fornecido.' };
        }

        const invalidNumbers = numbers.filter(num => !/^\d{2,3}$/.test(num));
        if (invalidNumbers.length > 0) {
            return {
                success: false,
                error: `Número(s) inválido(s): ${invalidNumbers.join(', ')}.`,
                invalid: invalidNumbers
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

    async getHistory(userId) {
        return await Raffle.findAll({
            where: { status: 'FINISHED' },
            include: [{
                model: Reservation,
                required: false
            }]
        });
    }

    async removeReservations(raffleId, numbersStr) {
        const numbers = numbersStr.split(/[\s,]+/).filter(n => n.length > 0).map(n => n.padStart(2, '0'));
        return await Reservation.destroy({
            where: {
                raffleId,
                number: { [Op.in]: numbers }
            }
        });
    }

    async createAndActivateGroup(userId, instanceId, groupName) {
        const instance = await WhatsAppInstance.findByPk(instanceId);
        if (!instance) throw new Error('Instância não encontrada.');
        if (instance.status !== 'connected') throw new Error('A instância deve estar conectada para criar um grupo.');

        // 1. Create group via UazAPI
        const groupData = await InstanceService.createGroup(instance.token, groupName);
        if (!groupData.id) throw new Error('Falha ao obter JID do novo grupo.');

        // 2. Activate group in our database
        // Default expiration: 30 days
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

    async finalizeWithWinner(raffleId, winningNumber) {
        const raffle = await Raffle.findByPk(raffleId, {
            include: [{ model: WhatsAppInstance }]
        });
        if (!raffle) throw new Error('Rifa não encontrada.');

        raffle.winningNumber = winningNumber;
        raffle.status = 'FINISHED';
        await raffle.save();

        // Find the winner
        const winner = await Reservation.findOne({
            where: { raffleId, number: winningNumber, status: 'PAID' }
        });

        const instance = raffle.WhatsAppInstance;
        if (!instance) return raffle;

        if (winner) {
            const congratMsg = `🥳 *PARABÉNS!* 🥳\n\nVocê ganhou a rifa *${raffle.title}* com o número *${winningNumber}*! 🏆\n\nPrêmio: ${raffle.prize}`;
            await InstanceService.sendMessage(instance.token, winner.buyerPhone, congratMsg);

            const groupMsg = `📢 *RESULTADO DA RIFA* 📢\n\nO grande vencedor da rifa *${raffle.title}* foi *${winner.buyerName}* com o número *${winningNumber}*! 🏆🥂\n\nParabéns ao ganhador!`;
            await InstanceService.sendMessage(instance.token, raffle.groupJid, groupMsg);
        } else {
            const groupMsg = `🏁 *RIFA FINALIZADA* 🏁\n\nA rifa *${raffle.title}* foi encerrada. O número sorteado foi *${winningNumber}*.\n\nInfelizmente este número não foi vendido ou não estava pago.`;
            await InstanceService.sendMessage(instance.token, raffle.groupJid, groupMsg);
        }

        return raffle;
    }
}

module.exports = new RaffleService();
