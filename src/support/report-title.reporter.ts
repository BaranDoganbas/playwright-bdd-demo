import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Reporter } from '@playwright/test/reporter';

type Options = {
  file: string;
  title: string;
};

/**
 * Sets the `<title>` of an HTML report another reporter has written. It runs in `onExit`,
 * which Playwright calls only after every reporter's `onEnd` has finished writing.
 */
export default class ReportTitleReporter implements Reporter {
  constructor(private readonly options: Options) {}

  printsToStdio(): boolean {
    return false;
  }

  onExit(): Promise<void> {
    const file = resolve(this.options.file);
    if (!existsSync(file)) return Promise.resolve();

    const html = readFileSync(file, 'utf-8');
    // A function, so a `$` in the title is not read as a replacement pattern.
    const titled = html.replace(
      /<title>[^<]*<\/title>/,
      () => `<title>${this.options.title}</title>`,
    );
    if (titled !== html) writeFileSync(file, titled);

    return Promise.resolve();
  }
}
