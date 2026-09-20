import { describe, expect, it } from 'vitest';
import { deriveDeviceId, parseIoregPlatformUuid, parseRegMachineGuid, readMachineId } from './machineId';

const IOREG = `+-o Root  <class IORegistryEntry, id 0x100000100, retain 20>
  +-o MacBookPro18,3  <class IOPlatformExpertDevice, id 0x10000020f, registered, matched, active, busy 0 (49 ms), retain 39>
    {
      "IOPlatformSerialNumber" = "C02XXXXXXXXX"
      "IOPlatformUUID" = "6D4E8B0A-1234-4ABC-9DEF-0123456789AB"
      "manufacturer" = <"Apple Inc.">
    }`;

const REG = `
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography
    MachineGuid    REG_SZ    3A1F0C2E-77B4-4D5A-8E21-ABCDEF012345
`;

const base = { platform: 'linux' as const, run: async () => '', readFile: () => null, systemRoot: 'C:\\Windows' };

describe('parsers', () => {
  it('reads IOPlatformUUID from ioreg output, lowercased', () => {
    expect(parseIoregPlatformUuid(IOREG)).toBe('6d4e8b0a-1234-4abc-9def-0123456789ab');
  });

  it('reads MachineGuid from reg query output, lowercased', () => {
    expect(parseRegMachineGuid(REG)).toBe('3a1f0c2e-77b4-4d5a-8e21-abcdef012345');
  });

  it('returns null for unrelated output', () => {
    expect(parseIoregPlatformUuid('nothing here')).toBeNull();
    expect(parseRegMachineGuid('ERROR: The system was unable to find the specified registry key')).toBeNull();
  });
});

describe('readMachineId', () => {
  it('macOS: runs ioreg without a shell and parses it', async () => {
    let call: { file: string; args: string[] } | null = null;
    const id = await readMachineId({
      ...base,
      platform: 'darwin',
      run: async (file, args) => {
        call = { file, args };
        return IOREG;
      },
    });
    expect(id).toBe('6d4e8b0a-1234-4abc-9def-0123456789ab');
    expect(call).toEqual({ file: '/usr/sbin/ioreg', args: ['-rd1', '-c', 'IOPlatformExpertDevice'] });
  });

  it('Windows: queries the registry through reg.exe under the system root', async () => {
    let file = '';
    const id = await readMachineId({
      ...base,
      platform: 'win32',
      run: async (f) => {
        file = f;
        return REG;
      },
    });
    expect(id).toBe('3a1f0c2e-77b4-4d5a-8e21-abcdef012345');
    expect(file).toBe('C:\\Windows\\System32\\reg.exe');
  });

  it('Linux: reads /etc/machine-id, falling back to the dbus copy, and validates the format', async () => {
    const good = 'a'.repeat(32);
    expect(await readMachineId({ ...base, readFile: (p) => (p === '/etc/machine-id' ? good : null) })).toBe(good);
    expect(await readMachineId({ ...base, readFile: (p) => (p === '/var/lib/dbus/machine-id' ? good : null) })).toBe(good);
    expect(await readMachineId({ ...base, readFile: () => 'not-a-machine-id' })).toBeNull();
  });

  it('returns null instead of throwing when the command fails or times out', async () => {
    const failing = async () => {
      throw new Error('spawn ioreg ENOENT');
    };
    expect(await readMachineId({ ...base, platform: 'darwin', run: failing })).toBeNull();
    expect(await readMachineId({ ...base, platform: 'win32', run: failing })).toBeNull();
  });
});

describe('deriveDeviceId', () => {
  it('is a stable 64-char hex hash that never contains the raw machine id', () => {
    const id = deriveDeviceId('6d4e8b0a-1234-4abc-9def-0123456789ab');
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).toBe(deriveDeviceId('6d4e8b0a-1234-4abc-9def-0123456789ab'));
    expect(id).not.toContain('6d4e8b0a');
  });

  it('differs per machine', () => {
    expect(deriveDeviceId('machine-a')).not.toBe(deriveDeviceId('machine-b'));
  });
});
