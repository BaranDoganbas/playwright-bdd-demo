# Playwright BDD Demo

[![E2E Tests](https://github.com/BaranDoganbas/playwright-bdd-demo/actions/workflows/e2e.yml/badge.svg)](https://github.com/BaranDoganbas/playwright-bdd-demo/actions/workflows/e2e.yml)

An end-to-end suite built with [Playwright](https://playwright.dev) and
[playwright-bdd](https://github.com/vitalets/playwright-bdd). The layout mirrors a suite I maintain
in production: storage-state auth so sign-in runs once, project separation so the API suite never
boots a browser, and page objects that stop at readiness.

26 scenarios across a web shop ([SauceDemo](https://www.saucedemo.com)) and a REST API
([RESTful Booker](https://restful-booker.herokuapp.com)), run as four Playwright projects.

Both targets are fixtures. They were chosen because they are public and stable, and neither is deep
enough to be interesting on its own. What the suite does with them is the part worth reading: 11 of
the 26 scenarios are negative paths, the checkout total is computed from the page rather than
hardcoded, and the authorisation scenario checks the booking was actually left untouched instead of
trusting the 403.

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

## Running a subset

```bash
npm run test:smoke   # 3 @smoke scenarios, ~5s
npm run test:api     # api project only
npm run test:ui      # auth + ui projects
npm run report       # open the last Playwright report

npx playwright test --project=api   # by project
TAGS='@ui and not @slow' npm test   # tag expression, applied at generation time
```

`@ui`, `@auth` and `@api` mark the area and sit on the feature. `@smoke` sits on three individual
scenarios: sign in, complete an order, run the booking lifecycle. A scenario earns `@smoke` if its
failure would make the rest of the run not worth reading, which is why there are three of them and
why the list has not grown. There is no `@regression` tag, because a
tag applied to every feature selects everything and tells you nothing; the regression run is
`npm test`.

## Layout

```
features/      Gherkin, one directory per Playwright project
src/pages/     page objects
src/steps/     step definitions, scoped per project
src/api/       BookerClient
src/config/    env.ts
src/data/      test-data builders
src/fixtures/  page objects and the scenario world, injected into steps
src/setup/     auth.setup.ts
src/support/   parseMoney, world preconditions
```

`bddgen` turns the feature files into specs, steps get their page objects and the API client from
fixtures, and the run produces a Cucumber HTML report alongside the Playwright one. `testIdAttribute`
is set to `data-test` in the config, so `getByTestId()` resolves the attribute SauceDemo already
ships.

## Design notes

**Authorisation is checked at the layer that enforces it.** A hidden button proves nothing about
whether the backend refused the write. The API scenario sends an update with no token, asserts the
403, and then re-reads the booking to confirm the price is unchanged. A status code on its own only
proves the API said no, not that it meant it.

**Anything that retries must not assert.** `BookerClient` owns the timeouts and the single retry,
which applies to the auth token and nothing else. There is no `expect` anywhere in it. That is what
makes the retry safe: it cannot mask a failing assertion, only a cold sandbox.

**Only `src/config/env.ts` reads `process.env`.** It validates everything on load, so a bad value
aborts before the first test with all the problems listed at once.

**Page objects stop at readiness.** They expose locators and parsed values and own `expectLoaded()`;
every business assertion lives in the step definition, next to the scenario it belongs to. Reading a
step tells you what is being checked without opening a second file.

**Locators start from role and accessible name.** A test id is what I ask a developer for when the
role query cannot disambiguate, which is why this repo uses SauceDemo's `data-test` attributes where
they exist and falls back to the accessible name for the menu button, which ships none.

**Login runs once.** The `setup` project signs in and persists storage state, and the `ui` scenarios
reuse it. Login itself is covered by the `auth` project, which runs unauthenticated on purpose. That
keeps sign-in out of the flakiness budget for every other scenario.

## Known limitations

RESTful Booker is a shared public sandbox. Other people's bookings are in it, which is why
[`aBooking()`](src/data/booking.ts) randomises the surname and computes dates relative to today. It
also cold-starts, which is why the token call is the one retried request. It goes down sometimes, and
when the API project is red that is worth checking before anything else.

CI installs chromium only. There is no cross-browser matrix and no visual regression; `BROWSER`
exists so an engine-specific bug can be reproduced locally.

The sort check polls, because the sort is client-side and there is no signal to wait on. It is the
weakest assertion here.

The four checkout scenarios each repeat the same four steps: add, open cart, proceed, enter details.
A composite step would collapse that to one line, and I left it alone. Someone outside the team
reading the scenario should be able to follow what the customer did without being told that
"I check out with valid details" happens to mean four things. The duplication costs three lines a
scenario and buys a feature file that still explains itself, which is most of why the Gherkin is
here at all.

## Configuration

[`.env.example`](.env.example) documents every variable and its default. `.env` is gitignored, and
real environment variables win over the file. Both targets publish their own credentials on their
sites, which is why they can be defaulted at all; dropping a default makes a variable hard-required.

## CI

`.github/workflows/e2e.yml` runs on pull requests, pushes to `main`, a weekly schedule and manual
dispatch. Lint, format and type checks run as a separate job in parallel with the suite. Browser
binaries are cached against the resolved Playwright version. On pushes to `main` the Cucumber report
is published to Pages, including when tests fail, since a red report is the one worth reading.
Retries apply only in CI, so a flaky test fails locally.
