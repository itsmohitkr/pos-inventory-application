const waClient = require('./whatsapp.client');
const settingService = require('../setting/setting.service');
const visualService = require('./visual.service');
const logger = require('../../shared/utils/logger');

const WA_SESSION_PATH_KEY = 'whatsappSessionPath';

const getConnectionStatus = () => waClient.getStatus();

const initializeClient = async () => {
  const sessionPath = process.env.WA_SESSION_PATH || './whatsapp-session';
  waClient.initialize(sessionPath);
  logger.info({ sessionPath }, 'WhatsApp client initialization requested');
};

const destroyClient = async () => {
  await waClient.destroy();
  logger.info('WhatsApp client destroyed');
};

const isEnabled = async () => {
  const enabled = await settingService.getSettingByKey('whatsappEnabled');
  return enabled === true;
};

const sendCustomerBarcode = async ({ phone, barcode, shopName, customerName }) => {
  try {
    const cardBuffer = await visualService.generateCustomerCard({ 
      phone, 
      barcode, 
      shopName: shopName || 'Bachat Bazar', 
      customerName 
    });
    
    await waClient.sendMedia(
      phone, 
      cardBuffer, 
      `customer-card-${barcode}.png`, 
      `🎫 Your ${shopName || 'Bachat Bazar'} Premium Customer Card`
    );
    
    logger.info({ phone, barcode }, 'Visual customer card sent via WhatsApp');
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Failed to send visual customer card');
    // Fallback to text if image generation fails
    const message = `*Your Customer Card* 🎫\nBarcode: \`${barcode}\`\n_— ${shopName || 'Bachat Bazar'}_`;
    await waClient.sendMessage(phone, message).catch(e => {
      logger.error({ err: e.message }, 'WhatsApp fallback message also failed');
    });
  }
};

const sendSaleReceipt = async ({ phone, sale, shopName }) => {
  try {
    // Fetch shop metadata for the receipt header
    const shopMobile = await settingService.getSettingByKey('shopMobile');
    const shopAddress = await settingService.getSettingByKey('shopAddress');
    const shopGST = await settingService.getSettingByKey('shopGST');
    
    const receiptBuffer = await visualService.generateReceiptImage({ 
      sale, 
      shopName: shopName || 'Bachat Bazar',
      shopMetadata: { shopMobile, shopAddress, shopGST }
    });

    await waClient.sendMedia(
      phone, 
      receiptBuffer, 
      `receipt-${sale.id}.png`, 
      `🧾 Your receipt from ${shopName || 'Bachat Bazar'} (Sale #${sale.id})`
    );

    logger.info({ phone, saleId: sale.id }, 'Visual sale receipt sent via WhatsApp');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to send visual receipt');
    // Fallback to text
    const date = new Date(sale.createdAt).toLocaleString();
    const message = `*RECEIPT: ${shopName || 'Bachat Bazar'}*\nSale ID: #${sale.id}\nDate: ${date}\nTotal: ₹${sale.totalAmount.toFixed(2)}\n_Thank you!_`;
    await waClient.sendMessage(phone, message);
  }
};

const sendCapturedCard = async ({ phone, base64Image, caption }) => {
  try {
    const settings = await settingService.getAllSettings();
    if (!settings.whatsappEnabled) {
      throw new Error('WhatsApp integration is disabled in settings.');
    }

    // Extract the base64 data from the data URL (e.g. "data:image/png;base64,iVBORw0KGgo...")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    await waClient.sendMedia(phone, buffer, 'customer-card.png', caption);
    logger.info({ phone }, 'Successfully sent captured visual customer card');
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Failed to send captured customer card');
    throw err;
  }
};

module.exports = {
  getConnectionStatus,
  initializeClient,
  destroyClient,
  isEnabled,
  sendCustomerBarcode,
  sendSaleReceipt,
  sendCapturedCard,
};
