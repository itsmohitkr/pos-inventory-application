// Persists licensing state in {userData}/license/device.json: deliberately OUTSIDE pos.db so that a database
// wipe/reset can never reset trial eligibility. Plain JSON with owner-only permissions; the secret is not
// sealed with Electron safeStorage because release builds are unsigned and macOS Keychain access would then
// prompt after every update.
import fs from 'fs';
import path from 'path';

export interface DeviceRecord {
  version: 1;
  deviceSecret: string | null;
  token: string | null;
  /** Newest server `iat` (epoch seconds) ever accepted. The clock can never be trusted to run earlier than this. */
  highWaterMarkSec: number;
  /** Local start of a trial begun before the first successful contact with the service. */
  provisionalStartedAtMs: number | null;
  /** Random stand-in identity used only when the OS machine id cannot be read. */
  fallbackMachineId: string | null;
  lastValidatedAtMs: number | null;
}

export const emptyRecord = (): DeviceRecord => ({
  version: 1,
  deviceSecret: null,
  token: null,
  highWaterMarkSec: 0,
  provisionalStartedAtMs: null,
  fallbackMachineId: null,
  lastValidatedAtMs: null,
});

const asString = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);
const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

export interface RecordStore {
  read(): DeviceRecord;
  write(record: DeviceRecord): void;
}

export class DeviceStore implements RecordStore {
  constructor(private readonly filePath: string) {}

  /** A missing or corrupt file yields an empty record rather than an error: licensing must never crash the app. */
  read(): DeviceRecord {
    try {
      const raw: unknown = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (typeof raw !== 'object' || raw === null) return emptyRecord();
      const data = raw as Record<string, unknown>;
      return {
        version: 1,
        deviceSecret: asString(data.deviceSecret),
        token: asString(data.token),
        highWaterMarkSec: asNumber(data.highWaterMarkSec) ?? 0,
        provisionalStartedAtMs: asNumber(data.provisionalStartedAtMs),
        fallbackMachineId: asString(data.fallbackMachineId),
        lastValidatedAtMs: asNumber(data.lastValidatedAtMs),
      };
    } catch {
      return emptyRecord();
    }
  }

  /** Atomic: write a temp file then rename, so a crash mid-write cannot leave a half-written record. */
  write(record: DeviceRecord): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(record), { mode: 0o600 });
    fs.renameSync(tmp, this.filePath);
  }
}
