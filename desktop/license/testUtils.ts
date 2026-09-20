// Test-only helpers (never imported by production code, so never compiled into desktop/dist).
import { generateKeyPairSync, sign } from 'crypto';
import {
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  TOKEN_VERSION,
  assembleToken,
  buildSigningInput,
  type EnforcementMode,
  type LicenseStatus,
  type TokenClaims,
} from '@trovix/license-contract';
import { emptyRecord, type DeviceRecord, type RecordStore } from './deviceStore';

export const DAY = 86_400_000;
export const NOW = Date.UTC(2026, 8, 20, 12, 0, 0);
export const SECRET = 's'.repeat(43);

export const makeKeys = (kid = 'k1') => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const x = publicKey.export({ format: 'jwk' }).x as string;
  const signClaims = (claims: TokenClaims): string => {
    const input = buildSigningInput(kid, claims);
    return assembleToken(input, sign(null, Buffer.from(input, 'utf8'), privateKey));
  };
  return { kid, publicKeys: { [kid]: x } as Record<string, string>, signClaims };
};

export interface TokenSpec {
  deviceId: string;
  nonce: string;
  nowMs: number;
  st?: LicenseStatus;
  tendMs?: number | null;
  pendMs?: number | null;
  guMs?: number | null;
  enf?: EnforcementMode;
  ttlSeconds?: number;
}

export const issueToken = (keys: ReturnType<typeof makeKeys>, spec: TokenSpec): string => {
  const iat = Math.floor(spec.nowMs / 1000);
  const toSec = (ms: number | null | undefined, fallback: number | null): number | null =>
    ms === undefined ? fallback : ms === null ? null : Math.floor(ms / 1000);
  return keys.signClaims({
    iss: TOKEN_ISSUER,
    aud: TOKEN_AUDIENCE,
    sub: spec.deviceId,
    jti: `jti-${iat}-${spec.nonce.slice(0, 6)}`,
    iat,
    exp: iat + (spec.ttlSeconds ?? 72 * 3600),
    nonce: spec.nonce,
    v: TOKEN_VERSION,
    st: spec.st ?? 'trialing',
    tend: toSec(spec.tendMs, iat + 7 * 86400),
    pend: toSec(spec.pendMs, null),
    gu: toSec(spec.guMs, iat + 14 * 86400),
    lim: null,
    acct: null,
    enf: spec.enf ?? 'warn',
  });
};

export class MemoryStore implements RecordStore {
  record: DeviceRecord = emptyRecord();
  writes = 0;
  read(): DeviceRecord {
    return structuredClone(this.record);
  }
  write(record: DeviceRecord): void {
    this.writes += 1;
    this.record = structuredClone(record);
  }
}
