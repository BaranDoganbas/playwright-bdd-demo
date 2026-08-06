import { type Page, type Locator } from '@playwright/test';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  item(productName: string): Locator {
    return this.items.filter({ hasText: productName });
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
