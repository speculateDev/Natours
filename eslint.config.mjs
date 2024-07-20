import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { languageOptions: { globals: { process: 'readonly', ...globals.browser } } },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      'prefer-destructuring': ['error', { object: true, array: false }]
    }
  }
];
