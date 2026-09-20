import { describe, expect, it } from 'vitest';
import { LicenseClient, type FetchLike } from './licenseClient';

const DEVICE = 'a'.repeat(64);
const NONCE = 'n'.repeat(22);
const request = { deviceId: DEVICE, nonce: NONCE, appVersion: '1.0.255', platform: 'darwin' as const };

const respond = (status: number, body: string): FetchLike => async () => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => body,
});

const client = (fetchImpl: FetchLike) => new LicenseClient({ baseUrl: 'https://license.example.com/', fetchImpl });

describe('LicenseClient', () => {
  it('posts JSON to the versioned route and returns a parsed success', async () => {
    let seen: { url: string; body: string; method: string } | null = null;
    const result = await client(async (url, init) => {
      seen = { url, body: init.body, method: init.method };
      return { status: 200, ok: true, text: async () => JSON.stringify({ token: 't', deviceSecret: 's'.repeat(43) }) };
    }).activate(request);

    expect(result).toEqual({ kind: 'ok', data: { token: 't', deviceSecret: 's'.repeat(43) } });
    expect(seen).toMatchObject({ url: 'https://license.example.com/v1/activate', method: 'POST' });
    expect(JSON.parse(seen!.body)).toEqual(request);
  });

  it('routes validate to /v1/validate', async () => {
    let url = '';
    await client(async (u) => {
      url = u;
      return { status: 200, ok: true, text: async () => JSON.stringify({ token: 't' }) };
    }).validate({ ...request, deviceSecret: 's'.repeat(43) });
    expect(url).toBe('https://license.example.com/v1/validate');
  });

  it('treats only 401 device_not_recognized as a rejection', async () => {
    const body = JSON.stringify({ error: 'device_not_recognized', message: 'x' });
    expect(await client(respond(401, body)).validate({ ...request, deviceSecret: 's'.repeat(43) })).toEqual({ kind: 'rejected' });
  });

  it.each([
    ['a 401 with a different error', respond(401, JSON.stringify({ error: 'something_else' }))],
    ['a 401 that is not JSON', respond(401, '<html>login</html>')],
    ['a 500', respond(500, JSON.stringify({ error: 'internal_error' }))],
    ['a 503', respond(503, 'Service Unavailable')],
    ['a 400 (our own bug must not revoke anyone)', respond(400, JSON.stringify({ error: 'invalid_request' }))],
    ['captive-portal HTML with a 200', respond(200, '<html>Please log in to the wifi</html>')],
    ['a 200 with the wrong JSON shape', respond(200, JSON.stringify({ hello: 'world' }))],
    ['a 200 with a non-string token', respond(200, JSON.stringify({ token: 42 }))],
    ['an oversized body', respond(200, JSON.stringify({ token: 'x'.repeat(20_000) }))],
    [
      'a network failure',
      async () => {
        throw new Error('ECONNREFUSED');
      },
    ],
    [
      'a body that fails to read',
      async () => ({
        status: 200,
        ok: true,
        text: async () => {
          throw new Error('stream reset');
        },
      }),
    ],
  ])('never rejects on %s: reports offline', async (_label, fetchImpl) => {
    const result = await client(fetchImpl).activate(request);
    expect(result.kind).toBe('offline');
  });

  it('passes an abort signal so a hung server cannot hang the app', async () => {
    let signal: AbortSignal | undefined;
    await client(async (_url, init) => {
      signal = init.signal;
      return { status: 200, ok: true, text: async () => JSON.stringify({ token: 't' }) };
    }).activate(request);
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});
