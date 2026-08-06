import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import configPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Type-aware linting: reuses each workspace's tsconfig automatically.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // Must come last: turns off stylistic rules that would fight Prettier.
  configPrettier,
);
