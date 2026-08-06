import { defineConfig, devices } from '@playwright/test';
import { defineBddProject, cucumberReporter } from 'playwright-bdd';
import { env } from './src/config/env';

/**
 * Step scope is per-project on purpose. If the UI project could resolve an API step, a
 * genuinely missing step definition would hide behind the accidental match.
 */
const uiSteps = ['src/steps/ui/**/*.ts', 'src/fixtures/fixtures.ts'];
const apiSteps = ['src/steps/api/**/*.ts', 'src/fixtures/fixtures.ts'];
const tags = env.run.tags;

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
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'setup',
      testDir: './src/setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...browser, baseURL: env.ui.baseURL },
    },

    // Deliberately unauthenticated: login itself is what these scenarios test.
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
