// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    ignores: [
      '.features-gen/',
      'node_modules/',
      'playwright-report/',
      'cucumber-report/',
      'test-results/',
      '.auth/',
    ],
  },

  js.configs.recommended,

  // Type-aware linting is here for one rule in particular: a forgotten `await` on an
  // assertion never fails, which is the most common source of silent flakiness.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
    },
  },

  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  {
    files: ['src/**/*.ts', 'playwright.config.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Both rules look for assertions inside a test() body. Here the tests are
      // generated into .features-gen/ and the assertions live in step definitions
      // registered at module scope, so neither rule can see a true positive: one only
      // ever fires on the setup file, which does assert, through a page object.
      'playwright/no-standalone-expect': 'off',
      'playwright/expect-expect': 'off',
    },
  },

  // Must stay last: turns off every stylistic rule Prettier owns.
  prettier,
);
