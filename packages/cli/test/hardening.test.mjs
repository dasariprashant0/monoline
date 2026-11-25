// The M1 fixes: pinned default registry, identical shared files, name checks, a bad monoline.json,
// update adding new siblings and reporting dropped files, and the registry load-time guard.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {DEFAULT_REGISTRY, run} from '../dist/cli.js';

const registry = resolve(import.meta.dirname, '../../../registry');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tmp = () => mkdtempSync(join(tmpdir(), 'monoline-fix-'));
const exec = async (args, cwd, reg = registry) => {
  const lines = [],
    errs = [];
  const code = await run([...args, '--registry', reg, '--cwd', cwd], {
    out: (s) => lines.push(s),
    err: (s) => errs.push(s),
    confirm: async () => true,
  });
  return {code, out: lines.join('\n'), err: errs.join('\n')};
};
const comp = (cwd, p) => join(cwd, 'src/components/monoline', p);
/** A writable copy of the real registry; `edit(name, fn)` rewrites one entry. */
function registryCopy() {
  const dir = join(tmp(), 'registry');
  cpSync(registry, dir, {recursive: true});
  const edit = (name, fn) => {
    const file = join(dir, `${name}.json`);
    writeFileSync(file, JSON.stringify(fn(JSON.parse(readFileSync(file, 'utf8')))));
  };
  return {dir, edit};
}

test('the default registry is the git tag of this package version, not master', async () => {
  assert.equal(DEFAULT_REGISTRY, `https://raw.githubusercontent.com/dasariprashant0/monoline/v${pkg.version}/registry`);
  const seen = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => (
    seen.push(String(url)),
    new Response(JSON.stringify({name: '@monoline/react', version: pkg.version, components: []}))
  );
  try {
    const code = await run(['list', '--cwd', tmp()], {out: () => {}, err: () => {}});
    assert.equal(code, 0);
  } finally {
    globalThis.fetch = real;
  }
  assert.deepEqual(seen, [`${DEFAULT_REGISTRY}/index.json`]);
});

test('a 404 from the default registry says how to pick another one', async () => {
  const errs = [];
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response('', {status: 404});
  try {
    assert.equal(await run(['list', '--cwd', tmp()], {out: () => {}, err: (s) => errs.push(s)}), 1);
  } finally {
    globalThis.fetch = real;
  }
  assert.match(
    errs.join('\n'),
    new RegExp(
      `index\\.json: 404\\. No registry is tagged v${pkg.version.replace(/\./g, '\\.')} yet: pass --registry <folder\\|url>`,
    ),
  );
});

test('add accepts shared files that are already byte-identical (button, then badge)', async () => {
  const cwd = tmp();
  assert.equal((await exec(['add', 'button'], cwd)).code, 0);
  const r = await exec(['add', 'badge'], cwd);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /same src\/components\/monoline\/utils\/cx\.ts/);
  assert.ok(existsSync(comp(cwd, 'badge/badge.tsx')));
});

test('add still refuses a file that really differs, and names only that file', async () => {
  const cwd = tmp();
  await exec(['add', 'badge'], cwd);
  writeFileSync(comp(cwd, 'badge/badge.tsx'), 'edited\n');
  const r = await exec(['add', 'badge'], cwd);
  assert.equal(r.code, 1);
  assert.match(r.err, /refusing to overwrite:\n  src\/components\/monoline\/badge\/badge\.tsx\nuse --overwrite/);
  assert.doesNotMatch(r.err, /cx\.ts|index\.ts/);
  assert.equal(readFileSync(comp(cwd, 'badge/badge.tsx'), 'utf8'), 'edited\n');
  assert.equal((await exec(['add', 'badge', '--overwrite'], cwd)).code, 0);
  assert.notEqual(readFileSync(comp(cwd, 'badge/badge.tsx'), 'utf8'), 'edited\n');
});

test('component names are checked: a path fails cleanly instead of reading another file', async () => {
  for (const args of [
    ['info', '../package'],
    ['add', '../x'],
    ['diff', 'Button'],
    ['update', 'a/b'],
  ]) {
    const r = await exec(args, tmp());
    assert.equal(r.code, 1, args.join(' '));
    assert.match(r.err, /^monoline: invalid component name "/, args.join(' '));
  }
});

test('a malformed monoline.json is a monoline: error, not a stack trace', async () => {
  for (const body of ['{"components": ', '[]', '{"components": 3}']) {
    const cwd = tmp();
    writeFileSync(join(cwd, 'monoline.json'), body);
    const r = await exec(['list'], cwd);
    assert.equal(r.code, 1, body);
    assert.match(r.err, /^monoline: monoline\.json /, body);
  }
});

test('a registry file that is not a registry entry gives a monoline: error', async () => {
  const reg = registryCopy();
  reg.edit('badge', () => ({name: 'badge'}));
  const r = await exec(['add', 'badge'], tmp(), reg.dir);
  assert.equal(r.code, 1);
  assert.match(r.err, /^monoline: .*badge.*not a Monoline registry entry/);
});

test('update adds a sibling and a util the component newly needs', async () => {
  const cwd = tmp();
  const reg = registryCopy();
  await exec(['add', 'button'], cwd, reg.dir);
  assert.ok(!existsSync(comp(cwd, 'badge')));
  reg.edit('button', (c) => ({
    ...c,
    source: c.source.map((s) =>
      s.path.endsWith('button.tsx') ? {...s, content: `import {Badge} from '../badge';\n${s.content}`} : s,
    ),
    utils: [...c.utils, {path: 'packages/react/src/utils/extra.ts', content: 'export const extra = 1;\n'}],
  }));
  const r = await exec(['update', 'button', '--yes'], cwd, reg.dir);
  assert.equal(r.code, 0, r.err);
  assert.ok(existsSync(comp(cwd, 'badge/badge.tsx')), 'the new sibling is copied');
  assert.ok(existsSync(comp(cwd, 'utils/extra.ts')), 'the new util is copied');
  assert.match(readFileSync(comp(cwd, 'button/button.tsx'), 'utf8'), /from '\.\.\/badge'/);
});

test('update reports files the registry dropped and leaves them in place', async () => {
  const cwd = tmp();
  const reg = registryCopy();
  await exec(['add', 'badge'], cwd, reg.dir);
  reg.edit('badge', (c) => ({...c, source: c.source.filter((s) => !s.path.endsWith('index.ts'))}));
  const r = await exec(['update', 'badge', '--yes'], cwd, reg.dir);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /src\/components\/monoline\/badge\/index\.ts is no longer in the registry; not deleted/);
  assert.ok(existsSync(comp(cwd, 'badge/index.ts')));
});
