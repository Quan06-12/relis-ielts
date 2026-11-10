import js from './server/node_modules/@eslint/js/src/index.js'
import { fileURLToPath } from 'node:url'
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.cache/**'] },
  {
    ...js.configs.recommended,
    basePath: fileURLToPath(new URL('.', import.meta.url)),
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: Object.fromEntries(
        [
          'console',
          'process',
          'Buffer',
          'URL',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          'window',
          'document',
          'localStorage',
          'structuredClone',
          'fetch',
        ].map((name) => [name, 'readonly']),
      ),
    },
    rules: {
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
]
