import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly container: Locator;
  readonly items: Locator;
  readonly sortSelect: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.container = page.locator('[data-test="inventory-container"]');
    this.items = page.locator('[data-test="inventory-item"]');
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
    const texts = await this.page.locator('[data-test="inventory-item-price"]').allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async expectCartCount(count: number) {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart() {
    await this.cartLink.click();
  }
}
