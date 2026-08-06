/** SauceDemo renders money as `$29.99`, sometimes behind a label like `Item total: $29.99`. */
export function parseMoney(text: string): number {
  const match = /\$\s*(\d+(?:\.\d{1,2})?)/.exec(text);
  const amount = match?.[1];
  if (amount === undefined) {
    throw new Error(`Expected a dollar amount, got ${JSON.stringify(text)}`);
  }
  return Number(amount);
}
