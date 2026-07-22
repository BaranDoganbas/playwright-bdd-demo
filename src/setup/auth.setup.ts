import { test as setup } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Runs once before the authenticated UI suite.
 * Signs in as the standard user and persists storage state, so functional
 * scenarios never waste time re-running login.
 *
 * Drives the same page objects as the tests, so if a selector on the login page
 * changes this fails with the same clear error the `auth` suite gives, instead of a
 * mystery timeout in every downstream scenario.
 */
setup(
  `authenticate as ${env.users.standard.username}`,
  // Carries every tag the authenticated UI scenarios can be selected by. Without
  // this, `--grep @smoke` would filter out the dependency and leave the ui project
  // with no storage state.
  { tag: ['@smoke', '@regression', '@ui'] },
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.signInAs(env.users.standard.username);
    await inventoryPage.expectLoaded();

    await page.context().storageState({ path: env.ui.storageState });
  },
);
