import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { BookerClient } from '../api/booker.client';
import type { Booking } from '../data/booking';

/**
 * Scratchpad for passing values between steps within a single scenario.
 *
 * Typed rather than `Record<string, unknown>`: steps read these fields without
 * casting, and a typo in a field name is a compile error instead of `undefined`
 * surfacing three steps later.
 */
export type World = {
  token?: string;
  bookingId?: number;
  /** The payload that was sent, so later steps can assert round-tripped values. */
  booking?: Booking;
};

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
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
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  booker: async ({ request }, use) => {
    await use(new BookerClient(request));
  },
  world: async ({}, use) => {
    await use({});
  },
});
