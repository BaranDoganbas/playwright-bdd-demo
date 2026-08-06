import { type Page, type Locator, expect } from '@playwright/test';
import { env } from '../config/env';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  /** Takes a path so a scenario can request a protected page and watch the app bounce it back here. */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /** SauceDemo accepts one password for every account, so only the user is usually worth naming. */
  async signInAs(user: string, password: string = env.users.standard.password): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }
}
