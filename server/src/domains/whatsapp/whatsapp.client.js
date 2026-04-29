const QRCode = require('qrcode');
const logger = require('../../shared/utils/logger');

let client = null;
let isInitializing = false;
let currentQRBase64 = null;
let status = 'disconnected'; // 'disconnected' | 'qr_pending' | 'initializing' | 'ready' | 'error'
let errorMessage = null;
let reconnectAttempts = 0;

const SEND_TIMEOUT_MS = 15_000;
const INIT_TIMEOUT_MS = 120_000; // 2 min — Chromium on Windows can be very slow
const MAX_RECONNECT_ATTEMPTS = 3;

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`WhatsApp ${label} timed out after ${SEND_TIMEOUT_MS}ms`)),
        SEND_TIMEOUT_MS
      )
    ),
  ]);

const getStatus = () => ({ status, qr: currentQRBase64, error: errorMessage });

const initialize = (sessionDataPath) => {
  if (client || isInitializing) return;
  isInitializing = true;
  status = 'initializing';
  currentQRBase64 = null;
  errorMessage = null;
  reconnectAttempts = 0;

  let Client, LocalAuth;
  try {
    ({ Client, LocalAuth } = require('whatsapp-web.js'));
  } catch (e) {
    status = 'error';
    errorMessage = 'WhatsApp module not available in this build.';
    isInitializing = false;
    logger.error('whatsapp-web.js module not found — WhatsApp features unavailable');
    return;
  }

  try {
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
          '--disable-renderer-backgrounding',
        ],
      },
    });

    client.on('qr', async (qr) => {
      try {
        currentQRBase64 = await QRCode.toDataURL(qr);
        status = 'qr_pending';
        logger.info('WhatsApp QR code generated');
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to generate QR code');
      }
    });

    client.on('ready', () => {
      status = 'ready';
      currentQRBase64 = null;
      errorMessage = null;
      reconnectAttempts = 0;
      logger.info('WhatsApp client ready');
    });

    client.on('authenticated', () => {
      logger.info('WhatsApp authenticated');
    });

    client.on('auth_failure', (msg) => {
      status = 'error';
      errorMessage = 'Authentication failed. Please reconnect and scan the QR code again.';
      currentQRBase64 = null;
      logger.error({ msg }, 'WhatsApp auth failure');
    });

    client.on('disconnected', (reason) => {
      currentQRBase64 = null;
      client = null;
      isInitializing = false;
      reconnectAttempts++;

      if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        status = 'disconnected';
        logger.warn(
          { reason, attempt: reconnectAttempts, max: MAX_RECONNECT_ATTEMPTS },
          'WhatsApp disconnected. Auto-reconnecting...'
        );
        setTimeout(() => initialize(sessionDataPath), 5000);
      } else {
        status = 'error';
        errorMessage = 'WhatsApp disconnected repeatedly. Please reconnect manually.';
        logger.warn({ reason }, 'WhatsApp disconnected. Max reconnect attempts reached.');
      }
    });

    // Timeout guard: if Chromium never finishes launching, surface an error instead
    // of leaving the UI stuck on "initializing" forever.
    const initTimeoutHandle = setTimeout(() => {
      if (status === 'initializing') {
        status = 'error';
        errorMessage =
          'WhatsApp took too long to start. Chromium may not be available on this device.';
        client = null;
        isInitializing = false;
        logger.error('WhatsApp client initialization timed out after 2 minutes');
      }
    }, INIT_TIMEOUT_MS);

    client
      .initialize()
      .then(() => clearTimeout(initTimeoutHandle))
      .catch((err) => {
        clearTimeout(initTimeoutHandle);
        status = 'error';
        errorMessage = err.message || 'WhatsApp initialization failed';
        client = null;
        isInitializing = false;
        logger.error({ err: err.message }, 'WhatsApp client initialization failed');
      });

    // Client object created and initialize() kicked off — release the guard
    isInitializing = false;
  } catch (err) {
    status = 'error';
    errorMessage = err.message || 'Failed to create WhatsApp client';
    client = null;
    isInitializing = false;
    logger.error({ err: err.message }, 'WhatsApp client creation failed');
  }
};

const sendMessage = async (phone, message) => {
  if (!client || status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  const digits = phone.replace(/\D/g, '');
  const chatId = digits.length === 10 ? `91${digits}@c.us` : `${digits}@c.us`;
  await withTimeout(client.sendMessage(chatId, message), 'sendMessage');
};

const sendMedia = async (phone, buffer, filename, caption) => {
  if (!client || status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  const digits = phone.replace(/\D/g, '');
  const chatId = digits.length === 10 ? `91${digits}@c.us` : `${digits}@c.us`;
  const { MessageMedia } = require('whatsapp-web.js');
  const media = new MessageMedia('image/png', buffer.toString('base64'), filename);
  await withTimeout(client.sendMessage(chatId, media, { caption }), 'sendMedia');
};

const destroy = async () => {
  if (!client) {
    status = 'disconnected';
    errorMessage = null;
    reconnectAttempts = 0;
    currentQRBase64 = null;
    isInitializing = false;
    return;
  }
  try {
    await client.destroy();
  } catch (err) {
    logger.warn({ err: err.message }, 'Error destroying WhatsApp client');
  } finally {
    client = null;
    isInitializing = false;
    status = 'disconnected';
    currentQRBase64 = null;
    errorMessage = null;
    reconnectAttempts = 0;
  }
};

module.exports = { initialize, getStatus, sendMessage, sendMedia, destroy };
