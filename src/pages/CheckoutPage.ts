import { type Page, type Locator, expect } from '@playwright/test';
import { parseMoney } from '../support/money';

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly errorMessage: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.completeHeader = page.getByTestId('complete-header');
    this.errorMessage = page.getByTestId('error');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
  }

  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }

  /**
   * The summary is the one place the shop does arithmetic in front of the customer, so
   * it is asserted as arithmetic rather than against a hardcoded total: the test stays
   * valid if the catalogue price or the tax rate changes, and still fails if the sum
   * stops adding up. Compared in whole cents to avoid float noise.
   */
  async expectTotalAddsUp(): Promise<void> {
    const subtotal = parseMoney(await this.subtotalLabel.innerText());
    const tax = parseMoney(await this.taxLabel.innerText());
    const total = parseMoney(await this.totalLabel.innerText());

    const cents = (amount: number): number => Math.round(amount * 100);
    expect(cents(total), `item total ${subtotal} plus tax ${tax} should equal total ${total}`).toBe(
      cents(subtotal) + cents(tax),
    );
  }
}
