import { expect } from '@playwright/test';
import { createBdd, type DataTable } from 'playwright-bdd';
import { test } from '../../fixtures/fixtures';
import {
  SORT_OPTIONS,
  SORT_FIELDS,
  SORT_DIRECTIONS,
  type SortOption,
  type SortField,
  type SortDirection,
} from '../../pages/InventoryPage';
import { assertOneOf, fromWorld } from '../../support/preconditions';

const { Given, When, Then } = createBdd(test);

/** Scenarios name pages, not URLs; the mapping to paths belongs here rather than in Gherkin. */
const PROTECTED_PAGES: Record<string, string> = {
  'the product catalogue': '/inventory.html',
  'the cart': '/cart.html',
  'the checkout form': '/checkout-step-one.html',
};

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

When('I sign in as {string}', async ({ loginPage }, user: string) => {
  await loginPage.signInAs(user);
});

When(
  'I sign in as {string} with password {string}',
  async ({ loginPage }, user: string, password: string) => {
    await loginPage.signInAs(user, password);
  },
);

When('I request {string} without signing in', async ({ loginPage, world }, page: string) => {
  const path = PROTECTED_PAGES[page];
  if (!path) {
    throw new Error(
      `Unknown page "${page}". Known pages: ${Object.keys(PROTECTED_PAGES).join(', ')}.`,
    );
  }
  world.requestedPath = path;
  await loginPage.goto(path);
});

// Asserts the path back rather than a generic warning: SauceDemo echoes the page you
// asked for, and a message naming the wrong page would still be a defect.
Then('I should be told to sign in first', async ({ loginPage, world }) => {
  const path = fromWorld(
    world.requestedPath,
    'requestedPath',
    'When I request "..." without signing in',
  );
  await expect(loginPage.errorMessage).toContainText(
    `You can only access '${path}' when you are logged in.`,
  );
});

Then('I should see the inventory dashboard', async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});

Then('I should see the login error {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.errorMessage).toContainText(message);
});

Then('I should be back on the login page', async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When('I log out', async ({ appMenu }) => {
  await appMenu.logout();
});

Given('I am on the inventory page', async ({ inventoryPage }) => {
  await inventoryPage.goto();
  await inventoryPage.expectLoaded();
});

When('I sort products by {string}', async ({ inventoryPage }, option: string) => {
  await inventoryPage.sortBy(assertOneOf<SortOption>(option, SORT_OPTIONS, 'Sort option'));
});

Then(
  'the product {string} should be in {string} order',
  async ({ inventoryPage }, field: string, direction: string) => {
    const sortField = assertOneOf<SortField>(field, SORT_FIELDS, 'Sort field');
    const sortDirection = assertOneOf<SortDirection>(direction, SORT_DIRECTIONS, 'Sort direction');
    const ascending = sortDirection === 'ascending';

    // The sort is client-side, so reading straight after selecting can catch the
    // pre-sort DOM. Polling re-reads until it settles and prints the list it saw.
    await expect
      .poll(async () => {
        if (sortField === 'price') {
          const prices = await inventoryPage.itemPrices();
          const sorted = [...prices].sort((a, b) => (ascending ? a - b : b - a));
          return prices.join(',') === sorted.join(',') ? 'sorted' : `got ${prices.join(', ')}`;
        }
        const names = await inventoryPage.itemNames();
        const sorted = [...names].sort((a, b) =>
          ascending ? a.localeCompare(b) : b.localeCompare(a),
        );
        return names.join('|') === sorted.join('|') ? 'sorted' : `got ${names.join(', ')}`;
      })
      .toBe('sorted');
  },
);

When(
  'I note the catalogue price of {string}',
  async ({ inventoryPage, world }, product: string) => {
    world.notedPrice = await inventoryPage.priceOf(product);
  },
);

When('I open the product {string}', async ({ inventoryPage }, product: string) => {
  await inventoryPage.openProduct(product);
});

Then('the product page should show {string}', async ({ productPage }, product: string) => {
  await expect(productPage.name).toHaveText(product);
});

Then('the product page should show the noted price', async ({ productPage, world }) => {
  const price = fromWorld(
    world.notedPrice,
    'notedPrice',
    'When I note the catalogue price of "..."',
  );
  await expect.poll(() => productPage.currentPrice()).toBe(price);
});

When('I add {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addToCart(productName);
});

// Table form for the multi-product case, so adding a product is one more row. The
// column check makes a mistyped header fail loudly instead of adding nothing.
When('I add the following products to the cart:', async ({ inventoryPage }, table: DataTable) => {
  for (const row of table.hashes()) {
    const product = row.product;
    if (!product) {
      throw new Error(`Every row needs a non-empty "product" column, got: ${JSON.stringify(row)}`);
    }
    await inventoryPage.addToCart(product);
  }
});

Then('the cart badge should show {int}', async ({ inventoryPage }, count: number) => {
  await expect(inventoryPage.cartBadge).toHaveText(String(count));
});

When('I open the cart', async ({ inventoryPage }) => {
  await inventoryPage.openCart();
});

When('I remove {string} from the cart', async ({ cartPage }, productName: string) => {
  await cartPage.remove(productName);
});

Then('the cart should contain {string}', async ({ cartPage }, productName: string) => {
  await expect(cartPage.item(productName)).toBeVisible();
});

Then('the cart should contain {int} item(s)', async ({ cartPage }, count: number) => {
  await expect(cartPage.items).toHaveCount(count);
});

When('I proceed to checkout', async ({ cartPage }) => {
  await cartPage.checkout();
});

When(
  'I enter customer info {string} {string} {string}',
  async ({ checkoutPage }, firstName: string, lastName: string, postalCode: string) => {
    await checkoutPage.fillCustomerInfo(firstName, lastName, postalCode);
  },
);

Then('I should see the checkout error {string}', async ({ checkoutPage }, message: string) => {
  await expect(checkoutPage.errorMessage).toContainText(message);
});

Then('the order total should equal the item total plus tax', async ({ checkoutPage }) => {
  const { subtotal, tax, total } = await checkoutPage.summary();
  // Whole cents, to keep floats out of it. Computed rather than compared against a
  // hardcoded total, so a price change doesn't break the test but a broken sum does.
  const cents = (amount: number): number => Math.round(amount * 100);
  expect(cents(total), `item total ${subtotal} plus tax ${tax}`).toBe(cents(subtotal) + cents(tax));
});

When('I finish the order', async ({ checkoutPage }) => {
  await checkoutPage.finish();
});

Then('the order should be completed successfully', async ({ checkoutPage }) => {
  await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
});
