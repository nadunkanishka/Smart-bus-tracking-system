// One lint setup for the whole repository (`npm run lint`). Generated copies and build output are skipped: the originals in
// shared/ are linted instead.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const jsx = { ecmaFeatures: { jsx: true } };
const reactRules = { 'react/jsx-uses-vars': 'error', 'react/jsx-uses-react': 'error' };

export default [
  {
    ignores: [
      '**/node_modules/**', '**/build/**', '**/dist/**', '**/coverage/**', '**/.expo/**',
      'apps/*/src/shared/**', 'apps/admin-dashboard/src/design/**', 'backend/lib/contract.js',
      'shared/buses/out/**', 'shared/busMarkers.js',
    ],
  },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 2023, sourceType: 'module', parserOptions: jsx }, linterOptions: { reportUnusedDisableDirectives: 'error' } },

  // Backend, scripts, load test: CommonJS on Node.
  {
    files: ['backend/**/*.js', 'loadtest/**/*.{js,cjs}', '**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  // Shared design system and its tests: ES modules on Node (the native files also run in React Native).
  {
    files: ['shared/**/*.{js,mjs}', 'eslint.config.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  { files: ['shared/buses/clay.js'], languageOptions: { globals: { ...globals.browser, THREE: 'readonly' } } }, // a browser page script (three.js loaded by export.html)
  {
    files: ['shared/native/**/*.js', 'shared/web/**/*.js'],
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: { ...reactRules, 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
  // Admin dashboard (browser, Jest) and the two phone apps (React Native).
  {
    files: ['apps/admin-dashboard/src/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.jest, process: 'readonly', global: 'readonly' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: { ...reactRules, 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
  {
    files: ['apps/driver-app/**/*.js', 'apps/passenger-app/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, __DEV__: 'readonly' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: { ...reactRules, 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
  {
    files: ['apps/*/*.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
];
