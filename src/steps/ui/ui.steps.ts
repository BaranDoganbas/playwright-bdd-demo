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

// ---------- Authentication ----------

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

When('I navigate straight to {string}', async ({ loginPage }, path: string) => {
  await loginPage.goto(path);
});

Then('I should see the inventory dashboard', async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});

Then('I should see the login error {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});

Then('I should be back on the login page', async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When('I log out', async ({ appMenu }) => {
  await appMenu.logout();
});

// ---------- Catalogue ----------

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
    await inventoryPage.expectSortedBy(
      assertOneOf<SortField>(field, SORT_FIELDS, 'Sort field'),
      assertOneOf<SortDirection>(direction, SORT_DIRECTIONS, 'Sort direction'),
    );
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
  await productPage.expectShowing(product);
});

Then('the product page should show the noted price', async ({ productPage, world }) => {
  const price = fromWorld(
    world.notedPrice,
    'notedPrice',
    'When I note the catalogue price of "..."',
  );
  await productPage.expectPrice(price);
});

// ---------- Cart ----------

When('I add {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addToCart(productName);
});

// Table form for the multi-product case, so adding a product is one more row.
// The column check makes a mistyped header fail loudly; without it the step would
// happily add nothing.
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
  await inventoryPage.expectCartCount(count);
});

When('I open the cart', async ({ inventoryPage }) => {
  await inventoryPage.openCart();
});

When('I remove {string} from the cart', async ({ cartPage }, productName: string) => {
  await cartPage.remove(productName);
});

Then('the cart should contain {string}', async ({ cartPage }, productName: string) => {
  await cartPage.expectItem(productName);
});

Then('the cart should contain {int} item(s)', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});

// ---------- Checkout ----------

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
  await checkoutPage.expectError(message);
});

Then('the order total should equal the item total plus tax', async ({ checkoutPage }) => {
  await checkoutPage.expectTotalAddsUp();
});

When('I finish the order', async ({ checkoutPage }) => {
  await checkoutPage.finish();
});

Then('the order should be completed successfully', async ({ checkoutPage }) => {
  await checkoutPage.expectOrderComplete();
});
