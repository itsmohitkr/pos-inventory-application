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

  private async post<T>(
    route: string,
    payload: unknown,
    parse: (body: unknown) => { success: true; data: T } | { success: false }
  ): Promise<ClientResult<T>> {
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
      return { kind: 'offline', reason: 'network' };
    }

    if (text.length > MAX_BODY_CHARS) return { kind: 'offline', reason: 'oversized_response' };

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return { kind: 'offline', reason: `non_json_${status}` };
    }

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
