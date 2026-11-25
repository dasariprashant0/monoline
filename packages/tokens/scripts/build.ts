// Generates packages/tokens/dist from packages/css/src. Run: npm run tokens (or node packages/tokens/scripts/build.ts).
//   dist/tokens.json           W3C design tokens: base, theme.<warm|dark|midnight>, accent.<name>.<theme>, option.<kind>.<value>
//   dist/tokens.css            the same tokens re-exported as CSS custom properties
//   dist/figma-variables.json  Colors, Spacing, Radius, Typography collections with modes (see README)
//   dist/tokens.d.ts           token names and themes as TypeScript unions
//   dist/native.json           React Native values: colours per theme x accent, numbers for the rest (see README)
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTokens, figmaVariables, nativeTokens, parseSources, tokensCss, typesDts} from './lib.ts';

const here = dirname(fileURLToPath(import.meta.url));
const source = (file: string) => readFileSync(join(here, '../../css/src', file), 'utf8');
const dist = join(here, '../dist');

const src = parseSources({
  tokens: source('tokens.css'),
  accents: source('accents.css'),
  options: source('options.css'),
});
const json = buildTokens(src);
const files = {
  'tokens.json': JSON.stringify(json, null, 2) + '\n',
  'tokens.css': tokensCss(json) + '\n',
  'figma-variables.json': JSON.stringify(figmaVariables(src), null, 2) + '\n',
  'tokens.d.ts': typesDts(json),
  'native.json': JSON.stringify(nativeTokens(src), null, 2) + '\n',
};
mkdirSync(dist, {recursive: true});
for (const [name, text] of Object.entries(files)) writeFileSync(join(dist, name), text);
console.log(
  `tokens: wrote ${Object.keys(files)
    .map((f) => `dist/${f}`)
    .join(', ')}`,
);
