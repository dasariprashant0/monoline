// The registry JSON that packages/react/scripts/gen-registry.mjs writes, as types, plus a load-time guard.
// The same file is in packages/cli/src and packages/mcp/src (a test keeps them identical): neither package
// may depend on the other at runtime.

/** Component and file names: lowercase words joined by hyphens. Nothing that can climb out of a folder. */
export const NAME = /^[a-z0-9][a-z0-9-]*$/;

export interface FileContent {
  path: string;
  content: string;
}

export interface Prop {
  name: string;
  type: string;
  optional: boolean;
  default: string | null;
  description: string;
}

export interface PropGroup {
  name: string;
  props: Prop[];
}

/** Fields that index.json and the per-component files share. */
interface EntryBase {
  name: string;
  title: string;
  category: string;
  description: string;
  status: string;
  kind: 'components' | 'hooks';
  import: string;
  path: string;
  files: string[];
  a11y: string[];
  keywords: string[];
  related: string[];
  primitive?: string;
  /** Components this one imports; only set when there are some. */
  uses?: string[];
}

/** One row of registry/index.json: `css` is file names, props are reduced to their names. */
export interface IndexEntry extends EntryBase {
  css: string[];
  /** Missing from hand-made registries (forks, test fixtures). */
  propNames?: string[];
}

export interface RegistryIndex {
  name: string;
  version: string;
  components: IndexEntry[];
}

/**
 * registry/<name>.json. Older registries lack some fields (0.3.0 has no utils; earlier ones no props, usage,
 * classes or dataAttributes), so readers treat those as possibly missing.
 */
export interface RegistryEntry extends EntryBase {
  css: FileContent[];
  source: FileContent[];
  utils?: FileContent[];
  dependencies: Record<string, string>;
  props?: PropGroup[];
  usage?: string;
  classes?: string[];
  dataAttributes?: Array<{name: string; values: string[]}>;
}

type Check = (v: unknown) => boolean;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const string: Check = (v) => typeof v === 'string';
const strings: Check = (v) => Array.isArray(v) && v.every(string);
const files: Check = (v) => Array.isArray(v) && v.every((f) => isObject(f) && string(f['path']) && string(f['content']));
const optional = (ok: Check): Check => (v) => v === undefined || ok(v);

// Only the fields the CLI and MCP read are checked; the rest is trusted to match the types.
const COMMON: Record<string, Check> = {name: (v) => string(v) && NAME.test(v as string), title: string, category: string, description: string, status: string};
const ENTRY = {...COMMON, source: files, css: files, utils: optional(files), uses: optional(strings), a11y: optional(strings)};
const ROW = {...COMMON, keywords: optional(strings), uses: optional(strings), propNames: optional(strings)};

/** The first field that fails its check, or null. */
function problem(v: unknown, fields: Record<string, Check>): string | null {
  if (!isObject(v)) return 'not an object';
  const bad = Object.keys(fields).find((k) => !fields[k]?.(v[k]));
  return bad ? `"${bad}" is missing or has the wrong shape` : null;
}

/** Throws `<where>: not a Monoline registry entry (...)` unless `v` looks like registry/<name>.json. */
export function asEntry(v: unknown, where: string): RegistryEntry {
  const p = problem(v, ENTRY);
  if (p) throw new Error(`${where}: not a Monoline registry entry (${p})`);
  return v as RegistryEntry;
}

/** Throws `<where>: not a Monoline registry index (...)` unless `v` looks like registry/index.json. */
export function asIndex(v: unknown, where: string): RegistryIndex {
  const rows = isObject(v) && Array.isArray(v['components']) ? v['components'] : null;
  const p = rows ? rows.map((r) => problem(r, ROW)).find(Boolean) : 'no components list';
  if (p) throw new Error(`${where}: not a Monoline registry index (${p})`);
  return v as RegistryIndex;
}
