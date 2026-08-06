import { type Page, type Locator } from '@playwright/test';
import { parseMoney } from '../support/money';

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
