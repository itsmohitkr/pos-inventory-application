// Payment Settings Utilities
export const STORAGE_KEYS = {
    paymentSettings: 'posPaymentSettings',
    enableFullscreen: 'posEnableFullscreen',
    notificationDuration: 'posNotificationDuration',
    enableExtraDiscount: 'posEnableExtraDiscount',
    receipt: 'posReceiptSettings',
    shopName: 'posShopName'
};

export const DEFAULT_PAYMENT_SETTINGS = {
    enabledMethods: ['cash'],
    allowMultplePayment: false,
    customMethods: []
};

export const DEFAULT_NOTIFICATION_DURATION = 3000; // 3 seconds

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

export const getNotificationDuration = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.notificationDuration);
        return stored ? parseInt(stored, 10) : DEFAULT_NOTIFICATION_DURATION;
    } catch {
        return DEFAULT_NOTIFICATION_DURATION;
    }
};

export const setNotificationDuration = (duration) => {
    try {
        localStorage.setItem(STORAGE_KEYS.notificationDuration, duration.toString());
        window.dispatchEvent(new Event('pos-settings-updated'));
    } catch (error) {
        console.error('Failed to save notification duration:', error);
    }
};

export const getExtraDiscountEnabled = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.enableExtraDiscount);
        return stored ? JSON.parse(stored) : true; // Default to true (enabled)
    } catch {
        return true;
    }
};

export const setExtraDiscountEnabled = (enabled) => {
    try {
        localStorage.setItem(STORAGE_KEYS.enableExtraDiscount, JSON.stringify(enabled));
        window.dispatchEvent(new Event('pos-settings-updated'));
    } catch (error) {
        console.error('Failed to save extra discount setting:', error);
    }
};
