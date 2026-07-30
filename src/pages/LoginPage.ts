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

  /**
   * `path` exists so a scenario can request a protected page directly and assert that
   * the app bounces it back here, which is the only way to test that from the
   * unauthenticated project.
   */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Password defaults to the shared demo password: SauceDemo accepts it for every
   * account, so scenarios only name the user unless the password itself is the subject.
   */
  async signInAs(user: string, password: string = env.users.standard.password): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }
}
