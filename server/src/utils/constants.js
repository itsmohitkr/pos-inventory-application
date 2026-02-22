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
    customShopName: 'Bachat Bazaar',
    customHeader: '123 Business Street, City',
    customFooter: 'Thank You! Visit Again',
    directPrint: false,
    printerType: 'Thermal Printer',
    paperSize: '80mm'
};

const DEFAULT_PAYMENT_SETTINGS = {
    enabledMethods: ['cash'],
    allowMultplePayment: false,
    customMethods: []
};

const DEFAULT_SHOP_METADATA = {
    shopMobile: '+91 98765 43210',
    shopMobile2: '',
    shopAddress: '123 Business Street, City',
    shopEmail: 'shop@example.com',
    shopGST: '',
    shopLogo: ''
};

module.exports = {
    DEFAULT_RECEIPT_SETTINGS,
    DEFAULT_PAYMENT_SETTINGS,
    DEFAULT_SHOP_METADATA
};
