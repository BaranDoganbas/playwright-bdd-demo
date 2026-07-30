# Playwright BDD Demo Framework

[![E2E Tests](https://github.com/BaranDoganbas/playwright-bdd-demo/actions/workflows/e2e.yml/badge.svg)](https://github.com/BaranDoganbas/playwright-bdd-demo/actions/workflows/e2e.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](.nvmrc)

An end-to-end test framework built with [Playwright](https://playwright.dev) and
[playwright-bdd](https://github.com/vitalets/playwright-bdd). Same structure I use day to day on
enterprise software, rebuilt against public demo targets because the real suite is private.

26 scenarios: a web shop ([SauceDemo](https://www.saucedemo.com)) and a REST API
([RESTful Booker](https://restful-booker.herokuapp.com)), run as four Playwright projects.

**Live Cucumber report:** https://barandoganbas.github.io/playwright-bdd-demo/

## Quick start

```bash
npm ci
npx playwright install chromium
npm test
```

No `.env` needed. Everything defaults to the public demo targets, so a fresh clone runs green.

## What it covers

| Area        | Scenarios                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| Sign-in     | Success, locked-out account, wrong password, unknown user                       |
| Session     | Three protected pages reject a signed-out visitor; logout ends the session      |
| Catalogue   | All four sort orders, product page agrees with the catalogue price              |
| Cart        | Add, add several from a table, remove, badge count                              |
| Checkout    | Happy path, each required field missing, item total plus tax equals order total |
| Booking API | CRUD lifecycle, PUT replacement, search by guest name, health check             |
| API auth    | A write without a token is refused and leaves the booking untouched             |

Negative paths are over-represented on purpose. A suite that only walks the happy path tells you
the demo works, not that the system holds.

## Running a subset

```bash
npm run test:smoke        # 3 @smoke scenarios, ~5s
npm run test:api          # api project only
npm run test:ui           # auth + ui projects
npm run report            # open the last Playwright report

npx playwright test --grep @api        # by tag
npx playwright test --project=auth     # by project
```

Quality gates, the same three CI runs: `npm run lint`, `npm run format:check`, `npm run typecheck`.

## Layout

```
├── features/            # Gherkin, split by project: auth / ui / api
└── src/
    ├── pages/           # Page Objects
    ├── steps/           # step definitions (ui / api)
    ├── api/             # BookerClient: timeouts, auth, typed responses
    ├── config/          # env.ts, the only reader of process.env
    ├── data/            # test-data builders
    ├── fixtures/        # page objects, API client and scenario world, injected
    ├── setup/           # auth.setup.ts, persists storage state
    └── support/         # small shared helpers
```

`bddgen` turns the feature files into specs, the step definitions get their page objects and the
API client from fixtures, and the run produces a Cucumber HTML report plus the Playwright report.

## Design notes

**Login runs once.** The `setup` project signs in and persists storage state; the `ui` scenarios
reuse it. Login itself is tested in the `auth` project, which deliberately runs unauthenticated.
That keeps login out of the flakiness budget for every other scenario.

**One project per browser context.** Authenticated and unauthenticated flows can't share state, so
they are separate Playwright projects with a `dependencies` chain. CI can run `--project=api` on
its own.

**One place reads `process.env`.** [`src/config/env.ts`](src/config/env.ts) parses and validates
every setting on load. A bad value aborts the run before the first test, listing all the problems
at once, so nothing runs against a half-configured environment.

**The API client never asserts.** `BookerClient` owns timeouts and the single retry, on the auth
token only. Keeping assertions out of it means no retry can mask a failing expectation.

**Test data is generated, not literal.** RESTful Booker is a shared public sandbox that keeps
whatever anyone writes to it. [`aBooking()`](src/data/booking.ts) randomises the surname and
computes dates relative to today, so parallel workers and other people's data can't collide.

**Elements go through `getByTestId`.** `testIdAttribute` is set to `data-test` in the config, so
the convention lives in one line and page objects read as intent.

## Tags

`@ui`, `@auth`, `@api` mark the area and sit on the feature. `@regression` also sits on the
feature, so it always means the full suite. `@smoke` sits on individual scenarios and is a strict
subset: sign in, complete an order, run the booking lifecycle. If smoke grows past about five
scenarios it has stopped being smoke.

`--grep @smoke` filters at run time. `TAGS='@ui and not @slow'` filters at generation time, so the
unwanted specs are never produced.

## Configuration

[`.env.example`](.env.example) documents every variable. `.env` is gitignored, and real environment
variables win over the file.

| Variable                            | Default                             | Purpose                            |
| ----------------------------------- | ----------------------------------- | ---------------------------------- |
| `BASE_URL` / `API_BASE_URL`         | SauceDemo / RESTful Booker          | Targets                            |
| `STANDARD_USER` / `USER_PASSWORD`   | `standard_user` / `secret_sauce`    | UI account                         |
| `API_USER` / `API_PASSWORD`         | `admin` / `password123`             | API account for the token call     |
| `BROWSER`                           | `chromium`                          | `chromium`, `firefox` or `webkit`  |
| `HEADLESS`                          | `true`                              | `false` to watch a run             |
| `WORKERS` / `RETRIES`               | auto / `0` locally, `2` / `2` in CI | Parallelism and retries            |
| `TAGS`                              | _unset_                             | Tag expression, at generation time |
| `API_TIMEOUT` / `API_TOKEN_RETRIES` | `30000` / `3`                       | API resilience                     |
| `STORAGE_STATE`                     | `.auth/user.json`                   | Where the session is persisted     |

Both targets are public demo systems whose credentials are published on the sites themselves, which
is why they can be defaulted. Dropping a default makes a variable hard-required.

## CI

`.github/workflows/e2e.yml` runs on push, PR, a weekly schedule and manual dispatch. A `quality`
job (lint, format, types) runs alongside the suite, browser binaries are cached on the resolved
Playwright version, and the Cucumber report is published to Pages from `main`, including when tests
fail. Retries only apply in CI; locally a flaky test shows up as flaky.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

Built by Baran Doğanbaş, QA Automation Engineer. Portfolio: https://barandoganbas.netlify.app
