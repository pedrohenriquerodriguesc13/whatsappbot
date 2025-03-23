const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const nodemailer = require('nodemailer');
const axios = require('axios');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages[0].key.fromMe) {
            const msg = messages[0].message.conversation;
            const sender = messages[0].key.remoteJid;
            console.log(`Mensagem recebida de ${sender}: ${msg}`);
            sendEmail(sender, msg);
            sendToN8N(sender, msg);
        }
    });

    return sock;
}

// Função para enviar o e-mail
async function sendEmail(sender, message) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'pedrohenriquerodriguesc13@gmail.com',
        subject: 'Nova Mensagem no WhatsApp',
        text: `Mensagem de ${sender}: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erro ao enviar e-mail:', error);
        } else {
            console.log('E-mail enviado:', info.response);
        }
    });
}

// Função para enviar mensagem para n8n
async function sendToN8N(sender, message) {
    await axios.post(process.env.N8N_WEBHOOK, { sender, message });
}

connectToWhatsApp();
