import {
  ActivateResponseSchema,
  ValidateResponseSchema,
  type ActivateRequest,
  type ActivateResponse,
  type ValidateRequest,
  type ValidateResponse,
} from '@trovix/license-contract';

/**
 * `rejected` is the ONLY outcome that means "the service positively said this device is not recognized".
 * Everything else that goes wrong (no network, timeout, 5xx, captive-portal HTML, garbage) is `offline` and
 * must never reduce anyone's entitlement.
 */
export type ClientResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'rejected' }
  | { kind: 'offline'; reason: string };

/**
 * Redeeming a key is an interactive, user-initiated action, not a background entitlement check, so (unlike
 * ClientResult) it surfaces the service's specific reason instead of collapsing every non-2xx into "offline" —
 * the person typing the key needs to know *why* it didn't work. `offline` here still means the same thing as
 * everywhere else: a transport failure, never a verdict, and never reduces entitlement.
 */
export type KeyRedeemResult =
  | { kind: 'ok'; data: ActivateResponse }
  | { kind: 'invalid_key' }
  | { kind: 'seat_limit_reached' }
  | { kind: 'device_already_licensed' }
  | { kind: 'offline'; reason: string };

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }
) => Promise<{
  status: number;
  ok: boolean;
  text(): Promise<string>;
}>;

export interface LicenseClientOptions {
  baseUrl: string;
  fetchImpl: FetchLike;
  timeoutMs?: number;
}

const MAX_BODY_CHARS = 16_384;

type RawResponse =
  | { outcome: 'offline'; reason: string }
  | { outcome: 'response'; status: number; ok: boolean; body: unknown };

export class LicenseClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: LicenseClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  activate(request: ActivateRequest): Promise<ClientResult<ActivateResponse>> {
    return this.post('/v1/activate', request, (body) => ActivateResponseSchema.safeParse(body));
  }

  validate(request: ValidateRequest): Promise<ClientResult<ValidateResponse>> {
    return this.post('/v1/validate', request, (body) => ValidateResponseSchema.safeParse(body));
  }

  /** Same endpoint as activate(), but interprets the response for a person actively entering a key. */
  async redeemActivationKey(request: ActivateRequest): Promise<KeyRedeemResult> {
    const raw = await this.rawFetch('/v1/activate', request);
    if (raw.outcome === 'offline') return { kind: 'offline', reason: raw.reason };
    const { status, ok, body } = raw;

    const code =
      typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
    // A key that doesn't resolve to this device's own account also surfaces as device_not_recognized (401)
    // from the recovery path; from the typist's point of view that is the same as "this key doesn't work here".
    if (status === 403 && code === 'invalid_activation_key') return { kind: 'invalid_key' };
    if (status === 401 && code === 'device_not_recognized') return { kind: 'invalid_key' };
    if (status === 409 && code === 'seat_limit_reached') return { kind: 'seat_limit_reached' };
    if (status === 409 && code === 'device_already_licensed')
      return { kind: 'device_already_licensed' };
    if (!ok) return { kind: 'offline', reason: `http_${status}` };

    const parsed = ActivateResponseSchema.safeParse(body);
    return parsed.success
      ? { kind: 'ok', data: parsed.data }
      : { kind: 'offline', reason: 'bad_response' };
  }

  private async rawFetch(route: string, payload: unknown): Promise<RawResponse> {
    let status: number;
    let ok: boolean;
    let text: string;
    try {
      const response = await this.options.fetchImpl(`${this.baseUrl}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      status = response.status;
      ok = response.ok;
      text = await response.text();
    } catch {
      return { outcome: 'offline', reason: 'network' };
    }

    if (text.length > MAX_BODY_CHARS) return { outcome: 'offline', reason: 'oversized_response' };

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return { outcome: 'offline', reason: `non_json_${status}` };
    }
    return { outcome: 'response', status, ok, body };
  }

  private async post<T>(
    route: string,
    payload: unknown,
    parse: (body: unknown) => { success: true; data: T } | { success: false }
  ): Promise<ClientResult<T>> {
    const raw = await this.rawFetch(route, payload);
    if (raw.outcome === 'offline') return { kind: 'offline', reason: raw.reason };
    const { status, ok, body } = raw;

    if (status === 401) {
      const code =
        typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
      return code === 'device_not_recognized'
        ? { kind: 'rejected' }
        : { kind: 'offline', reason: 'http_401' };
    }
    if (!ok) return { kind: 'offline', reason: `http_${status}` };

    const parsed = parse(body);
    return parsed.success
      ? { kind: 'ok', data: parsed.data }
      : { kind: 'offline', reason: 'bad_response' };
  }
}
