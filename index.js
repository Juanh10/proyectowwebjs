const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

let qrCodeData = null;
let clienteListo = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions'
        ]
    }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    clienteListo = false;
    console.log('QR recibido. Escanea en la web /qr');
});

client.on('authenticated', () => {
    console.log('Autenticado correctamente');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp listo');
    clienteListo = true;
    qrCodeData = null;
});

client.on('disconnected', (reason) => {
    console.log('Desconectado:', reason);
    clienteListo = false;
});

client.initialize().catch(err => {
    console.error('Error al inicializar:', err.message);
});

app.get('/qr', async (req, res) => {
    if (!qrCodeData) return res.send('QR no disponible o ya autenticado.');
    const qrImageUrl = await QRCode.toDataURL(qrCodeData);
    res.send(`<img src="${qrImageUrl}" style="width:300px"/>`);
});

app.get('/status', (req, res) => {
    res.send({ listo: clienteListo, info: client.info || null });
});

app.all('/api/enviar', async (req, res) => {
    const { numero, mensaje } = req.method === 'GET' ? req.query : req.body;

    console.log('Solicitud recibida:', numero, mensaje);

    if (!clienteListo) {
        console.error('Cliente no está listo todavía');
        return res.status(503).send({ error: 'WhatsApp no está listo, intenta en unos segundos' });
    }

    if (!numero || !mensaje) {
        return res.status(400).send({ error: 'Faltan número o mensaje' });
    }

    const numeroFormateado = numero.includes('@c.us') ? numero : numero + '@c.us';

    try {
        await client.sendMessage(numeroFormateado, mensaje);
        console.log('Mensaje enviado correctamente a', numero);
        res.send({ success: true, msg: 'Mensaje enviado' });
    } catch (error) {
        console.error('Error al enviar mensaje:', error.message);
        res.status(500).send({ error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});
