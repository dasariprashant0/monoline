#!/usr/bin/env node
// CI helper: point every workspace at one React major so the install has a single React copy.
//   node scripts/lib/use-react.ts 18 && npm install --no-package-lock
// Edits package.json files in place; never commit the result (git checkout -- '**/package.json' undoes it).
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const major = process.argv[2];
if (!/^\d+$/.test(major ?? '')) { console.error('usage: use-react.ts <major>'); process.exit(2); }
const root = new URL('../..', import.meta.url).pathname;
const NAMES = ['react', 'react-dom', '@types/react', '@types/react-dom'];
let changed = 0;
for (const group of ['packages', 'apps']) {
  for (const d of readdirSync(join(root, group))) {
    const file = join(root, group, d, 'package.json');
    if (!existsSync(file)) continue;
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    for (const field of ['dependencies', 'devDependencies']) {
      for (const n of NAMES) if (pkg[field]?.[n]) { pkg[field][n] = `^${major}`; changed++; }
    }
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}
console.log(`pinned ${changed} react dependency entries to ^${major}`);
