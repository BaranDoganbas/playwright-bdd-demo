# Contributing

## Setup

Node is pinned in [`.nvmrc`](.nvmrc) (`nvm use` picks it up); `package.json` enforces `>=22`.

```bash
npm ci
npx playwright install chromium
npm test
```

No `.env` is required, since the defaults target the public demo systems. Copy `.env.example` to
`.env` if you want to point the suite elsewhere or watch a run with `HEADLESS=false`.

## Before opening a PR

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
```

All four must pass; CI runs exactly these. `npm run lint:fix` and `npm run format` handle most
issues automatically.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`refactor:`, `chore:`, `ci:`, `docs:`. Keep them atomic, one concern per commit.

## Adding a scenario to an existing feature

1. Write the scenario in the relevant file under `features/`. If it differs from an existing one
   only by its input values, add a row to that scenario's `Examples` table, or convert it to a
   `Scenario Outline` if it isn't one yet. A step that repeats with different values usually wants
   a data table instead.
2. Tag it. `@regression` is inherited from the feature and needs no repeating; add `@smoke` only
   if the suite would be meaningless without it (see the tagging section in the README).
3. Run `npm test`. `bddgen` regenerates the specs and reports any step it cannot resolve, with a
   ready-to-paste snippet.
4. Implement missing steps as described below.

## Adding a new feature file

1. **Pick the project.** The directory decides which Playwright project the feature belongs to,
   wired up in `playwright.config.ts`:

   | Directory        | Project | Context                                             |
   | ---------------- | ------- | --------------------------------------------------- |
   | `features/auth/` | `auth`  | Unauthenticated browser, login itself is under test |
   | `features/ui/`   | `ui`    | Authenticated browser, storage state pre-loaded     |
   | `features/api/`  | `api`   | No browser, `request` fixture only                  |

   A new area means a new project in `playwright.config.ts` with its own `features` glob and
   `steps` list. Keep step scope narrow: a UI project that can resolve an API step will hide a
   genuinely missing step definition behind an accidental match.

2. **Tag the feature** with its area (`@ui`, `@api`, ...) and `@regression`.

3. **Write the scenarios** in domain language. A step should read like something a product person
   would say: `When I add "Sauce Labs Backpack" to the cart`, not
   `When I click [data-test="add-to-cart-backpack"]`.

4. **Run `npx bddgen`** to see which steps are missing.

## Adding step definitions

Steps live in `src/steps/ui/` or `src/steps/api/` and are registered through the shared fixtures:

```ts
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

When('I add {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addToCart(productName);
});
```

What review will look for:

- Steps orchestrate, they don't locate. No `page.locator(...)` in a step definition, put it on a
  page object. API steps go through `BookerClient` rather than calling `request` directly.
- Assertions stay in the step or the page object, never in the client. The API client is allowed to
  retry, and anything that retries must not assert.
- Pass state through `world` and read it with `fromWorld()`. Add a typed field to `World` in
  `src/fixtures/fixtures.ts` rather than widening it back to a bag of unknowns.
- No `page.waitForTimeout`, no arbitrary sleeps. Use a web-first assertion; if you need to wait for
  a computed result, `expect.poll` retries properly and reports the value it saw.

## Adding a page object

One class per page in `src/pages/`, with locators built in the constructor:

```ts
export class InventoryPage {
  readonly container: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId('inventory-container');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.container).toBeVisible();
  }
}
```

- Address elements with `getByTestId('...')`. `testIdAttribute` is set to `data-test` in
  `playwright.config.ts`, so this resolves the attribute the app ships, and those attributes are a
  stability contract with the developers. Reach for a CSS or text selector only when no test id
  exists, and ask for one to be added.
- Name assertion methods `expectSomething()`. ESLint's `expect-expect` rule is configured to treat
  that prefix as an assertion, so a differently named one will make tests look assertion-free.
- Give every method an explicit return type; the linter enforces this.
- Register the page object as a fixture in `src/fixtures/fixtures.ts` so steps receive it by
  destructuring.

## Adding test data

Builders live in `src/data/`. Follow the shape of `aBooking()`: a function taking `Partial<T>`
overrides and returning a valid object, with anything that could collide on a shared backend
randomised and any date computed relative to today.

## Configuration

Never read `process.env` outside `src/config/env.ts`. Add the variable there with a parser and a
default, document it in `.env.example` and the README table, then consume it through `env`. Values
with no safe default should be declared without a fallback, so the run aborts with a clear message
instead of failing halfway through a scenario.
