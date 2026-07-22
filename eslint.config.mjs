// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    // bddgen output is generated from features/ on every run and never hand-edited.
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

  // Type-aware linting catches the errors that matter in async test code, notably
  // floating promises: a forgotten `await` on an assertion never fails, which is the
  // most common source of silent flakiness in Playwright suites.
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
      // Page objects and step definitions are exported API, so an explicit return
      // type documents them and stops an inferred `any` leaking into a test.
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
    },
  },

  // This config file itself is not part of tsconfig's program, so type-aware rules
  // have nothing to work with here.
  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Playwright antipatterns: hard waits, conditional assertions, focused/skipped
  // tests, expects outside a test body.
  {
    files: ['src/**/*.ts', 'playwright.config.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Page objects own their assertions (`inventoryPage.expectLoaded()`), so the
      // rule must recognise those or every test that delegates looks assertion-free.
      // This is the naming convention for assertion methods on a page object.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect[A-Z]'] }],
      // Step definitions are registered at module scope by createBdd(), so their
      // `expect` calls are legitimately outside a test() callback. The rule cannot
      // model that indirection; the type checker still guarantees they run in one.
      'playwright/no-standalone-expect': 'off',
    },
  },

  // Must stay last: turns off every stylistic rule Prettier owns.
  prettier,
);
