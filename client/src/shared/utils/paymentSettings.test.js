import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_PAYMENT_SETTINGS,
  STORAGE_KEYS,
  getNotificationDuration,
  getStoredPaymentSettings,
  setNotificationDuration,
} from './paymentSettings';

describe('paymentSettings utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns default payment settings when storage is empty', () => {
    expect(getStoredPaymentSettings()).toEqual(DEFAULT_PAYMENT_SETTINGS);
  });

  it('merges stored payment settings over defaults', () => {
    localStorage.setItem(
      STORAGE_KEYS.paymentSettings,
      JSON.stringify({ enabledMethods: ['cash', 'card'] })
    );

    expect(getStoredPaymentSettings()).toEqual({
      ...DEFAULT_PAYMENT_SETTINGS,
      enabledMethods: ['cash', 'card'],
    });
  });

  it('falls back to defaults when stored value is invalid json', () => {
    localStorage.setItem(STORAGE_KEYS.paymentSettings, '{broken-json');
    expect(getStoredPaymentSettings()).toEqual(DEFAULT_PAYMENT_SETTINGS);
  });

  it('returns default notification duration when not configured', () => {
    expect(getNotificationDuration()).toBe(DEFAULT_NOTIFICATION_DURATION);
  });

  it('stores notification duration and emits settings event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    setNotificationDuration(4500);

    expect(localStorage.getItem(STORAGE_KEYS.notificationDuration)).toBe('4500');
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
