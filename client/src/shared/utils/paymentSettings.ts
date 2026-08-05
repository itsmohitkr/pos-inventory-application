// Payment Settings Utilities
export const STORAGE_KEYS = {
  paymentSettings: 'posPaymentSettings',
  enableFullscreen: 'posEnableFullscreen',
  notificationDuration: 'posNotificationDuration',
  enableExtraDiscount: 'posEnableExtraDiscount',
  enableChangeCalculator: 'posEnableChangeCalculator',
  enablePaymentMethods: 'posEnablePaymentMethods',
  enableCalculator: 'posEnableCalculator',
  enableDecodedPrices: 'posEnableDecodedPrices',
  adminAutoLogoutTime: 'posAdminAutoLogoutTime',
  enableWeightedAverageCost: 'posEnableWeightedAverageCost',
  enableCustomerFeature: 'posEnableCustomerFeature',
  receipt: 'posReceiptSettings',
  shopName: 'posShopName',
} as const;

/** A payment method the shop has defined beyond the built-ins. */
export interface CustomPaymentMethod {
  id: string;
  /**
   * The display text. NOT `name` — this was previously typed as `name`, but
   * nothing ever wrote or read that field: PaymentSettingsPanel creates
   * `{ id, label }` and both it and transactionPanelUtils render `label`.
   */
  label: string;
  [key: string]: unknown;
}

export interface PaymentSettings {
  enabledMethods: string[];
  /** NOTE: spelling matches the persisted localStorage key — do not "fix". */
  allowMultplePayment: boolean;
  customMethods: CustomPaymentMethod[];
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabledMethods: ['cash'],
  allowMultplePayment: false,
  customMethods: [],
};

export const DEFAULT_NOTIFICATION_DURATION = 3000; // 3 seconds

export const getStoredPaymentSettings = (): PaymentSettings => {
  try {
    // `?? 'null'` is behaviour-identical to the previous JSON.parse(null)
    // (both produce null) but is valid once strictNullChecks is enabled.
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentSettings) ?? 'null');
    return stored ? { ...DEFAULT_PAYMENT_SETTINGS, ...stored } : { ...DEFAULT_PAYMENT_SETTINGS };
  } catch {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
};

export const getFullscreenEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableFullscreen);
    return stored ? JSON.parse(stored) : true;
  } catch {
    return true;
  }
};

export const getNotificationDuration = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.notificationDuration);
    return stored ? parseInt(stored, 10) : DEFAULT_NOTIFICATION_DURATION;
  } catch {
    return DEFAULT_NOTIFICATION_DURATION;
  }
};

export const setNotificationDuration = (duration: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.notificationDuration, duration.toString());
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save notification duration:', error);
  }
};

export const getExtraDiscountEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableExtraDiscount);
    return stored ? JSON.parse(stored) : true; // Default to true (enabled)
  } catch {
    return true;
  }
};

export const setExtraDiscountEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableExtraDiscount, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save extra discount setting:', error);
  }
};

export const getChangeCalculatorEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableChangeCalculator);
    return stored ? JSON.parse(stored) : false; // Default to false (disabled)
  } catch {
    return false;
  }
};

export const setChangeCalculatorEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableChangeCalculator, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save change calculator setting:', error);
  }
};

export const getPaymentMethodsEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enablePaymentMethods);
    return stored ? JSON.parse(stored) : true; // Default to true (enabled)
  } catch {
    return true;
  }
};

export const setPaymentMethodsEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enablePaymentMethods, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save payment methods setting:', error);
  }
};

export const getCalculatorEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableCalculator);
    return stored ? JSON.parse(stored) : true; // Default to true (enabled)
  } catch {
    return true;
  }
};

export const setCalculatorEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableCalculator, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save calculator setting:', error);
  }
};

export const getDecodedPricesEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableDecodedPrices);
    return stored ? JSON.parse(stored) : false; // Default to false (disabled)
  } catch {
    return false;
  }
};

export const setDecodedPricesEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableDecodedPrices, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save decoded prices setting:', error);
  }
};

export const getAdminAutoLogoutTime = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.adminAutoLogoutTime);
    return stored ? parseInt(stored, 10) : 15; // Default to 15 minutes
  } catch {
    return 15;
  }
};

export const setAdminAutoLogoutTime = (minutes: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.adminAutoLogoutTime, minutes.toString());
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save admin auto-logout time:', error);
  }
};
export const getWeightedAverageCostEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableWeightedAverageCost);
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};

export const setWeightedAverageCostEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableWeightedAverageCost, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save WAC setting:', error);
  }
};

export const getCustomerFeatureEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.enableCustomerFeature);
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};

export const setCustomerFeatureEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.enableCustomerFeature, JSON.stringify(enabled));
    window.dispatchEvent(new Event('pos-settings-updated'));
  } catch (error) {
    console.error('Failed to save customer feature setting:', error);
  }
};
