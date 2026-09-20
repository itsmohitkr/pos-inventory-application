// Stable per-machine identifier, with no dependency on a third-party package. The result is only ever used
// after hashing (deriveDeviceId), so the raw hardware/OS identifier never leaves the machine.
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const EXEC_TIMEOUT_MS = 5000;

export const parseIoregPlatformUuid = (stdout: string): string | null => {
  const match = /"IOPlatformUUID"\s*=\s*"([0-9A-Fa-f-]{36})"/.exec(stdout);
  return match ? match[1].toLowerCase() : null;
};

export const parseRegMachineGuid = (stdout: string): string | null => {
  const match = /MachineGuid\s+REG_SZ\s+([0-9A-Fa-f-]{36})/i.exec(stdout);
  return match ? match[1].toLowerCase() : null;
};

const runFile = (file: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { timeout: EXEC_TIMEOUT_MS, windowsHide: true, encoding: 'utf8' },
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    );
  });

const readTextFile = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return null;
  }
};

export interface MachineIdDeps {
  platform: NodeJS.Platform;
  run: (file: string, args: string[]) => Promise<string>;
  readFile: (filePath: string) => string | null;
  systemRoot: string;
}

const defaultDeps = (): MachineIdDeps => ({
  platform: process.platform,
  run: runFile,
  readFile: readTextFile,
  systemRoot: process.env.SystemRoot || 'C:\\Windows',
});

/** Returns the OS-level machine identifier, or null when it cannot be read (the caller then falls back). */
export const readMachineId = async (
  overrides: Partial<MachineIdDeps> = {}
): Promise<string | null> => {
  const deps = { ...defaultDeps(), ...overrides };
  try {
    if (deps.platform === 'darwin') {
      return parseIoregPlatformUuid(
        await deps.run('/usr/sbin/ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'])
      );
    }
    if (deps.platform === 'win32') {
      const reg = path.win32.join(deps.systemRoot, 'System32', 'reg.exe');
      return parseRegMachineGuid(
        await deps.run(reg, [
          'query',
          'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
          '/v',
          'MachineGuid',
        ])
      );
    }
    for (const file of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
      const value = deps.readFile(file);
      if (value && /^[0-9a-f]{32}$/i.test(value)) return value.toLowerCase();
    }
  } catch {
    // Fall through: an unreadable machine id degrades to the weak fallback identity, it never blocks the app.
  }
  return null;
};

/** The id the service knows this install by: a one-way hash, never the raw machine id. */
export const deriveDeviceId = (machineId: string): string =>
  createHash('sha256').update(`trovix-device-v1:${machineId}`).digest('hex');
