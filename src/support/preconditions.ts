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
