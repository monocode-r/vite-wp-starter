import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['themes/*/assets/', 'node_modules/', 'scripts/'],
  },
  {
    files: ['src/js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
