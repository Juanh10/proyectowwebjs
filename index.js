const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

let qrCodeData = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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

client.initialize();

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
        const enviado = await Promise.race([
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
