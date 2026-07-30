import { defineConfig, devices } from '@playwright/test';
import { defineBddProject, cucumberReporter } from 'playwright-bdd';
import { env } from './src/config/env';

/**
 * `tags` comes from the TAGS variable, so every project honours the same tag
 * expression and `npm run test:smoke` filters the whole suite in one pass.
 * Step scope stays per-project: a UI project that could resolve an API step would
 * hide a genuinely missing step definition behind an accidental match.
 */
const uiSteps = ['src/steps/ui/**/*.ts', 'src/fixtures/fixtures.ts'];
const apiSteps = ['src/steps/api/**/*.ts', 'src/fixtures/fixtures.ts'];
const tags = env.run.tags;

/** Selected by the BROWSER variable; every browser project shares one descriptor. */
const browser = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
}[env.run.browser];

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: env.run.retries,
  workers: env.run.workers,
  /** A stray `.only` should fail the CI run rather than silently skip the suite. */
  forbidOnly: env.isCI,
  reporter: [
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    headless: env.run.headless,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /**
     * Makes `getByTestId('username')` resolve the `data-test` attribute the app
     * actually ships, so page objects express intent instead of repeating an
     * attribute selector. Changing the convention is then a one-line change here.
     */
    testIdAttribute: 'data-test',
  },
  projects: [
    // 1) Logs in once and persists storage state for the authenticated UI suite
    {
      name: 'setup',
      testDir: './src/setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...browser, baseURL: env.ui.baseURL },
    },

    // 2) Authentication flows: intentionally unauthenticated (login itself is under test)
    {
      ...defineBddProject({
        name: 'auth',
        features: 'features/auth/**/*.feature',
        steps: uiSteps,
        tags,
      }),
      use: {
        ...browser,
        baseURL: env.ui.baseURL,
      },
    },

    // 3) Authenticated UI suite: reuses storage state, never re-runs login
    {
      ...defineBddProject({
        name: 'ui',
        features: 'features/ui/**/*.feature',
        steps: uiSteps,
        tags,
      }),
      dependencies: ['setup'],
      use: {
        ...browser,
        baseURL: env.ui.baseURL,
        storageState: env.ui.storageState,
      },
    },

    // 4) API suite: RESTful Booker (auth token + CRUD)
    {
      ...defineBddProject({
        name: 'api',
        features: 'features/api/**/*.feature',
        steps: apiSteps,
        tags,
      }),
      use: {
        baseURL: env.api.baseURL,
      },
    },
  ],
});
