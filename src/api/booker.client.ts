import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import type { Booking } from '../data/booking';

export type CreateBookingResponse = {
  bookingid: number;
  booking: Booking;
};

/** Typed wrapper over Playwright's `request`. Nothing here asserts, which is what makes the retry safe. */
export class BookerClient {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * The only retried request in the suite. It is a precondition rather than a subject
   * under test, and it is where a sandbox cold start turns a healthy run red.
   */
  async requestToken(): Promise<string> {
    const attempts = env.api.tokenRetries;
    const failures: string[] = [];

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await this.request.post('/auth', {
          data: env.api.credentials,
          timeout: env.api.timeout,
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

  ping(): Promise<APIResponse> {
    return this.request.get('/ping', { timeout: env.api.timeout });
  }

  createBooking(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking, timeout: env.api.timeout });
  }

  findBookings(firstname: string, lastname: string): Promise<APIResponse> {
    return this.request.get('/booking', {
      params: { firstname, lastname },
      timeout: env.api.timeout,
    });
  }

  /** Unlike PATCH, a partial payload here is rejected by the API. */
  replaceBooking(id: number, token: string, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, {
      headers: this.authHeaders(token),
      data: booking,
      timeout: env.api.timeout,
    });
  }

  /**
   * Its own method rather than an optional token argument: with an optional argument an
   * undefined token would silently turn an authorised test into this one.
   */
  updateBookingUnauthenticated(id: number, patch: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: patch, timeout: env.api.timeout });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { timeout: env.api.timeout });
  }

  updateBooking(id: number, token: string, patch: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, {
      headers: this.authHeaders(token),
      data: patch,
      timeout: env.api.timeout,
    });
  }

  deleteBooking(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, {
      headers: this.authHeaders(token),
      timeout: env.api.timeout,
    });
  }

  /** RESTful Booker authenticates writes with the token in a cookie, not a bearer header. */
  private authHeaders(token: string): Record<string, string> {
    return { Cookie: `token=${token}` };
  }
}
