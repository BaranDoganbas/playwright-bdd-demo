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
 * Values passed between steps within one scenario. Typed, so a mistyped field is a
 * compile error rather than an `undefined` that surfaces three steps later.
 */
export type World = {
  token?: string;
  bookingId?: number;
  booking?: Booking;
  /** A response a step deliberately did not assert on, for the next step to check. */
  lastResponse?: APIResponse;
  notedPrice?: number;
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
