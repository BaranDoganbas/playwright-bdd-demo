import { config as loadDotenv } from 'dotenv';

/**
 * Every environment-dependent value in the suite. Nothing outside this module reads
 * `process.env`. Real environment variables win over `.env`, so CI secrets override a
 * local file.
 */
loadDotenv({ quiet: true });

/** Collected during parsing so a misconfigured run reports every problem at once. */
const problems: string[] = [];

function fail(variable: string, reason: string): void {
  problems.push(`  ${variable}: ${reason}`);
}

/**
 * A `fallback` is only supplied for the public demo systems, whose credentials are
 * published on the sites themselves. Omitting it makes the variable hard-required.
 */
function str(variable: string, fallback?: string): string {
  const raw = process.env[variable]?.trim();
  if (raw) return raw;
  if (raw === '') {
    fail(variable, 'is set but empty');
    return '';
  }
  if (fallback === undefined) {
    fail(variable, 'is required and has no default');
    return '';
  }
  return fallback;
}

function url(variable: string, fallback: string): string {
  const value = str(variable, fallback);
  try {
    new URL(value);
  } catch {
    fail(variable, `must be an absolute URL (got "${value}")`);
  }
  return value.replace(/\/$/, '');
}

function bool(variable: string, fallback: boolean): boolean {
  const raw = process.env[variable]?.trim().toLowerCase();
  if (raw === undefined || raw === '') return fallback;
  if (['1', 'true', 'yes'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  fail(variable, `must be a boolean (true/false, got "${raw}")`);
  return fallback;
}

function oneOf<T extends string>(variable: string, fallback: T, allowed: readonly T[]): T {
  const raw = process.env[variable]?.trim().toLowerCase();
  if (raw === undefined || raw === '') return fallback;
  const match = allowed.find((value) => value === raw);
  if (match === undefined) {
    fail(variable, `must be one of ${allowed.join(', ')} (got "${raw}")`);
    return fallback;
  }
  return match;
}

function int(variable: string, fallback: number, min = 1): number {
  const raw = process.env[variable]?.trim();
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min) {
    fail(variable, `must be an integer >= ${min} (got "${raw}")`);
    return fallback;
  }
  return parsed;
}

const isCI = bool('CI', false);

const parsed = {
  isCI,

  ui: {
    baseURL: url('BASE_URL', 'https://www.saucedemo.com'),
    storageState: str('STORAGE_STATE', '.auth/user.json'),
  },

  api: {
    baseURL: url('API_BASE_URL', 'https://restful-booker.herokuapp.com'),
    /** The public sandbox cold-starts and can stall for seconds. */
    timeout: int('API_TIMEOUT', 30_000),
    tokenRetries: int('API_TOKEN_RETRIES', 3),
    credentials: {
      username: str('API_USER', 'admin'),
      password: str('API_PASSWORD', 'password123'),
    },
  },

  users: {
    standard: {
      username: str('STANDARD_USER', 'standard_user'),
      password: str('USER_PASSWORD', 'secret_sauce'),
    },
  },

  run: {
    headless: bool('HEADLESS', true),
    /** Chromium is the default because it is the only engine CI installs. */
    browser: oneOf('BROWSER', 'chromium', ['chromium', 'firefox', 'webkit'] as const),
    /** `undefined` lets Playwright pick a worker count from the local CPU count. */
    workers: process.env.WORKERS ? int('WORKERS', 1) : isCI ? 2 : undefined,
    retries: int('RETRIES', isCI ? 2 : 0, 0),
    tags: process.env.TAGS?.trim() || undefined,
  },
} as const;

if (problems.length > 0) {
  throw new Error(
    `Invalid test environment configuration:\n${problems.join('\n')}\n\n` +
      `See .env.example for every supported variable and its default.`,
  );
}

export const env = parsed;
export type Env = typeof env;
