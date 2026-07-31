import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import { IPC } from './ipcChannels';

// desktop/ipcChannels.js is CommonJS and lives outside the Vite root, so it is
// parsed from source rather than imported. This keeps the test independent of
// bundler/module-interop behaviour.
const desktopChannelsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../desktop/ipcChannels.js'
);

const parseDesktopChannels = () => {
  const source = readFileSync(desktopChannelsPath, 'utf8');
  const entries = [...source.matchAll(/^\s*([A-Z0-9_]+):\s*'([^']+)',/gm)];
  return Object.fromEntries(entries.map(([, key, value]) => [key, value]));
};

describe('IPC channel mirrors', () => {
  // These two files are maintained by hand. If they drift, the affected feature
  // fails silently — the renderer invokes a channel main never registered, and
  // nothing throws. This test is the only thing enforcing the mirror.
  it('client and desktop define identical channel maps', () => {
    const desktop = parseDesktopChannels();

    expect(Object.keys(desktop).length).toBeGreaterThan(0);
    expect(IPC).toEqual(desktop);
  });

  it('every channel value is unique', () => {
    const values = Object.values(IPC);
    expect(new Set(values).size).toBe(values.length);
  });
});
