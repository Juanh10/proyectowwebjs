const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
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

// ← ESTO ES LO NUEVO: destruir antes de inicializar
async function iniciarWhatsApp() {
    try {
        await client.destroy(); // Limpia cualquier sesión anterior
    } catch (e) {} // Ignorar error si no había nada

    try {
        await client.initialize();
        console.log('WhatsApp inicializando...');
    } catch (err) {
        console.error('Error al inicializar:', err.message);
    }
}

iniciarWhatsApp();
