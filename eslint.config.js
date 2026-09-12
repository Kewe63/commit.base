import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/node_modules/**', 'dist/**', 'coverage/**', 'contracts/artifacts/**', 'contracts/cache/**', 'contracts/coverage/**']),
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest' },
  },
  {
    files: ['src/**/*.{js,jsx}', 'vitest.setup.js'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }] },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
  {
    files: ['*.config.{js,mjs,cjs}', 'contracts/**/*.{js,cjs,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['contracts/test/**/*.{js,cjs,mjs}'],
    languageOptions: { globals: globals.mocha },
  },
  {
    files: ['src/**/*.{test,spec}.{js,jsx}'],
    languageOptions: { globals: globals.vitest },
  },
])
