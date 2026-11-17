const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'thumbnail_cache/**', 'settings_backups/**'] },
  js.configs.recommended,
  {
    files: ['main.js', 'preload.js', 'eslint.config.js', 'tests/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['renderer.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser } },
  },
  {
    rules: {
      // Existing code uses empty catch blocks and unused catch params deliberately.
      'no-unused-vars': ['warn', { caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
