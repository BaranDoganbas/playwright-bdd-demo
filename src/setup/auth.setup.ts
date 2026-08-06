import { test as setup } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Signs in once and persists storage state for the authenticated UI suite. Uses the
 * same page objects as the tests, so a changed login selector fails here with a clear
 * error rather than as a mystery timeout in every scenario downstream.
 */
setup(
  `authenticate as ${env.users.standard.username}`,
  // Carries every tag the authenticated UI scenarios can be selected by. Without this,
  // `--grep @smoke` filters out the dependency and leaves the ui project with no
  // storage state.
  { tag: ['@smoke', '@ui'] },
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.signInAs(env.users.standard.username);
    await inventoryPage.expectLoaded();

    await page.context().storageState({ path: env.ui.storageState });
  },
);
