import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/fixtures';
import { aBooking, type Booking } from '../../data/booking';
import type { CreateBookingResponse } from '../../api/booker.client';
import { fromWorld } from '../../support/preconditions';

const { Given, When, Then } = createBdd(test);

Given('I have an auth token', async ({ booker, world }) => {
  world.token = await booker.requestToken();
  expect(world.token, 'auth endpoint should return a token').toBeTruthy();
});

When('I create a booking', async ({ booker, world }) => {
  // Built fresh per scenario: the sandbox persists writes, so a fixed payload
  // would collide with parallel workers and with other users of the public API.
  const booking = aBooking();

  const response = await booker.createBooking(booking);
  expect(response.status(), await responseDetail(response)).toBe(200);

  const body = (await response.json()) as CreateBookingResponse;
  expect(body.bookingid, 'response should contain a booking id').toBeTruthy();

  world.booking = booking;
  world.bookingId = body.bookingid;
});

Then('I can fetch the booking and it matches what I sent', async ({ booker, world }) => {
  const sent = fromWorld(world.booking, 'booking', 'When I create a booking');
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');

  const response = await booker.getBooking(id);
  expect(response.status()).toBe(200);

  const body = (await response.json()) as Booking;
  // Compared whole rather than field by field: a silently dropped field is a real
  // defect, and asserting the object catches it without listing every key here.
  expect(body).toMatchObject(sent);
});

When('I update the booking total price to {int}', async ({ booker, world }, price: number) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');
  const token = fromWorld(world.token, 'token', 'Given I have an auth token');

  const response = await booker.updateBooking(id, token, { totalprice: price });
  expect(response.status(), await responseDetail(response)).toBe(200);
});

Then('the booking total price should be {int}', async ({ booker, world }, price: number) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');

  const response = await booker.getBooking(id);
  expect(response.status()).toBe(200);

  const body = (await response.json()) as Booking;
  expect(body.totalprice).toBe(price);
});

When('I delete the booking', async ({ booker, world }) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');
  const token = fromWorld(world.token, 'token', 'Given I have an auth token');

  const response = await booker.deleteBooking(id, token);
  // The API answers 201 to a successful DELETE; 200 is accepted in case it is
  // ever corrected to the conventional status.
  expect([200, 201], await responseDetail(response)).toContain(response.status());
});

Then('the booking should no longer exist', async ({ booker, world }) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');

  const response = await booker.getBooking(id);
  expect(response.status()).toBe(404);
});

/** Puts the response body in the failure message, so a red run needs no re-run to diagnose. */
async function responseDetail(response: {
  status(): number;
  text(): Promise<string>;
}): Promise<string> {
  return `unexpected status ${response.status()}, body: ${(await response.text()).slice(0, 300)}`;
}
