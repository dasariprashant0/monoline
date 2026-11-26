// Generates the token CSS and packages/tokens/dist from packages/tokens/src/tokens.ts (ADR 0014).
// Run: npm run tokens (or node packages/tokens/scripts/build.ts).
//   packages/css/src/tokens.css, accents.css, options.css   the CSS the stylesheets load (committed; CI checks it is fresh)
//   dist/tokens.json           W3C design tokens: base, theme.<warm|dark|midnight>, accent.<name>.<theme>, option.<kind>.<value>
//   dist/tokens.css            the same tokens re-exported as CSS custom properties
//   dist/figma-variables.json  Colors, Spacing, Radius, Typography collections with modes (see README)
//   dist/tokens.d.ts           token names and themes as TypeScript unions
//   dist/native.json           React Native values: colours per theme x accent, numbers for the rest (see README)
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTokens, cssFiles, figmaVariables, nativeTokens, sources, tokensCss, typesDts} from './lib.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '../dist');

const src = sources(); // validates first: nothing is written if a reference is bad
for (const [name, css] of Object.entries(cssFiles())) writeFileSync(join(here, '../../css/src', name), css);
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
  `tokens: wrote packages/css/src/{tokens,accents,options}.css, ${Object.keys(files)
    .map((f) => `dist/${f}`)
    .join(', ')}`,
);
