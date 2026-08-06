import { type Page, type Locator } from '@playwright/test';
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

  async currentPrice(): Promise<number> {
    return parseMoney(await this.price.innerText());
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
