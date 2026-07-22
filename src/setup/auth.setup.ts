import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../playwright.config';

/**
 * Runs once before the authenticated UI suite.
 * Signs in as the standard user and persists storage state,
 * so functional scenarios never waste time re-running login.
 */
setup('authenticate as standard_user', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  await expect(page.locator('[data-test="inventory-container"]')).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
