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

  /** The card for one product, used to read values that belong to that product only. */
  private card(productName: string): Locator {
    return this.items.filter({ hasText: productName });
  }

  /**
   * SauceDemo derives the button's test id from the product name, so the slug is
   * built the same way rather than mapping every product by hand.
   */
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

  /**
   * Sorting is applied client-side, so reading the list straight after `sortBy` can
   * observe the pre-sort DOM. `expect.poll` re-reads until the order settles and
   * reports the list it saw, which beats a sleep and beats a bare boolean.
   */
  async expectSortedBy(field: SortField, direction: SortDirection): Promise<void> {
    await expect
      .poll(async () => {
        if (field === 'price') {
          const values = await this.itemPrices();
          const sorted = [...values].sort((a, b) => (direction === 'ascending' ? a - b : b - a));
          return values.join(',') === sorted.join(',') ? 'sorted' : `got ${values.join(', ')}`;
        }
        const values = await this.itemNames();
        const sorted = [...values].sort((a, b) =>
          direction === 'ascending' ? a.localeCompare(b) : b.localeCompare(a),
        );
        return values.join('|') === sorted.join('|') ? 'sorted' : `got ${values.join(', ')}`;
      })
      .toBe('sorted');
  }

  async expectCartCount(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
