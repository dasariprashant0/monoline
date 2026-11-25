// PROTOTYPE (ADR 0014), not part of `npm run tokens`. Generates tokens.css, accents.css and options.css from the DTCG
// source monoline.tokens.json. test/prototype.test.ts compares the output with packages/css/src.
// Run: node packages/tokens/prototype/to-css.ts <out-dir>
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {cssName} from '../scripts/lib.ts';

type Token = {$value: string; $description?: string};
type Meta = {file: string; selector: string; css?: Record<string, string>};
type Doc = Record<string, Record<string, unknown>> & {
  $extensions: {monoline: {headers: Record<string, string>; rules: Record<string, string[]>}};
};

export function toCss(doc: Doc) {
  const {headers, rules} = doc.$extensions.monoline;
  const out: Record<string, string[]> = Object.fromEntries(
    Object.entries(headers).map(([f, h]) => [f, [`/* ${h} */`]]),
  );
  for (const [key, layer] of Object.entries(doc)) {
    if (key.startsWith('$')) continue;
    const {file, selector, css = {}} = (layer.$extensions as {monoline: Meta}).monoline;
    const lines = layer.$description ? [`/* ${layer.$description} */`] : [];
    lines.push(`${selector} {`);
    for (const [group, tokens] of Object.entries(layer)) {
      if (group.startsWith('$')) continue;
      for (const [leaf, t] of Object.entries(tokens as Record<string, Token>)) {
        const value = t.$value.replace(/\{(\w+)\.([\w-]+)\}/g, (_, g: string, l: string) => `var(${cssName(g, l)})`);
        lines.push(`  ${cssName(group, leaf)}: ${value};${t.$description ? ` /* ${t.$description} */` : ''}`);
      }
    }
    for (const [prop, value] of Object.entries(css)) lines.push(`  ${prop}: ${value};`);
    out[file]!.push('', `${lines.join('\n')}\n}`);
  }
  for (const [file, r] of Object.entries(rules)) out[file]!.push('', ...r);
  return Object.fromEntries(Object.entries(out).map(([f, parts]) => [f, `${parts.join('\n')}\n`]));
}

if (import.meta.main) {
  const doc = JSON.parse(readFileSync(join(import.meta.dirname, 'monoline.tokens.json'), 'utf8'));
  const dir = process.argv[2] ?? '.';
  mkdirSync(dir, {recursive: true});
  for (const [file, css] of Object.entries(toCss(doc))) writeFileSync(join(dir, file), css);
  console.log(`prototype: wrote tokens.css, accents.css, options.css to ${dir}`);
}
