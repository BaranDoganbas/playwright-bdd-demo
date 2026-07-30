import { type Page, type Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly container: Locator;
  readonly items: Locator;
  readonly sortSelect: Locator;
  readonly prices: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId('inventory-container');
    this.items = page.getByTestId('inventory-item');
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

  /**
   * SauceDemo derives the button's test id from the product name, so the slug is
   * built the same way rather than mapping every product by hand.
   */
  async addToCart(productName: string): Promise<void> {
    const slug = productName.toLowerCase().replace(/\s+/g, '-');
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async itemPrices(): Promise<number[]> {
    const texts = await this.prices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  /**
   * Sorting is applied client-side, so reading prices straight after `sortBy` can
   * observe the pre-sort DOM. `expect.poll` re-reads until the order settles and
   * reports the offending list, which beats a sleep.
   */
  async expectPricesAscending(): Promise<void> {
    await expect
      .poll(async () => {
        const prices = await this.itemPrices();
        const sorted = [...prices].sort((a, b) => a - b);
        const ascending = prices.join(',') === sorted.join(',');
        return ascending ? 'ascending' : `out of order: ${prices.join(', ')}`;
      })
      .toBe('ascending');
  }

  async expectCartCount(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
