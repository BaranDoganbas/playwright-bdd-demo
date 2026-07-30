/**
 * Asserts that a value an earlier step should have written to the scenario `world`
 * is actually there.
 *
 * Reaching for `!` would turn a mis-ordered Gherkin scenario into a confusing
 * "cannot read property of undefined" deep in a request; this names the missing
 * value and the step that should have produced it.
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
 * Narrows a value that arrived from a feature file to the set the code accepts.
 *
 * Gherkin hands every parameter over as a string, so a typo in an Examples table
 * would otherwise reach a page object as an unusable value and fail as a timeout.
 * This fails immediately, naming the column and the alternatives.
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
