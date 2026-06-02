const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/pair', async (req, res) => {
    const phoneNumber = req.query.number; 
    
    if (!phoneNumber) {
        return res.json({ error: "Number is required! (e.g. ?number=923001234567)" });
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    sock.ev.on('creds.update', saveCreds);

    setTimeout(async () => {
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
            res.json({ success: true, code: formattedCode });
        } catch (error) {
            res.json({ success: false, error: error.message });
        }
    }, 3000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API Running on port ${PORT}`);
});
