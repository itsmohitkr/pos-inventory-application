import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DeviceStore, emptyRecord } from './deviceStore';

let dir: string;
let file: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trovix-license-'));
  file = path.join(dir, 'license', 'device.json');
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('DeviceStore', () => {
  it('returns an empty record when the file does not exist', () => {
    expect(new DeviceStore(file).read()).toEqual(emptyRecord());
  });

  it('round-trips a record, creating the directory as needed', () => {
    const store = new DeviceStore(file);
    const record = { ...emptyRecord(), deviceSecret: 's', token: 'a.b.c', highWaterMarkSec: 123, provisionalStartedAtMs: 456, lastValidatedAtMs: 789 };
    store.write(record);
    expect(store.read()).toEqual(record);
  });

  it('writes owner-only and leaves no temp file behind', () => {
    const store = new DeviceStore(file);
    store.write(emptyRecord());
    if (process.platform !== 'win32') expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    expect(fs.readdirSync(path.dirname(file))).toEqual(['device.json']);
  });

  it('treats corrupt or wrongly-typed content as empty instead of throwing', () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const store = new DeviceStore(file);

    fs.writeFileSync(file, '{not json');
    expect(store.read()).toEqual(emptyRecord());

    fs.writeFileSync(file, JSON.stringify([1, 2, 3]));
    expect(store.read()).toEqual(emptyRecord());

    fs.writeFileSync(file, JSON.stringify({ token: 42, deviceSecret: '', highWaterMarkSec: -5, provisionalStartedAtMs: 'yesterday' }));
    expect(store.read()).toEqual(emptyRecord());
  });

  it('a second write replaces the first', () => {
    const store = new DeviceStore(file);
    store.write({ ...emptyRecord(), token: 'one' });
    store.write({ ...emptyRecord(), token: 'two' });
    expect(store.read().token).toBe('two');
  });
});
