import { defineConfig, devices } from '@playwright/test';
import { defineBddProject, cucumberReporter } from 'playwright-bdd';

const STORAGE_STATE = '.auth/user.json';

export default defineConfig({
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1) Logs in once and persists storage state for the authenticated UI suite
    {
      name: 'setup',
      testDir: './src/setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2) Authentication flows: intentionally unauthenticated (login itself is under test)
    {
      ...defineBddProject({
        name: 'auth',
        features: 'features/auth/**/*.feature',
        steps: ['src/steps/ui/**/*.ts', 'src/fixtures/fixtures.ts'],
      }),
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
      },
    },

    // 3) Authenticated UI suite: reuses storage state, never re-runs login
    {
      ...defineBddProject({
        name: 'ui',
        features: 'features/ui/**/*.feature',
        steps: ['src/steps/ui/**/*.ts', 'src/fixtures/fixtures.ts'],
      }),
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: STORAGE_STATE,
      },
    },

    // 4) API suite: RESTful Booker (auth token + CRUD)
    {
      ...defineBddProject({
        name: 'api',
        features: 'features/api/**/*.feature',
        steps: ['src/steps/api/**/*.ts', 'src/fixtures/fixtures.ts'],
      }),
      use: {
        baseURL: 'https://restful-booker.herokuapp.com',
      },
    },
  ],
});

export { STORAGE_STATE };
