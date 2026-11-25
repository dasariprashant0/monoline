// Tiny test API: test(name, async (p) => {...}, {timeout, skip}). Tests live in tests/*.test.ts and are
// collected by run.ts. Assertions throw with a message that says what was expected and what the page did.
import type {Page} from './page.ts';

type Opts = {timeout?: number, skip?: boolean};
export const registry: ({name: string, fn: (p: Page) => Promise<void>} & Opts)[] = [];
export const test = (name: string, fn: (p: Page) => Promise<void>, opts: Opts = {}) => { registry.push({name, fn, ...opts}); };

export const assert: (cond: unknown, msg: string) => asserts cond = (cond, msg) => { if (!cond) throw new Error(msg); };
export const eq = (actual: unknown, expected: unknown, msg = 'values differ') => {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`);
};
