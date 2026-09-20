import { defineConfig } from 'vitest/config';

// Unit tests for desktop/ (currently the licensing modules). Run from the repo root: `npm run test:desktop`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['desktop/**/*.test.ts'],
    exclude: ['desktop/dist/**', '**/node_modules/**'],
  },
});
