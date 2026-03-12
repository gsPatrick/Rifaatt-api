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
                    await InstanceService.reactToMessage(instance.token, chatid, reaction, messageId);

                    let replyMsg = `📝 *Reserva para ${msg.senderName || 'Você'}*:\n`;
                    replyMsg += `✅ Confirmados: ${result.reserved.join(', ')}\n`;
                    if (result.alreadyTaken.length > 0) {
                        replyMsg += `❌ Ocupados: ${result.alreadyTaken.join(', ')}\n`;
                    }
                    replyMsg += `\n💰 Total: R$ ${(result.totalReserved * raffle.ticketValue).toFixed(2)}\n🔑 PIX: ${raffle.pixKey}\n📌 Após pagar, envie o comprovante.`;

                    await this.reply(instance.token, chatid, replyMsg);
                } else if (result.status === 'ALL_TAKEN') {
                    await InstanceService.reactToMessage(instance.token, chatid, '❌', messageId);
                    await this.reply(instance.token, chatid, `❌ Desculpe, ${msg.senderName || 'usuário'}, mas todos os números solicitados (${result.alreadyTaken.join(', ')}) já foram reservados.`);
                }
                return;
            }

            // 2. Commands Handler (Starting with !)
            if (command.startsWith('!')) {
                // Admin Validation Check
                const groupInfo = await InstanceService.getGroupInfo(instance.token, chatid);
                const participants = groupInfo.Participants || [];
                const senderParticipant = participants.find(p => p.JID === sender);
                const isAdmin = senderParticipant ? senderParticipant.IsAdmin : false;

                // User Commands (No Admin Required)
                if (command === '!valor') {
                    if (!raffle) return;
                    await this.reply(instance.token, chatid, `💰 *Valor da Dezena*: R$ ${raffle.ticketValue}\n🔑 *PIX*: ${raffle.pixKey}`);
                    return;
                }

                if (command === '!disponivel' || command === '!lista') {
                    if (!raffle) return;
                    const list = await RaffleService.generateVisualList(raffle.id);
                    await this.reply(instance.token, chatid, list);
                    return;
                }

                // Admin Commands
                if (!isAdmin) return;

                switch (command) {
                    case '!titulo':
                        if (!raffle) return;
                        raffle.title = args.join(' ');
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ Título atualizado: *${raffle.title}*`);
                        break;

                    case '!premio':
                        if (!raffle) return;
                        raffle.prize = args.join(' ');
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ Prêmio atualizado: *${raffle.prize}*`);
                        break;

                    case '!pix':
                        if (!raffle) return;
                        raffle.pixKey = args[0];
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ Chave PIX atualizada: *${raffle.pixKey}*`);
                        break;

                    case '!valor_dezena':
                        if (!raffle) return;
                        raffle.ticketValue = parseFloat(args[0]);
                        await raffle.save();
                        await this.reply(instance.token, chatid, `✅ Valor da dezena atualizado: *R$ ${raffle.ticketValue.toFixed(2)}*`);
                        break;

                    case '!iniciar':
                        if (raffle) {
                            // Validate requirements
                            const missing = [];
                            if (!raffle.title || raffle.title === 'Nova Rifa') missing.push('Título');
                            if (!raffle.prize || raffle.prize === 'A definir') missing.push('Prêmio');
                            if (!raffle.pixKey || raffle.pixKey === 'Chave PIX') missing.push('PIX');
                            if (!raffle.ticketValue) missing.push('Valor');

                            if (missing.length > 0) {
                                return this.reply(instance.token, chatid, `⚠️ *Erro*: Faltam os seguintes campos para iniciar: ${missing.join(', ')}.\nUse !titulo, !premio, !pix ou !valor_dezena.`);
                            }

                            raffle.status = 'ACTIVE';
                            await raffle.save();
                            await this.reply(instance.token, chatid, "🚀 *Rifa Iniciada!* Sucesso nas vendas! 🍀");
                        } else {
                            await Raffle.create({
                                groupJid: chatid,
                                instanceId: instance.id,
                                status: 'CREATED', // Creates but doesn't start until !iniciar
                                title: 'Nova Rifa',
                                prize: 'A definir',
                                ticketValue: 10.00,
                                pixKey: 'Chave PIX'
                            });
                            await this.reply(instance.token, chatid, "📝 *Rifa Preparada!* Use !titulo, !premio, !pix e !valor_dezena para configurar. Depois use !iniciar.");
                        }
                        break;

                    case '!finalizar':
                        if (!raffle) return;
                        // Use updateGroupAnnounce to lock group
                        await InstanceService.updateGroupAnnounce(instance.token, chatid, true);

                        raffle.status = 'FINALIZED';
                        await raffle.save();

                        const time = args.join(' ');
                        const timeMsg = time ? ` às *${time}*` : '';
                        await this.reply(instance.token, chatid, `🛑 *Vendas Encerradas${timeMsg}!* O grupo agora está bloqueado para novas mensagens.`);
                        break;

                    case '!pago':
                        if (!raffle) return;
                        const targetJid = this.getMentionedJid(msg, args);
                        if (!targetJid) return this.reply(instance.token, chatid, "❌ Mencione o usuário. Ex: !pago @user");

                        const updatedCount = await RaffleService.markAsPaid(raffle.id, targetJid);
                        await this.reply(instance.token, chatid, `✅ Confirmado! ${updatedCount} números marcados como PAGO.`);
                        break;

                    case '!add':
                        const addNum = args[0]?.replace(/\D/g, '');
                        if (!addNum) return this.reply(instance.token, chatid, "❌ Informe o número. Ex: !add 551199999999");
                        await InstanceService.updateGroupParticipants(instance.token, chatid, 'add', [`${addNum}@s.whatsapp.net`]);
                        await this.reply(instance.token, chatid, `➕ Solicitada adição de ${addNum}.`);
                        break;

                    case '!remover':
                        const remNum = args[0]?.replace(/\D/g, '') || this.getMentionedJid(msg, args);
                        if (!remNum) return this.reply(instance.token, chatid, "❌ Mencione ou informe o número.");
                        const finalRemJid = remNum.includes('@') ? remNum : `${remNum}@s.whatsapp.net`;
                        await InstanceService.updateGroupParticipants(instance.token, chatid, 'remove', [finalRemJid]);
                        await this.reply(instance.token, chatid, `➖ Removido: ${finalRemJid.split('@')[0]}`);
                        break;

                    case '!log':
                        if (!raffle) return;
                        const reservations = raffle.Reservations || [];
                        const paid = reservations.filter(r => r.status === 'PAID');
                        const totalSent = paid.length * raffle.ticketValue;
                        const pendingValue = (reservations.length - paid.length) * raffle.ticketValue;

                        let logMsg = `📊 *RESUMO FINANCEIRO*\n\n`;
                        logMsg += `📝 Total Reservas: ${reservations.length}\n`;
                        logMsg += `✅ Pagos: ${paid.length} (R$ ${totalSent.toFixed(2)})\n`;
                        logMsg += `⏳ Pendentes: ${reservations.length - paid.length} (R$ ${pendingValue.toFixed(2)})\n`;
                        logMsg += `💰 Total Geral: R$ ${(reservations.length * raffle.ticketValue).toFixed(2)}`;
                        await this.reply(instance.token, chatid, logMsg);
                        break;
                }
            }

        } catch (error) {
            console.error('Error handling webhook command:', error);
            // Optionally notify admins here
        }
    }

    async reply(token, chatid, text) {
        return await InstanceService.sendMessage(token, chatid, text);
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
