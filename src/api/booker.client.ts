import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import type { Booking } from '../data/booking';

export type CreateBookingResponse = {
  bookingid: number;
  booking: Booking;
};

/**
 * Thin typed wrapper over Playwright's `request` fixture.
 *
 * It exists to keep two things out of the step definitions: the transport policy
 * (per-request timeout, retry on the token call) and response typing. Steps stay
 * about behaviour and keep every assertion. The client never asserts, so a retry
 * cannot mask a failing expectation.
 */
export class BookerClient {
  constructor(private readonly request: APIRequestContext) {}

  /** RESTful Booker cold-starts on a free dyno, so every call gets an explicit ceiling. */
  private get timeout(): number {
    return env.api.timeout;
  }

  /**
   * Obtains an auth token, retrying the call itself on transport errors or a
   * non-200 response.
   *
   * This is the only retried request in the suite. The token call is a precondition
   * rather than a subject under test, and it is the one place where a sandbox cold
   * start turns an otherwise healthy run red. Every assertion, including those about
   * auth-protected writes, still runs exactly once.
   */
  async requestToken(): Promise<string> {
    const attempts = env.api.tokenRetries;
    const failures: string[] = [];

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await this.request.post('/auth', {
          data: env.api.credentials,
          timeout: this.timeout,
        });

        if (response.ok()) {
          const body = (await response.json()) as { token?: string; reason?: string };
          if (body.token) return body.token;
          failures.push(`attempt ${attempt}: 200 but no token (reason: ${body.reason ?? 'none'})`);
        } else {
          failures.push(`attempt ${attempt}: HTTP ${response.status()}`);
        }
      } catch (error) {
        failures.push(`attempt ${attempt}: ${(error as Error).message}`);
      }

      if (attempt < attempts) {
        // Linear backoff: a cold-starting dyno needs seconds, not milliseconds.
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }

    throw new Error(
      `Could not obtain an auth token from ${env.api.baseURL} after ${attempts} attempts:\n` +
        failures.map((line) => `  ${line}`).join('\n'),
    );
  }

  createBooking(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking, timeout: this.timeout });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { timeout: this.timeout });
  }

  updateBooking(id: number, token: string, patch: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, {
      headers: this.authHeaders(token),
      data: patch,
      timeout: this.timeout,
    });
  }

  deleteBooking(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, {
      headers: this.authHeaders(token),
      timeout: this.timeout,
    });
  }

  /** RESTful Booker authenticates writes with the token in a cookie, not a bearer header. */
  private authHeaders(token: string): Record<string, string> {
    return { Cookie: `token=${token}` };
  }
}
