const DEFAULT_RECEIPT_SETTINGS = {
  // Visibility toggles
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
  totalItems: true,
  // Content
  customShopName: 'My Shop',
  customHeader: '123 Business Street, City',
  customHeader2: '',
  customHeader3: '',
  customFooter: 'Thank You! Visit Again',
  customFooter2: '',
  invoiceLabel: 'Tax Invoice',
  // Print behaviour
  directPrint: true,
  printerType: '',
  paperSize: '72mm',
  // Layout
  marginTop: 0,
  marginBottom: 0,
  marginSide: 4,
  fontSize: 0.7,
  itemFontSize: 0.7,
  lineHeight: 1.1,
  titleAlign: 'center',
  headerAlign: 'center',
  footerAlign: 'center',
  billFormat: 'Standard',
  // Misc
  roundOff: true,
  showBranding: false,
};

const DEFAULT_PAYMENT_SETTINGS = {
  enabledMethods: ['cash'],
  allowMultplePayment: false,
  customMethods: [],
};

const DEFAULT_SHOP_METADATA = {
  shopMobile: '+91 98765 43210',
  shopMobile2: '',
  shopAddress: '123 Business Street, City',
  shopEmail: 'shop@example.com',
  shopGST: '',
  shopLogo: '',
};

module.exports = {
  DEFAULT_RECEIPT_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SHOP_METADATA,
};
