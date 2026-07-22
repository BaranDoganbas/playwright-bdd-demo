import { expect, APIResponse } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

const samplePayload = {
  firstname: 'Baran',
  lastname: 'Doganbas',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
  additionalneeds: 'Late checkout',
};

Given('I have an auth token', async ({ request, world }) => {
  const res = await request.post('/auth', {
    data: { username: 'admin', password: 'password123' },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  expect(token, 'auth endpoint should return a token').toBeTruthy();
  world.token = token;
});

When('I create a booking', async ({ request, world }) => {
  const res = await request.post('/booking', { data: samplePayload });
  expect(res.status()).toBe(200);
  const body = await res.json();
  world.bookingId = body.bookingid;
  expect(world.bookingId, 'response should contain a booking id').toBeTruthy();
});

Then('I can fetch the booking and it matches what I sent', async ({ request, world }) => {
  const res = await request.get(`/booking/${world.bookingId}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.firstname).toBe(samplePayload.firstname);
  expect(body.totalprice).toBe(samplePayload.totalprice);
  expect(body.bookingdates.checkin).toBe(samplePayload.bookingdates.checkin);
});

When('I update the booking total price to {int}', async ({ request, world }, price: number) => {
  const res = await request.patch(`/booking/${world.bookingId}`, {
    headers: { Cookie: `token=${world.token}` },
    data: { totalprice: price },
  });
  expect(res.status()).toBe(200);
});

Then('the booking total price should be {int}', async ({ request, world }, price: number) => {
  const res = await request.get(`/booking/${world.bookingId}`);
  const body = await res.json();
  expect(body.totalprice).toBe(price);
});

When('I delete the booking', async ({ request, world }) => {
  const res: APIResponse = await request.delete(`/booking/${world.bookingId}`, {
    headers: { Cookie: `token=${world.token}` },
  });
  expect([200, 201]).toContain(res.status());
});

Then('the booking should no longer exist', async ({ request, world }) => {
  const res = await request.get(`/booking/${world.bookingId}`);
  expect(res.status()).toBe(404);
});
