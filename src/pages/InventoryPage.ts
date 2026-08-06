import { type Page, type Locator, expect } from '@playwright/test';
import { parseMoney } from '../support/money';

export const SORT_OPTIONS = ['az', 'za', 'lohi', 'hilo'] as const;
export const SORT_FIELDS = ['name', 'price'] as const;
export const SORT_DIRECTIONS = ['ascending', 'descending'] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export class InventoryPage {
  readonly container: Locator;
  readonly items: Locator;
  readonly names: Locator;
  readonly prices: Locator;
  readonly sortSelect: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId('inventory-container');
    this.items = page.getByTestId('inventory-item');
    this.names = page.getByTestId('inventory-item-name');
    this.prices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.container).toBeVisible();
  }

  private card(productName: string): Locator {
    return this.items.filter({ hasText: productName });
  }

  /** SauceDemo builds the button's test id from the product name, so we do the same. */
  async addToCart(productName: string): Promise<void> {
    const slug = productName.toLowerCase().replace(/\s+/g, '-');
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  async priceOf(productName: string): Promise<number> {
    const price = this.card(productName).getByTestId('inventory-item-price');
    return parseMoney(await price.innerText());
  }

  async openProduct(productName: string): Promise<void> {
    await this.card(productName).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async itemPrices(): Promise<number[]> {
    const texts = await this.prices.allTextContents();
    return texts.map(parseMoney);
  }

  async itemNames(): Promise<string[]> {
    const texts = await this.names.allTextContents();
    return texts.map((text) => text.trim());
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
