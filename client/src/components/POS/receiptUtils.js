export const DEFAULT_RECEIPT_SETTINGS = {
  shopName: true,
  header: true,
  footer: true,
  mrp: true,
  price: true,
  discount: true,
  totalValue: true,
  productName: true,
  exp: true,
  barcode: true,
  totalSavings: true,
  customShopName: 'RESOFT POS',
  customHeader: '123 Business Street, City',
  customFooter: 'Thank You! Visit Again',
  paperSize: '72mm',
  fontSize: 0.7,
  itemFontSize: 0.7,
  lineHeight: 1.1,
  invoiceLabel: 'Tax Invoice',
  showBranding: false,
  titleAlign: 'center',
  headerAlign: 'center',
  footerAlign: 'center',
};

export const RECEIPT_THEMES = {
  Standard: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    divider: '2px solid black',
    itemDivider: '0.5px solid #eee',
    headerWeight: 400,
    textWeight: 400,
    boldWeight: 400,
  },
  Modern: {
    fontFamily: 'Outfit, Inter, sans-serif',
    divider: '1px solid black',
    itemDivider: 'none',
    headerWeight: 400,
    textWeight: 400,
    boldWeight: 400,
  },
  Classic: {
    fontFamily: '"Courier New", Courier, monospace',
    divider: '1px dashed black',
    itemDivider: '1px dashed #ccc',
    headerWeight: 400,
    textWeight: 400,
    boldWeight: 400,
  },
  Minimalist: {
    fontFamily: 'Inter, sans-serif',
    divider: '1px solid black',
    itemDivider: 'none',
    headerWeight: 400,
    textWeight: 400,
    boldWeight: 400,
  },
};

export const getSafePrintableWidth = (size) => {
  if (size === '80mm') return '72mm';
  if (size === '72mm') return '64mm';
  if (size === '58mm') return '48mm';
  return size || '72mm';
};

export const getReceiptTheme = (billFormat) => {
  return RECEIPT_THEMES[billFormat] || RECEIPT_THEMES.Standard;
};

export const getReceiptCalculations = (sale, config) => {
  const originalTotal = sale.totalAmount || sale.price || 0;
  const roundedTotal = config.roundOff ? Math.round(originalTotal) : originalTotal;
  const roundOff = roundedTotal - originalTotal;

  const totalMrp =
    sale.items?.reduce((sum, item) => {
      const itemMrp = item.mrp || item.batch?.mrp || item.sellingPrice || 0;
      return sum + itemMrp * item.quantity;
    }, 0) || 0;

  const calculatedSavings = totalMrp - originalTotal;
  const totalItemCount = sale.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return {
    originalTotal,
    roundedTotal,
    roundOff,
    calculatedSavings,
    totalItemCount,
  };
};
