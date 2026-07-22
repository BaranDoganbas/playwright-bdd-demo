import { randomUUID } from 'node:crypto';

export type BookingDates = {
  /** ISO date, YYYY-MM-DD. */
  checkin: string;
  checkout: string;
};

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

/** Days from today, formatted as the YYYY-MM-DD the API expects. */
function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a valid booking, with every field overridable.
 *
 * RESTful Booker is a shared public sandbox that persists what anyone writes to it
 * and exposes filtered search by name. Fixed literals would collide with other
 * people's data and with parallel workers in this suite, so the surname carries a
 * random suffix and stay dates are always relative to today. The payload cannot go
 * stale or clash, and a failure stays traceable to one run.
 */
export function aBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Baran',
    lastname: `Doganbas-${randomUUID().slice(0, 8)}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: {
      checkin: isoDaysFromNow(1),
      checkout: isoDaysFromNow(5),
    },
    additionalneeds: 'Late checkout',
    ...overrides,
  };
}
