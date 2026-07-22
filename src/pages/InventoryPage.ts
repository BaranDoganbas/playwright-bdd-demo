import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly container: Locator;
  readonly items: Locator;
  readonly sortSelect: Locator;
  readonly prices: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.container = page.locator('[data-test="inventory-container"]');
    this.items = page.locator('[data-test="inventory-item"]');
    this.prices = page.locator('[data-test="inventory-item-price"]');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible();
  }

  async addToCart(productName: string) {
    const slug = productName.toLowerCase().replace(/\s+/g, '-');
    await this.page.locator(`[data-test="add-to-cart-${slug}"]`).click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
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
        const ascending = prices.every((price, i) => i === 0 || prices[i - 1] <= price);
        return ascending ? 'ascending' : `out of order: ${prices.join(', ')}`;
      })
      .toBe('ascending');
  }

  async expectCartCount(count: number) {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart() {
    await this.cartLink.click();
  }
}
