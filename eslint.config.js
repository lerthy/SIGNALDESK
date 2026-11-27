import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '.claude'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Express error handlers must declare 4 parameters even when `next` is unused.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
