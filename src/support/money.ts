/**
 * SauceDemo renders money as `$29.99`, sometimes behind a label like
 * `Item total: $29.99`. Keeps the regex in one place, and throws with the text it saw
 * so a bad read doesn't become a silent NaN in an assertion diff.
 */
export function parseMoney(text: string): number {
  const match = /\$\s*(\d+(?:\.\d{1,2})?)/.exec(text);
  const amount = match?.[1];
  if (amount === undefined) {
    throw new Error(`Expected a dollar amount, got ${JSON.stringify(text)}`);
  }
  return Number(amount);
}
