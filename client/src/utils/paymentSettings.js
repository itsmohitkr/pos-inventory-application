// Payment Settings Utilities
export const STORAGE_KEYS = {
    paymentSettings: 'posPaymentSettings',
    enableFullscreen: 'posEnableFullscreen',
    receipt: 'posReceiptSettings',
    shopName: 'posShopName'
};

export const DEFAULT_PAYMENT_SETTINGS = {
    enabledMethods: ['cash'],
    allowMultplePayment: false,
    customMethods: []
};

export const getStoredPaymentSettings = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentSettings));
        return stored ? { ...DEFAULT_PAYMENT_SETTINGS, ...stored } : { ...DEFAULT_PAYMENT_SETTINGS };
    } catch {
        return { ...DEFAULT_PAYMENT_SETTINGS };
    }
};

export const getFullscreenEnabled = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.enableFullscreen);
        return stored ? JSON.parse(stored) : true;
    } catch {
        return true;
    }
};
