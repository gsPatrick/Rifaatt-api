const WhatsAppInstance = require('../../Models/WhatsAppInstance');
const GroupActivation = require('../../Models/GroupActivation');
const Raffle = require('../../Models/Raffle');
const RaffleService = require('../Raffle/raffle.service');
const InstanceService = require('../Instance/instance.service');
const { Op } = require('sequelize');

class WebhookService {
    async handleEvent(payload) {
        const { event, instance: instanceKey, data } = payload;

        if (event !== 'message' && event !== 'messages') return;

        const messages = Array.isArray(data) ? data : [data];

        for (const msg of messages) {
            await this.processMessage(instanceKey, msg);
        }
    }

    async processMessage(instanceKey, msg) {
        const { chatid, sender, text, fromMe, isGroup, id: messageId } = msg;

        if (fromMe) return;
        if (!isGroup) return;

        const instance = await WhatsAppInstance.findOne({ where: { instanceKey } });
        if (!instance) return;

        // Verify active group
        const activation = await GroupActivation.findOne({
            where: {
                groupJid: chatid,
                instanceId: instance.id,
                status: 'active',
                expirationDate: { [Op.gt]: new Date() }
            }
        });

        if (!activation) return;
        if (!text) return;

        const cleanText = text.trim();
        const args = cleanText.split(/ +/);
        const command = args.shift().toLowerCase();

        try {
            const raffle = await RaffleService.getActiveRaffleByGroup(chatid);

            // 1. Handle Reservations (Number only message)
            if (/^\d+([\s,/]\d+)*$/.test(cleanText)) {
                if (!raffle || raffle.status !== 'ACTIVE') return;

                const result = await RaffleService.reserveNumbers(raffle.id, cleanText, msg.senderName || 'Usuário', sender);

                if (result.success) {
                    const reaction = result.status === 'PARTIAL' ? '❕' : '✅';
                    await InstanceService.reactToMessage(instance.token, chatid, reaction, messageId, instance.apiUrl);

                    let replyMsg = `📝 *Reserva para ${msg.senderName || 'Você'}*:\n`;
                    replyMsg += `✅ Confirmados: ${result.reserved.join(', ')}\n`;
                    if (result.alreadyTaken.length > 0) {
                        replyMsg += `❌ Ocupados: ${result.alreadyTaken.join(', ')}\n`;
                    }
                    replyMsg += `\n💰 Total: R$ ${(result.totalReserved * raffle.ticketValue).toFixed(2)}\n🔑 PIX: ${raffle.pixKey}\n📌 Após pagar, envie o comprovante.`;

                    await this.reply(instance.token, chatid, replyMsg, instance.apiUrl);
                } else if (result.status === 'ALL_TAKEN') {
                    await InstanceService.reactToMessage(instance.token, chatid, '❌', messageId, instance.apiUrl);
                    await this.reply(instance.token, chatid, `❌ Desculpe, ${msg.senderName || 'usuário'}, mas todos os números solicitados (${result.alreadyTaken.join(', ')}) já foram reservados.`, instance.apiUrl);
                }
                return;
            }

            // 2. Commands Handler (Starting with !)
            if (command.startsWith('!')) {
                // Admin Validation Check
                const groupInfo = await InstanceService.getGroupInfo(instance.token, chatid, instance.apiUrl);
                const participants = groupInfo.Participants || [];
                const senderParticipant = participants.find(p => p.JID === sender);
                const isAdmin = senderParticipant ? senderParticipant.IsAdmin : false;

                // User Commands (No Admin Required)
                if (command === '!valor') {
                    if (!raffle) return;
                    await this.reply(instance.token, chatid, `💰 *Valor da Dezena*: R$ ${raffle.ticketValue}\n🔑 *PIX*: ${raffle.pixKey}`, instance.apiUrl);
                    return;
                }

                if (command === '!disponivel' || command === '!lista') {
                    if (!raffle) return;
                    const list = await RaffleService.generateVisualList(raffle.id);
                    await this.reply(instance.token, chatid, list, instance.apiUrl);
                    return;
                }
                // These commands are now moved to Admin Commands or removed.

                // Admin Commands
                if (!isAdmin) return;

                switch (command) {
                    case '!titulo':
                        if (!raffle) {
                            raffle = await Raffle.create({ groupJid: chatid, instanceId: instance.id, status: 'CREATED', title: 'Nova Rifa', prize: 'A definir', ticketValue: 10.00, pixKey: 'Chave PIX' });
                        }
                        raffle.title = args.join(' ');
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ *Título atualizado:* ${raffle.title}`, instance.apiUrl);
                        break;

                    case '!premio':
                    case '!prêmio':
                        if (!raffle) {
                            raffle = await Raffle.create({ groupJid: chatid, instanceId: instance.id, status: 'CREATED', title: 'Nova Rifa', prize: 'A definir', ticketValue: 10.00, pixKey: 'Chave PIX' });
                        }
                        raffle.prize = args.join(' ');
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ *Prêmio atualizado:* ${raffle.prize}`, instance.apiUrl);
                        break;

                    case '!pix':
                        if (!raffle) {
                            raffle = await Raffle.create({ groupJid: chatid, instanceId: instance.id, status: 'CREATED', title: 'Nova Rifa', prize: 'A definir', ticketValue: 10.00, pixKey: 'Chave PIX' });
                        }
                        raffle.pixKey = args[0];
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ *Chave PIX atualizada:* ${raffle.pixKey}`, instance.apiUrl);
                        break;

                    case '!valor_dezena':
                        if (!raffle) {
                            raffle = await Raffle.create({ groupJid: chatid, instanceId: instance.id, status: 'CREATED', title: 'Nova Rifa', prize: 'A definir', ticketValue: 10.00, pixKey: 'Chave PIX' });
                        }
                        raffle.ticketValue = parseFloat(args[0].replace(/[^0-9.]/g, ''));
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ *Valor da dezena atualizado:* R$ ${raffle.ticketValue.toFixed(2)}`, instance.apiUrl);
                        break;

                    case '!iniciar':
                        if (raffle) {
                            if (raffle.status === 'ACTIVE') return this.reply(instance.token, chatid, "⚠️ Já existe uma rifa ativa neste grupo.", instance.apiUrl);

                            const missing = [];
                            if (!raffle.title || raffle.title === 'Nova Rifa') missing.push('Título');
                            if (!raffle.prize || raffle.prize === 'A definir') missing.push('Prêmio');
                            if (!raffle.pixKey || raffle.pixKey === 'Chave PIX') missing.push('PIX');
                            if (!raffle.ticketValue) missing.push('Valor');

                            if (missing.length > 0) {
                                return this.reply(instance.token, chatid, `⚠️ *Erro*: Faltam campos para iniciar: ${missing.join(', ')}.\nUse !titulo, !premio, !pix ou !valor_dezena.`, instance.apiUrl);
                            }

                            raffle.status = 'ACTIVE';
                            await raffle.save();
                            const visualList = await RaffleService.generateVisualList(raffle.id);
                            await this.reply(instance.token, chatid, `🚀 *RIFA INICIADA!*\n\n${visualList}`, instance.apiUrl);
                        } else {
                            await this.reply(instance.token, chatid, "📝 Use !titulo, !premio, !pix e !valor_dezena para configurar a primeira rifa.", instance.apiUrl);
                        }
                        break;

                    case '!finalizar':
                        if (!raffle || raffle.status !== 'ACTIVE') return;
                        await InstanceService.updateGroupAnnounce(instance.token, chatid, true, instance.apiUrl);
                        raffle.status = 'FINALIZED';
                        await raffle.save();
                        const schedule = args.join(' ');
                        const scheduleMsg = schedule ? ` às *${schedule}*` : ' no momento';
                        await this.reply(instance.token, chatid, `🛑 *Vendas Encerradas${scheduleMsg}!*\nO grupo foi bloqueado para novas mensagens.`, instance.apiUrl);
                        break;

                    case '!pago':
                        if (!raffle) return;
                        const targetJid = this.getMentionedJid(msg, args);
                        if (!targetJid) return this.reply(instance.token, chatid, "❌ Mencione o usuário. Ex: !pago @user", instance.apiUrl);

                        const count = await RaffleService.markAsPaid(raffle.id, targetJid);
                        await this.reply(instance.token, chatid, `✅ *Confirmado!* ${count} dezenas de @${targetJid.split('@')[0]} marcadas como PAGO.`, instance.apiUrl);
                        break;

                    case '!add':
                        const addJid = this.getMentionedJid(msg, args);
                        const addNums = args.filter(a => /^\d+$/.test(a));
                        if (!addJid || addNums.length === 0) return this.reply(instance.token, chatid, "❌ Ex: !add 10 25 @user", instance.apiUrl);

                        const addResult = await RaffleService.reserveNumbers(raffle.id, addNums.join(' '), 'Reserva Manual', addJid);
                        await this.reply(instance.token, chatid, `➕ *Adicionado:* ${addResult.reserved.join(', ')} para @${addJid.split('@')[0]}`, instance.apiUrl);
                        break;

                    case '!remover':
                        const remNums = args.filter(a => /^\d+$/.test(a));
                        if (remNums.length === 0) return this.reply(instance.token, chatid, "❌ Informe as dezenas. Ex: !remover 10 25", instance.apiUrl);
                        await RaffleService.removeReservations(raffle.id, remNums.join(' '));
                        await this.reply(instance.token, chatid, `➖ *Removido:* ${remNums.join(', ')}`, instance.apiUrl);
                        break;

                    case '!log':
                        if (!raffle) return;
                        const stats = await RaffleService.getFinanceSummary(raffle.id);
                        let logMsg = `📊 *BALANÇO DA RIFA*\n\n`;
                        logMsg += `📝 *Reservas:* ${stats.total}\n`;
                        logMsg += `✅ *Pagos:* ${stats.paid} (R$ ${stats.paidValue.toFixed(2)})\n`;
                        logMsg += `⏳ *Pendentes:* ${stats.pending} (R$ ${stats.pendingValue.toFixed(2)})\n`;
                        logMsg += `💰 *Total Previsto:* R$ ${stats.totalValue.toFixed(2)}`;
                        await this.reply(instance.token, chatid, logMsg, instance.apiUrl);
                        break;

                    case '!valor':
                        if (!raffle) return;
                        const valUser = this.getMentionedJid(msg, args) || sender;
                        const userReservations = raffle.Reservations.filter(r => r.buyerPhone === valUser);
                        if (userReservations.length === 0) return this.reply(instance.token, chatid, "❌ Você não possui reservas nesta rifa.", instance.apiUrl);

                        const total = userReservations.length * raffle.ticketValue;
                        const unpaid = userReservations.filter(r => r.status === 'PENDING').length;

                        let valMsg = `👤 *Nome:* ${msg.senderName || 'Usuário'}\n`;
                        valMsg += `🧾 *Dezena(s):* ${userReservations.map(r => r.number).join(', ')}\n`;
                        valMsg += `💰 *Valor a Pagar:* R$ ${total.toFixed(2)}\n`;
                        valMsg += `Status: ${unpaid > 0 ? '⏳ Não Pago' : '✅ Pago'}\n\n`;
                        valMsg += `🔑 *PIX:* ${raffle.pixKey}`;
                        await this.reply(instance.token, chatid, valMsg, instance.apiUrl);
                        break;

                    case '!disponivel':
                    case '!lista':
                        if (!raffle) return;
                        const reservedNums = raffle.Reservations.map(r => r.number);
                        const available = [];
                        for (let i = 1; i <= 99; i++) {
                            const n = i.toString().padStart(2, '0');
                            if (!reservedNums.includes(n)) available.push(n);
                        }
                        if (!reservedNums.includes('00')) available.push('00');
                        await this.reply(instance.token, chatid, `🟢 *Dezenas Disponíveis:*\n${available.join(' ')}`, instance.apiUrl);
                        break;
                }
            }

        } catch (error) {
            console.error('Error handling webhook command:', error);
            // Optionally notify admins here
        }
    }

    async reply(token, chatid, text, apiUrl) {
        return await InstanceService.sendMessage(token, chatid, text, apiUrl);
    }

    getMentionedJid(msg, args) {
        if (msg.mentions && msg.mentions.length > 0) {
            return msg.mentions[0];
        }
        const mention = args.find(a => a.includes('@'));
        if (mention) {
            let pureJid = mention.replace('@', '');
            if (!pureJid.includes('@')) pureJid += '@s.whatsapp.net';
            return pureJid;
        }
        return null;
    }
}

module.exports = new WebhookService();
