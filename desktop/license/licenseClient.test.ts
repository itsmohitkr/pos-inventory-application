import { describe, expect, it } from 'vitest';
import { LicenseClient, type FetchLike } from './licenseClient';

const DEVICE = 'a'.repeat(64);
const NONCE = 'n'.repeat(22);
const request = {
  deviceId: DEVICE,
  nonce: NONCE,
  appVersion: '1.0.255',
  platform: 'darwin' as const,
};

const respond =
  (status: number, body: string): FetchLike =>
  async () => ({
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
  });

const client = (fetchImpl: FetchLike) =>
  new LicenseClient({ baseUrl: 'https://license.example.com/', fetchImpl });

describe('LicenseClient', () => {
  it('posts JSON to the versioned route and returns a parsed success', async () => {
    let seen: { url: string; body: string; method: string } | null = null;
    const result = await client(async (url, init) => {
      seen = { url, body: init.body, method: init.method };
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ token: 't', deviceSecret: 's'.repeat(43) }),
      };
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
    expect(
      await client(respond(401, body)).validate({ ...request, deviceSecret: 's'.repeat(43) })
    ).toEqual({ kind: 'rejected' });
  });

  it.each([
    ['a 401 with a different error', respond(401, JSON.stringify({ error: 'something_else' }))],
    ['a 401 that is not JSON', respond(401, '<html>login</html>')],
    ['a 500', respond(500, JSON.stringify({ error: 'internal_error' }))],
    ['a 503', respond(503, 'Service Unavailable')],
    [
      'a 400 (our own bug must not revoke anyone)',
      respond(400, JSON.stringify({ error: 'invalid_request' })),
    ],
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

describe('LicenseClient.redeemActivationKey', () => {
  const keyRequest = { ...request, activationKey: '0WD2T-G2KCS-WRS7X-JRQCE-DN' };

  it('returns the token on success, and sends the key on /v1/activate', async () => {
    let url = '';
    let body = '';
    const result = await client(async (u, init) => {
      url = u;
      body = init.body;
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ token: 't', deviceSecret: 's'.repeat(43) }),
      };
    }).redeemActivationKey(keyRequest);

    expect(url).toBe('https://license.example.com/v1/activate');
    expect(JSON.parse(body)).toEqual(keyRequest);
    expect(result).toEqual({ kind: 'ok', data: { token: 't', deviceSecret: 's'.repeat(43) } });
  });

  it('maps a 403 invalid_activation_key to invalid_key', async () => {
    const body = JSON.stringify({ error: 'invalid_activation_key', message: 'x' });
    expect(await client(respond(403, body)).redeemActivationKey(keyRequest)).toEqual({
      kind: 'invalid_key',
    });
  });

  it('maps a 401 device_not_recognized (key does not match the owned account) to invalid_key too', async () => {
    const body = JSON.stringify({ error: 'device_not_recognized', message: 'x' });
    expect(await client(respond(401, body)).redeemActivationKey(keyRequest)).toEqual({
      kind: 'invalid_key',
    });
  });

  it('maps 409 seat_limit_reached and 409 device_already_licensed distinctly', async () => {
    expect(
      await client(
        respond(409, JSON.stringify({ error: 'seat_limit_reached' }))
      ).redeemActivationKey(keyRequest)
    ).toEqual({ kind: 'seat_limit_reached' });
    expect(
      await client(
        respond(409, JSON.stringify({ error: 'device_already_licensed' }))
      ).redeemActivationKey(keyRequest)
    ).toEqual({ kind: 'device_already_licensed' });
  });

  it.each([
    ['a 401 with an unrelated error', respond(401, JSON.stringify({ error: 'something_else' }))],
    ['a 409 with an unrelated error', respond(409, JSON.stringify({ error: 'something_else' }))],
    ['a 429', respond(429, JSON.stringify({ error: 'rate_limited' }))],
    ['a 500', respond(500, JSON.stringify({ error: 'internal_error' }))],
    [
      'a network failure',
      async () => {
        throw new Error('ECONNREFUSED');
      },
    ],
    ['a 200 with the wrong shape', respond(200, JSON.stringify({ hello: 'world' }))],
    ['captive-portal HTML with a 200', respond(200, '<html>log in to wifi</html>')],
  ])('treats %s as offline, never as a verdict', async (_label, fetchImpl) => {
    const result = await client(fetchImpl).redeemActivationKey(keyRequest);
    expect(result.kind).toBe('offline');
  });
});

describe('LicenseClient checkout (P6.5)', () => {
  const checkoutCreateRequest = {
    deviceId: DEVICE,
    deviceSecret: 's'.repeat(43),
    appVersion: '1.0.255',
    platform: 'darwin' as const,
    plan: 'monthly',
  };
  const checkoutPollRequest = {
    deviceId: DEVICE,
    deviceSecret: 's'.repeat(43),
    nonce: NONCE,
    appVersion: '1.0.255',
    platform: 'darwin' as const,
  };
  const checkoutResponse = {
    sessionId: 'sess_abc123',
    checkoutUrl: 'https://rzp.io/i/xyz',
    expiresAt: '2026-10-01T00:00:00.000Z',
  };

  it('posts to /v1/checkout-sessions and returns a parsed success', async () => {
    let seen: { url: string; body: string; method: string } | null = null;
    const result = await client(async (url, init) => {
      seen = { url, body: init.body, method: init.method };
      return { status: 201, ok: true, text: async () => JSON.stringify(checkoutResponse) };
    }).createCheckoutSession(checkoutCreateRequest);

    expect(result).toEqual({ kind: 'ok', data: checkoutResponse });
    expect(seen).toMatchObject({
      url: 'https://license.example.com/v1/checkout-sessions',
      method: 'POST',
    });
    expect(JSON.parse(seen!.body)).toEqual(checkoutCreateRequest);
  });

  it('maps 401 device_not_recognized to rejected and 400 unknown_plan distinctly', async () => {
    expect(
      await client(
        respond(401, JSON.stringify({ error: 'device_not_recognized' }))
      ).createCheckoutSession(checkoutCreateRequest)
    ).toEqual({ kind: 'rejected' });
    expect(
      await client(respond(400, JSON.stringify({ error: 'unknown_plan' }))).createCheckoutSession(
        checkoutCreateRequest
      )
    ).toEqual({ kind: 'unknown_plan' });
  });

  it.each([
    ['a 401 with an unrelated error', respond(401, JSON.stringify({ error: 'something_else' }))],
    ['a 400 with an unrelated error', respond(400, JSON.stringify({ error: 'invalid_request' }))],
    ['a 500', respond(500, JSON.stringify({ error: 'internal_error' }))],
    ['a 200 with the wrong shape', respond(200, JSON.stringify({ hello: 'world' }))],
  ])('createCheckoutSession treats %s as offline', async (_label, fetchImpl) => {
    const result = await client(fetchImpl).createCheckoutSession(checkoutCreateRequest);
    expect(result.kind).toBe('offline');
  });

  it('posts (not GETs) to /v1/checkout-sessions/:id — a credential never belongs in a URL', async () => {
    let seen: { url: string; body: string; method: string } | null = null;
    const result = await client(async (url, init) => {
      seen = { url, body: init.body, method: init.method };
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ status: 'pending' }),
      };
    }).pollCheckoutSession('sess_abc123', checkoutPollRequest);

    expect(result).toEqual({ kind: 'ok', data: { status: 'pending' } });
    expect(seen).toMatchObject({
      url: 'https://license.example.com/v1/checkout-sessions/sess_abc123',
      method: 'POST',
    });
    expect(JSON.parse(seen!.body)).toEqual(checkoutPollRequest);
  });

  it('URL-encodes the session id', async () => {
    let url = '';
    await client(async (u) => {
      url = u;
      return { status: 200, ok: true, text: async () => JSON.stringify({ status: 'pending' }) };
    }).pollCheckoutSession('sess/weird id', checkoutPollRequest);
    expect(url).toBe('https://license.example.com/v1/checkout-sessions/sess%2Fweird%20id');
  });

  it('returns the fresh token when the response reports paid', async () => {
    const result = await client(async () => ({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ status: 'paid', token: 'a.b.c' }),
    })).pollCheckoutSession('sess_abc123', checkoutPollRequest);
    expect(result).toEqual({ kind: 'ok', data: { status: 'paid', token: 'a.b.c' } });
  });

  it('maps 401 device_not_recognized to rejected and 404 checkout_session_not_found to not_found', async () => {
    expect(
      await client(
        respond(401, JSON.stringify({ error: 'device_not_recognized' }))
      ).pollCheckoutSession('sess_abc123', checkoutPollRequest)
    ).toEqual({ kind: 'rejected' });
    expect(
      await client(
        respond(404, JSON.stringify({ error: 'checkout_session_not_found' }))
      ).pollCheckoutSession('sess_abc123', checkoutPollRequest)
    ).toEqual({ kind: 'not_found' });
  });

  it.each([
    ['a 401 with an unrelated error', respond(401, JSON.stringify({ error: 'something_else' }))],
    ['a 404 with an unrelated error', respond(404, JSON.stringify({ error: 'invalid_request' }))],
    ['a 500', respond(500, JSON.stringify({ error: 'internal_error' }))],
    [
      'a network failure',
      async () => {
        throw new Error('ECONNREFUSED');
      },
    ],
  ])('pollCheckoutSession treats %s as offline', async (_label, fetchImpl) => {
    const result = await client(fetchImpl).pollCheckoutSession('sess_abc123', checkoutPollRequest);
    expect(result.kind).toBe('offline');
  });
});
