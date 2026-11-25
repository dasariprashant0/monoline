// Writes src/page/demos.generated.json: for every component and hook, {importName, parts, dependencies, demos}.
//  - demos: each demo of <name>.demo.tsx as {title, description?, code} where `code` is that demo's own standalone snippet.
//  - dependencies: npm packages the source needs (read from registry/<name>.json, which lists radix-ui only when the copied files import it).
//  - parts: the value exports of the folder's index.ts (the compound parts), importName: the main export.
// A new component needs no change here: discovery is by folder.
import {readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {discover, docsRoot, repo} from './lib/load.ts';
import {extractDemos, exportedNames, type Demo} from './lib/demos.ts';

const pascal = (n: string) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const result: Record<string, {importName: string; parts: string[]; dependencies: string[]; demos: Demo[]}> = {};
let demoCount = 0;
for (const {meta, dir, kind} of discover()) {
  const indexFile = join(dir, 'index.ts');
  const {values} = existsSync(indexFile) ? exportedNames(readFileSync(indexFile, 'utf8')) : {values: [] as string[]};
  const want = kind === 'hooks' ? meta.title : pascal(meta.name);
  const importName = values.includes(want) ? want : values[0] ?? want;
  const demoFile = readdirSync(dir).find((f) => f.endsWith('.demo.tsx'));
  let demos: Demo[] = [];
  if (demoFile) {
    try { demos = extractDemos(readFileSync(join(dir, demoFile), 'utf8'), demoFile); }
    catch (e) { console.warn(`demos: ${meta.name}: ${(e as Error).message}`); }
  }
  demoCount += demos.length;
  const regFile = join(repo, 'registry', `${meta.name}.json`);
  const dependencies = existsSync(regFile) ? Object.keys(JSON.parse(readFileSync(regFile, 'utf8')).dependencies ?? {}) : [];
  result[meta.name] = {importName, parts: values, dependencies, demos};
}
const out = join(docsRoot, 'src/page/demos.generated.json');
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log(`demos: ${demoCount} snippets for ${Object.keys(result).length} components and hooks`);
