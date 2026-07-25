const STORAGE_KEYS = {
  receipt: 'posReceiptSettings',
  shopName: 'posShopName',
};

const DEFAULT_RECEIPT_SETTINGS = {
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
  customerDetails: true,
  customShopName: 'My Shop',
  customHeader: '123 Business Street, City',
  customHeader2: '',
  customHeader3: '',
  customFooter: 'Thank You! Visit Again',
  customFooter2: '',
  directPrint: true,
  printerType: '',
  paperSize: '72mm',
  marginTop: 0,
  marginBottom: 0,
  marginSide: 4,
  roundOff: true,
  billFormat: 'Standard',
  fontSize: 0.7,
  itemFontSize: 0.7,
  lineHeight: 1.1,
  invoiceLabel: 'Tax Invoice',
  showBranding: false,
  titleAlign: 'center',
  headerAlign: 'center',
  footerAlign: 'center',
};

const getStoredReceiptSettings = () => {
  try {
    const shopName = localStorage.getItem(STORAGE_KEYS.shopName) || 'My Shop';
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.receipt));

    return {
      ...DEFAULT_RECEIPT_SETTINGS,
      customShopName: shopName,
      ...stored,
    };
  } catch {
    return { ...DEFAULT_RECEIPT_SETTINGS };
  }
};

export { STORAGE_KEYS, DEFAULT_RECEIPT_SETTINGS, getStoredReceiptSettings };
