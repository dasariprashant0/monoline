// Registry access: a local folder or an https base URL, cached in memory. Fetching is injectable.
import {existsSync, readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {asEntry, asIndex, NAME, type RegistryEntry, type RegistryIndex} from './schema.js';

const VERSION: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
/** The registry as it was when this version was released: the release workflow tags every published version v<x.y.z>. */
export const DEFAULT_URL = `https://raw.githubusercontent.com/dasariprashant0/monoline/v${VERSION}/registry`;

export const isUrl = (s: string): boolean => /^https?:\/\//.test(s);

/** What `fetch` needs to return here; the global fetch's Response fits. */
export type Fetch = (
  url: string,
) => Promise<{ok: boolean; status: number; statusText?: string; text(): Promise<string>}>;

export interface ResolveOptions {
  flag?: string | undefined;
  env?: Record<string, string | undefined>;
  cwd?: string;
  pkgDir?: string | undefined;
}

/** Pick the registry location: flag, env, ./registry, the repo this package lives in, else GitHub. `from` says which. */
export function resolveRegistry({flag, env = process.env, cwd = process.cwd(), pkgDir}: ResolveOptions = {}): {
  location: string;
  from: 'flag' | 'env' | 'cwd' | 'repo' | 'default';
} {
  if (flag) return {location: flag, from: 'flag'};
  const fromEnv = env['MONOLINE_REGISTRY'];
  if (fromEnv) return {location: fromEnv, from: 'env'};
  const here = join(cwd, 'registry');
  if (existsSync(join(here, 'index.json'))) return {location: here, from: 'cwd'};
  const repo = pkgDir && join(pkgDir, '..', '..', '..', 'registry');
  if (repo && existsSync(join(repo, 'index.json'))) return {location: repo, from: 'repo'};
  return {location: DEFAULT_URL, from: 'default'};
}

export interface Registry {
  location: string;
  index(): Promise<RegistryIndex>;
  component(name: unknown): Promise<RegistryEntry>;
  llms(): Promise<string>;
}

export function createRegistry({
  location,
  fetch: doFetch = globalThis.fetch,
}: {
  location: string;
  fetch?: Fetch | undefined;
}): Registry {
  const remote = isUrl(location);
  const base = remote ? location.replace(/\/$/, '') : resolve(location);
  const cache = new Map<string, string>();

  async function getText(key: string, rel: string): Promise<string> {
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let text;
    if (remote) {
      const url = new URL(rel, `${base}/`).href; // normalises "../llms.txt"
      const res = await doFetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText ?? ''}`.trim());
      text = await res.text();
    } else {
      text = await readFile(join(base, rel), 'utf8');
    }
    cache.set(key, text);
    return text;
  }

  return {
    location: base,
    async index() {
      return asIndex(JSON.parse(await getText('index', 'index.json')), 'index.json');
    },
    async component(name) {
      if (typeof name !== 'string' || !NAME.test(name)) throw new Error(`invalid component name "${String(name)}"`);
      let json: unknown;
      try {
        json = JSON.parse(await getText(`c:${name}`, `${name}.json`));
      } catch (e) {
        throw new Error(`unknown component "${name}" (${e instanceof Error ? e.message : String(e)})`);
      }
      return asEntry(json, `${name}.json`);
    },
    async llms() {
      // llms.txt sits next to the registry folder in the repo.
      return getText('llms', '../llms.txt');
    },
  };
}
