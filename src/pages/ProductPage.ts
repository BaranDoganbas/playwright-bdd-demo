import { type Page, type Locator, expect } from '@playwright/test';
import { parseMoney } from '../support/money';

/** Detail view for a single product, reached by opening a product from the catalogue. */
export class ProductPage {
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly backButton: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.backButton = page.getByTestId('back-to-products');
  }

  async expectShowing(productName: string): Promise<void> {
    await expect(this.name).toHaveText(productName);
  }

  async expectPrice(amount: number): Promise<void> {
    await expect.poll(async () => parseMoney(await this.price.innerText())).toBe(amount);
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
