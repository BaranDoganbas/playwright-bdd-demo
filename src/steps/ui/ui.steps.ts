import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

// ---------- Authentication ----------

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

When('I sign in as {string}', async ({ loginPage }, user: string) => {
  await loginPage.signInAs(user);
});

When('I sign in as {string} with password {string}', async ({ loginPage }, user: string, password: string) => {
  await loginPage.signInAs(user, password);
});

Then('I should see the inventory dashboard', async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});

Then('I should see the login error {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});

// ---------- Inventory & cart ----------

Given('I am on the inventory page', async ({ inventoryPage }) => {
  await inventoryPage.goto();
  await inventoryPage.expectLoaded();
});

When('I add {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addToCart(productName);
});

When('I sort products by price low to high', async ({ inventoryPage }) => {
  await inventoryPage.sortBy('lohi');
});

Then('products should be ordered by ascending price', async ({ inventoryPage }) => {
  const prices = await inventoryPage.itemPrices();
  const sorted = [...prices].sort((a, b) => a - b);
  expect(prices).toEqual(sorted);
});

Then('the cart badge should show {int}', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartCount(count);
});

When('I open the cart', async ({ inventoryPage }) => {
  await inventoryPage.openCart();
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

When('I finish the order', async ({ checkoutPage }) => {
  await checkoutPage.finish();
});

Then('the order should be completed successfully', async ({ checkoutPage }) => {
  await checkoutPage.expectOrderComplete();
});
