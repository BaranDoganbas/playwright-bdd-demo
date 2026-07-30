import { type Page, type Locator, expect } from '@playwright/test';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async expectItem(productName: string): Promise<void> {
    await expect(this.items.filter({ hasText: productName })).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.items).toHaveCount(count);
  }

  /** Remove buttons carry the same name-derived slug as the add buttons. */
  async remove(productName: string): Promise<void> {
    const slug = productName.toLowerCase().replace(/\s+/g, '-');
    await this.page.getByTestId(`remove-${slug}`).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
