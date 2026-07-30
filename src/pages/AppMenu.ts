import { type Page, type Locator } from '@playwright/test';

/**
 * The burger menu in the header, which is shared by every authenticated page rather
 * than belonging to one of them.
 *
 * The button itself ships no `data-test` attribute, so it is addressed by its
 * accessible name. That is the next best thing after a test id: it breaks only if the
 * control stops being a button or stops being labelled, both of which are worth
 * failing on.
 */
export class AppMenu {
  readonly openButton: Locator;
  readonly logoutLink: Locator;
  readonly resetLink: Locator;

  constructor(private readonly page: Page) {
    this.openButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  async open(): Promise<void> {
    await this.openButton.click();
  }

  async logout(): Promise<void> {
    await this.open();
    await this.logoutLink.click();
  }
}
