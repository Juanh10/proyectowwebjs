const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

let qrCodeData = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions'
        ]
    }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    console.log('QR recibido. Escanea en la web /qr');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp listo');
    qrCodeData = null;
});

client.on('auth_failure', (msg) => {
    console.error('Fallo de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Desconectado:', reason);
});

async function iniciarWhatsApp() {
    try {
        await client.destroy();
    } catch (e) {}

    try {
        await client.initialize();
        console.log('WhatsApp inicializando...');
    } catch (err) {
        console.error('Error al inicializar:', err.message);
    }
}

iniciarWhatsApp();

app.get('/qr', async (req, res) => {
    if (!qrCodeData) return res.send('Cliente ya autenticado o QR no disponible.');
    const qrImageUrl = await QRCode.toDataURL(qrCodeData);
    res.send(`<img src="${qrImageUrl}" style="width: 300px;" />`);
});

app.post('/api/enviar', async (req, res) => {
    const { numero, mensaje } = req.body;

    console.log('Solicitud recibida:', numero, mensaje);

    if (!numero || !mensaje) {
        return res.status(400).send({ error: 'Faltan número o mensaje' });
    }

    const numeroFormateado = numero.includes('@c.us') ? numero : numero + '@c.us';

    try {
        await Promise.race([
            client.sendMessage(numeroFormateado, mensaje),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera excedido')), 15000)
            )
        ]);

        console.log('Mensaje enviado correctamente');
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
