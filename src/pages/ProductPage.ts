import { type Page, type Locator } from '@playwright/test';
import { parseMoney } from '../support/money';

/** Detail view for a single product, reached by opening a product from the catalogue. */
export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;

  constructor(page: Page) {
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
  }

  async currentPrice(): Promise<number> {
    return parseMoney(await this.price.innerText());
  }
}
