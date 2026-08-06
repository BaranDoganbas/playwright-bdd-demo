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
  // Whole object rather than field by field, so a silently dropped field is caught too.
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

When('I call the health endpoint', async ({ booker, world }) => {
  world.lastResponse = await booker.ping();
});

Then('the service should report itself up', async ({ world }) => {
  const response = fromWorld(world.lastResponse, 'lastResponse', 'When I call the health endpoint');
  // /ping answers 201, not 200.
  expect(response.status(), await responseDetail(response)).toBe(201);
});

Then("the booking should be listed under the guest's name", async ({ booker, world }) => {
  const sent = fromWorld(world.booking, 'booking', 'When I create a booking');
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');

  const response = await booker.findBookings(sent.firstname, sent.lastname);
  expect(response.status(), await responseDetail(response)).toBe(200);

  const matches = (await response.json()) as { bookingid: number }[];
  expect(
    matches.map((match) => match.bookingid),
    'filtered search should return the booking that was just created',
  ).toContain(id);
});

When('I replace the booking with a new payload', async ({ booker, world }) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');
  const token = fromWorld(world.token, 'token', 'Given I have an auth token');

  const replacement = aBooking({
    firstname: 'Replaced',
    totalprice: 275,
    depositpaid: false,
    additionalneeds: 'Early check-in',
  });

  const response = await booker.replaceBooking(id, token, replacement);
  expect(response.status(), await responseDetail(response)).toBe(200);

  // Later steps assert against what was last sent.
  world.booking = replacement;
});

When('I try to update the booking without a token', async ({ booker, world }) => {
  const id = fromWorld(world.bookingId, 'bookingId', 'When I create a booking');
  world.lastResponse = await booker.updateBookingUnauthenticated(id, { totalprice: 1 });
});

Then('the request should be refused as forbidden', async ({ world }) => {
  const response = fromWorld(
    world.lastResponse,
    'lastResponse',
    'When I try to update the booking without a token',
  );
  expect(response.status(), await responseDetail(response)).toBe(403);
});

When('I fetch the booking with id {int}', async ({ booker, world }, id: number) => {
  world.lastResponse = await booker.getBooking(id);
});

Then('the booking should not be found', async ({ world }) => {
  const response = fromWorld(
    world.lastResponse,
    'lastResponse',
    'When I fetch the booking with id ...',
  );
  expect(response.status(), await responseDetail(response)).toBe(404);
});

/** Puts the response body in the failure message, so a red run needs no re-run to diagnose. */
async function responseDetail(response: {
  status(): number;
  text(): Promise<string>;
}): Promise<string> {
  return `unexpected status ${response.status()}, body: ${(await response.text()).slice(0, 300)}`;
}
