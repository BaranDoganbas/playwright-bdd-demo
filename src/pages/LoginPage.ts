import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.username = page.locator('[data-test="username"]');
    this.password = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async signInAs(user: string, password = 'secret_sauce') {
    await this.username.fill(user);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
