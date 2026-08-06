import { randomUUID } from 'node:crypto';

export type BookingDates = {
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

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a valid booking, with every field overridable. The surname carries a random
 * suffix and the dates are relative to today because RESTful Booker is a shared public
 * sandbox: fixed values would collide with parallel workers and with other people's data.
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
