const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    console.log('Escanea este código QR con WhatsApp');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp listo');
});

client.initialize();

app.post('/api/enviar', async (req, res) => {
    const { numero, mensaje } = req.body;

    if(!numero || !mensaje) {
        return res.status(400).send({ error: 'Faltan número o mensaje' });
    }

    const numeroFormateado = numero.includes('@c.us') ? numero : numero + '@c.us';

    try {
        await client.sendMessage(numeroFormateado, mensaje);
        res.send({ success: true, msg: 'Mensaje enviado' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});
