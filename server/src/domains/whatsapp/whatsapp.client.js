const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const logger = require('../../shared/utils/logger');

let client = null;
let currentQRBase64 = null;
let status = 'disconnected'; // 'disconnected' | 'qr_pending' | 'initializing' | 'ready'

const getStatus = () => ({ status, qr: currentQRBase64 });

const initialize = (sessionDataPath) => {
  console.log('>>> [WA CLIENT] INITIALIZING...', sessionDataPath);
  if (client) {
    console.log('>>> [WA CLIENT] ALREADY INITIALIZED');
    return;
  }

  status = 'initializing';
  currentQRBase64 = null;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionDataPath || './whatsapp-session',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
    },
  });

  client.on('qr', async (qr) => {
    try {
      console.log('>>> [WA CLIENT] QR GENERATED');
      currentQRBase64 = await QRCode.toDataURL(qr);
      status = 'qr_pending';
      logger.info('WhatsApp QR code generated');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to generate QR code');
    }
  });

  client.on('ready', () => {
    console.log('>>> [WA CLIENT] READY!');
    status = 'ready';
    currentQRBase64 = null;
    logger.info('WhatsApp client ready');
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp authenticated');
  });

  client.on('auth_failure', (msg) => {
    status = 'disconnected';
    currentQRBase64 = null;
    logger.error({ msg }, 'WhatsApp auth failure');
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    currentQRBase64 = null;
    client = null;
    logger.warn({ reason }, 'WhatsApp disconnected. Attempting auto-reconnect in 5 seconds...');
    
    // Auto-reconnect after 5 seconds
    setTimeout(() => {
      initialize(sessionDataPath);
    }, 5000);
  });

  client.initialize().catch((err) => {
    console.error('>>> [WA CLIENT] INIT ERROR:', err.message);
    status = 'disconnected';
    client = null;
    logger.error({ err: err.message }, 'WhatsApp client initialization failed');
  });
};

const sendMessage = async (phone, message) => {
  if (!client || status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  // Format phone: strip non-digits, ensure country code (default +91 India)
  const digits = phone.replace(/\D/g, '');
  const chatId = digits.length === 10 ? `91${digits}@c.us` : `${digits}@c.us`;
  await client.sendMessage(chatId, message);
};

const sendMedia = async (phone, buffer, filename, caption) => {
  if (!client || status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  const digits = phone.replace(/\D/g, '');
  const chatId = digits.length === 10 ? `91${digits}@c.us` : `${digits}@c.us`;
  
  const media = new MessageMedia('image/png', buffer.toString('base64'), filename);
  await client.sendMessage(chatId, media, { caption });
};

const destroy = async () => {
  if (!client) return;
  try {
    await client.destroy();
  } catch (err) {
    logger.warn({ err: err.message }, 'Error destroying WhatsApp client');
  } finally {
    client = null;
    status = 'disconnected';
    currentQRBase64 = null;
  }
};

module.exports = { initialize, getStatus, sendMessage, sendMedia, destroy };
