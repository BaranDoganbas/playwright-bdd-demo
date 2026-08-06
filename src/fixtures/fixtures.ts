import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AppMenu } from '../pages/AppMenu';
import { BookerClient } from '../api/booker.client';
import type { Booking } from '../data/booking';
import type { APIResponse } from '@playwright/test';

/**
 * Scratchpad for passing values between steps within one scenario.
 *
 * Typed, so steps read these fields without casting and a mistyped field name is a
 * compile error, not an `undefined` that surfaces three steps later.
 */
export type World = {
  token?: string;
  bookingId?: number;
  /** The payload that was sent, so later steps can assert round-tripped values. */
  booking?: Booking;
  /** The last response a step deliberately did not assert on, for the next step to check. */
  lastResponse?: APIResponse;
  /** A catalogue price noted before navigating, to compare against the product page. */
  notedPrice?: number;
  /** The protected path a signed-out scenario asked for, echoed back in the app's warning. */
  requestedPath?: string;
};

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  appMenu: AppMenu;
  booker: BookerClient;
  world: World;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  appMenu: async ({ page }, use) => {
    await use(new AppMenu(page));
  },
  booker: async ({ request }, use) => {
    await use(new BookerClient(request));
  },
  world: async ({}, use) => {
    await use({});
  },
});
