import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // dist/ is compiler output; prisma/ holds generated client code.
  globalIgnores(['dist', 'node_modules', 'prisma/generated', 'coverage']),

  {
    files: ['**/*.{js,ts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          // Express error middleware must keep its 4-arg shape to be
          // recognised as an error handler, so `next` is often unused.
          varsIgnorePattern: '^_',
          // `const { password, ...rest } = user` is the sanitize idiom used
          // across auth — the omitted binding is intentionally unused.
          ignoreRestSiblings: true,
        },
      ],

      // Escape hatches are documented individually; warn so they stay visible
      // without blocking, until Phase B/C removes them.
      '@typescript-eslint/no-explicit-any': 'warn',

      // The server compiles to CommonJS and several modules use `export =`
      // (config/prisma, shared/utils/logger). `import x = require('...')` is
      // the correct TypeScript idiom for consuming those — `import x from` is
      // what would actually be wrong here without esModuleInterop shims. The
      // rule flags 147 correct call sites, so it is off rather than suppressed
      // individually 147 times.
      '@typescript-eslint/no-require-imports': 'off',

      // Services throw createHttpError and let asyncHandler catch it; an empty
      // catch would silently swallow a DB failure.
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },

  // Jest tests.
  {
    files: ['**/*.test.{js,ts}', '**/__tests__/**/*.{js,ts}', '**/tests/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
