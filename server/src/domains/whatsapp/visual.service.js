const bwipjs = require('bwip-js');
const sharp = require('sharp');
const logger = require('../../shared/utils/logger');

/**
 * Generates a premium scannable customer card image
 */
const generateCustomerCard = async ({ phone, barcode, shopName, customerName }) => {
  try {
    // 1. Generate Barcode Buffer - Optimized for card width
    logger.debug({ barcode }, 'Generating barcode buffer for card');
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcode,
      scale: 3,
      height: 15,
      includetext: true,
      textxalign: 'center',
      paddingwidth: 10,
      paddingheight: 5,
      backgroundcolor: 'ffffff',
    });

    // 2. Create Card Design with SVG (800x500 Canvas)
    const width = 800;
    const height = 500;
    
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f0c29;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#302b63;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#24243e;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="glossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.07);stop-opacity:1" />
            <stop offset="60%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Main Card Body -->
        <rect x="0" y="0" width="${width}" height="${height}" rx="32" fill="url(#cardGrad)" />
        
        <!-- Glossy Shimmer -->
        <rect x="-160" y="-200" width="1000" height="500" fill="url(#glossGrad)" transform="rotate(-15)" />
        
        <!-- Top Row: Shop Name & Badge -->
        <text x="64" y="80" font-family="Arial" font-weight="900" font-size="40" fill="#D4AF37" letter-spacing="1">${(shopName || 'Bachat Bazar').toUpperCase()}</text>
        
        <rect x="520" y="50" width="220" height="45" rx="10" fill="none" stroke="rgba(212, 175, 55, 0.5)" stroke-width="2" />
        <text x="630" y="81" font-family="Arial" font-weight="800" font-size="16" fill="#D4AF37" text-anchor="middle" letter-spacing="4">PREMIUM MEMBER</text>
        
        <!-- Middle Row: Card Holder Info -->
        <text x="64" y="240" font-family="Arial" font-weight="600" font-size="16" fill="rgba(255,255,255,0.4)" letter-spacing="4">CARD HOLDER</text>
        <text x="64" y="300" font-family="Arial" font-weight="bold" font-size="58" fill="white" letter-spacing="1">${(customerName || 'Valued Customer').toUpperCase()}</text>
        <text x="64" y="350" font-family="monospace" font-size="32" fill="rgba(255,255,255,0.8)" letter-spacing="4">${phone}</text>
        
        <!-- Barcode Section -->
        <rect x="64" y="385" width="672" height="90" rx="20" fill="white" />
      </svg>
    `;

    // 3. Composite with Sharp
    logger.debug('Compositing with Sharp');
    const cardBase = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: Buffer.from(svgOverlay), top: 0, left: 0 },
        { input: barcodeBuffer, top: 400, left: (width - 320) / 2 }, 
      ])
      .png()
      .toBuffer();

    logger.debug('Card generation successful');
    return cardBase;
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Failed to generate customer card image');
    throw err;
  }
};

/**
 * Generates a visual thermal-style receipt image
 */
const generateReceiptImage = async ({ sale, shopName, shopMetadata }) => {
  try {
    const width = 500;
    const headerHeight = 220;
    const itemHeight = 35;
    const footerHeight = 180;
    
    const itemsCount = sale.items.length;
    const dynamicHeight = headerHeight + (itemsCount * itemHeight) + footerHeight + 80;
    
    const dateStr = new Date(sale.createdAt).toLocaleString();
    
    // Build Items SVG rows
    let itemsSvg = '';
    sale.items.forEach((item, index) => {
      const y = headerHeight + (index * itemHeight) + 40;
      const name = (item.batch?.product?.name || 'Item').substring(0, 22);
      const qty = item.quantity;
      const price = item.sellingPrice.toFixed(2);
      const total = (qty * item.sellingPrice).toFixed(2);
      
      itemsSvg += `
        <text x="30" y="${y}" font-family="Courier" font-size="16" fill="#333">${name}</text>
        <text x="280" y="${y}" font-family="Courier" font-size="16" fill="#333" text-anchor="end">${qty} x ${price}</text>
        <text x="470" y="${y}" font-family="Courier" font-size="16" fill="black" font-weight="bold" text-anchor="end">₹${total}</text>
      `;
    });

    const summaryY = headerHeight + (itemsCount * itemHeight) + 60;

    const receiptSvg = `
      <svg width="${width}" height="${dynamicHeight}">
        <!-- Background -->
        <rect x="0" y="0" width="${width}" height="${dynamicHeight}" fill="#f0f2f5" />
        <rect x="15" y="15" width="${width-30}" height="${dynamicHeight-30}" fill="white" rx="10" />
        
        <!-- Header -->
        <text x="${width/2}" y="70" font-family="Arial" font-weight="900" font-size="36" fill="#1a2a6c" text-anchor="middle">${(shopName || 'Bachat Bazar').toUpperCase()}</text>
        <text x="${width/2}" y="105" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">${shopMetadata?.shopAddress || 'Official Outlet'}</text>
        <text x="${width/2}" y="125" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">Contact: ${shopMetadata?.shopMobile || 'N/A'}</text>
        
        <rect x="30" y="150" width="440" height="40" rx="5" fill="#f8fafc" />
        <text x="45" y="175" font-family="Arial" font-weight="bold" font-size="14" fill="#475569">SALE ID: #${sale.id}</text>
        <text x="455" y="175" font-family="Arial" font-size="14" fill="#475569" text-anchor="end">${dateStr}</text>
        
        <!-- Table Headers -->
        <text x="30" y="220" font-family="Arial" font-weight="bold" font-size="14" fill="#94a3b8">DESCRIPTION</text>
        <text x="280" y="220" font-family="Arial" font-weight="bold" font-size="14" fill="#94a3b8" text-anchor="end">QTY x PRICE</text>
        <text x="470" y="220" font-family="Arial" font-weight="bold" font-size="14" fill="#94a3b8" text-anchor="end">TOTAL</text>
        
        <line x1="30" y1="230" x2="470" y2="230" stroke="#e2e8f0" stroke-width="1" />
        
        <!-- Items -->
        ${itemsSvg}
        
        <!-- Summary Section -->
        <g transform="translate(0, ${summaryY})">
          <line x1="30" y1="0" x2="470" y2="0" stroke="#1a2a6c" stroke-width="2" />
          
          <text x="30" y="40" font-family="Arial" font-weight="bold" font-size="24" fill="#1a2a6c">NET TOTAL</text>
          <text x="470" y="40" font-family="Arial" font-weight="900" font-size="32" fill="#1a2a6c" text-anchor="end">₹${sale.totalAmount.toFixed(2)}</text>
          
          <text x="30" y="75" font-family="Arial" font-size="16" fill="#64748b">Payment: ${sale.paymentMethod || 'Cash'}</text>
          <text x="30" y="95" font-family="Arial" font-size="16" fill="#64748b">Items Count: ${sale.items.length}</text>
          
          <rect x="30" y="120" width="440" height="50" rx="10" fill="#f0f9ff" />
          <text x="${width/2}" y="152" font-family="Arial" font-weight="bold" font-size="18" fill="#0369a1" text-anchor="middle">SAVED ₹${(sale.items.reduce((acc, i) => acc + (i.mrp - i.sellingPrice) * i.quantity, 0) + (sale.discount || 0)).toFixed(2)} WITH US!</text>
        </g>
        
        <text x="${width/2}" y="${dynamicHeight - 35}" font-family="Arial" font-style="italic" font-size="14" fill="#94a3b8" text-anchor="middle">This is a computer-generated receipt.</text>
      </svg>
    `;

    const receiptImage = await sharp(Buffer.from(receiptSvg))
      .png()
      .toBuffer();

    return receiptImage;
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to generate receipt image');
    throw err;
  }
};

module.exports = {
  generateCustomerCard,
  generateReceiptImage,
};
