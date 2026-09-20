import { describe, expect, it } from 'vitest';
import { resolveLicenseConfig } from './config';

const devEnv = {
  TROVIX_LICENSE_API_URL: 'http://127.0.0.1:5055',
  TROVIX_LICENSE_DEV_PUBLIC_KEY: 'dev-1:abcDEF123_-',
};

describe('resolveLicenseConfig', () => {
  it('is disabled by default: no URL is baked into this build', () => {
    expect(resolveLicenseConfig({}, false)).toBeNull();
    expect(resolveLicenseConfig({}, true)).toBeNull();
  });

  it('honors the dev overrides when running unpackaged', () => {
    expect(resolveLicenseConfig(devEnv, false)).toEqual({
      apiUrl: 'http://127.0.0.1:5055',
      publicKeys: { 'dev-1': 'abcDEF123_-' },
      defaultEnforcement: 'warn',
      refreshIntervalMs: 6 * 60 * 60 * 1000,
    });
  });

  it('lets a dev shorten the refresh interval, within sane bounds', () => {
    expect(
      resolveLicenseConfig({ ...devEnv, TROVIX_LICENSE_REFRESH_SECONDS: '5' }, false)
        ?.refreshIntervalMs
    ).toBe(5000);
    for (const bad of ['0', '1', '-5', 'abc', '999999']) {
      expect(
        resolveLicenseConfig({ ...devEnv, TROVIX_LICENSE_REFRESH_SECONDS: bad }, false)
          ?.refreshIntervalMs
      ).toBe(6 * 60 * 60 * 1000);
    }
  });

  it('ignores every override in a packaged build', () => {
    expect(resolveLicenseConfig(devEnv, true)).toBeNull();
  });

  it('needs both a URL and at least one trusted key', () => {
    expect(
      resolveLicenseConfig({ TROVIX_LICENSE_API_URL: 'http://127.0.0.1:5055' }, false)
    ).toBeNull();
    expect(resolveLicenseConfig({ TROVIX_LICENSE_DEV_PUBLIC_KEY: 'k:abc' }, false)).toBeNull();
  });

  it.each([
    ['plain http to a remote host', 'http://license.example.com'],
    ['a non-http scheme', 'ftp://127.0.0.1'],
    ['garbage', 'not a url'],
  ])('rejects %s', (_label, url) => {
    expect(resolveLicenseConfig({ ...devEnv, TROVIX_LICENSE_API_URL: url }, false)).toBeNull();
  });

  it('accepts https to a remote host', () => {
    expect(
      resolveLicenseConfig(
        { ...devEnv, TROVIX_LICENSE_API_URL: 'https://license.trovix.app/' },
        false
      )?.apiUrl
    ).toBe('https://license.trovix.app');
  });
});
