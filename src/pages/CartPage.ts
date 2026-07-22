import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.locator('[data-test="inventory-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async expectItem(productName: string) {
    await expect(this.items.filter({ hasText: productName })).toBeVisible();
  }

  async expectItemCount(count: number) {
    await expect(this.items).toHaveCount(count);
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
