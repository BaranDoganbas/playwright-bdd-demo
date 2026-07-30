/**
 * SauceDemo renders money as `$29.99`, sometimes behind a label such as
 * `Item total: $29.99`. Parsing here keeps the regex in one place and fails with the
 * text it actually saw, rather than producing a silent NaN that surfaces as a
 * confusing assertion diff further down.
 */
export function parseMoney(text: string): number {
  const match = /\$\s*(\d+(?:\.\d{1,2})?)/.exec(text);
  const amount = match?.[1];
  if (amount === undefined) {
    throw new Error(`Expected a dollar amount, got ${JSON.stringify(text)}`);
  }
  return Number(amount);
}
