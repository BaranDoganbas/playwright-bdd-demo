/**
 * Reads a value an earlier step should have written to the scenario `world`.
 *
 * A `!` here would turn a mis-ordered scenario into "cannot read property of
 * undefined" deep inside a request. This names the value and the step that sets it.
 */
export function fromWorld<T>(value: T | undefined, name: string, setBy: string): T {
  if (value === undefined || value === null) {
    throw new Error(
      `Scenario state "${name}" is not set. It is written by the step "${setBy}", ` +
        `so add that step before this one in the feature file.`,
    );
  }
  return value;
}

/**
 * Narrows a value that came from a feature file to the set the code accepts.
 *
 * Gherkin hands over every parameter as a string, so a typo in an Examples table
 * reaches a page object as an unusable value and dies as a timeout. This fails on the
 * spot and names the alternatives.
 */
export function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  description: string,
): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(`${description} must be one of ${allowed.join(', ')}, got "${value}"`);
  }
  return match;
}
