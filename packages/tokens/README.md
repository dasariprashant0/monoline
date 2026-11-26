# @monoline/tokens

Monoline's design tokens in the formats design tools and code read: W3C JSON, Figma variables, CSS, TypeScript types and React Native values. The source of truth is one TypeScript file, [`src/tokens.ts`](src/tokens.ts) ([ADR 0014](../../docs/decisions/0014-token-source-of-truth.md)). It generates these files and also the token CSS the stylesheets load: [`packages/css/src`](../css/src)`/tokens.css`, `accents.css` and `options.css`. Edit `src/tokens.ts`, never the CSS or the output.

```bash
npm run tokens       # regenerate the three CSS files and dist/ (CI fails if either is stale)
npm run test:tokens  # validation, round-trip, staleness and format checks
```

## Adding or changing a token

1. Edit [`src/tokens.ts`](src/tokens.ts). Each CSS file is a list of items in the order they are written out:
   - `{comment}`: a comment on its own line;
   - `{selector, groups}`: a rule block, with an optional `note` above it;
   - `{raw}`: CSS kept as written, such as the `options.css` rules that are not tokens.

   A group is `{note?, tokens}`. A token is `'value'` or `['value', 'note']`. `accents.css` is a table with one row of four colours per preset and theme. Reference another token as plain CSS, `var(--name)`.
2. Run `npm run tokens` and commit `src/tokens.ts`, the three CSS files and `dist/` together.
3. If a reference names a token that is not declared, `npm run typecheck:scripts` fails with the token's name. `npm run tokens` also fails, with the file, block and token, on cycles, duplicates, fallbacks and malformed `var()`. `npm run check` fails on contrast, and also if the CSS differs from what `src/tokens.ts` generates.

The generator owns the CSS layout: one declaration per line, a blank line between groups and between rules, a token's note on the same line, and other notes above. `accents.css` keeps one line per rule.

## Files in `dist/`

| File | What | Use it for |
|---|---|---|
| `tokens.json` | W3C design tokens (`$value`, `$type`). `base` is the `:root` block, `theme.<warm\|dark\|midnight>`, `accent.<name>.<theme>` (8 presets, 4 colours each), `option.font`, `option.radius`, `option.density`. | Token pipelines, Tokens Studio, Style Dictionary, anything that reads DTCG |
| `tokens.css` | The same values as CSS custom properties, in the source's cascade order | Re-export or check; the kit's own `@monoline/css` is the real stylesheet |
| `figma-variables.json` | Four collections: `Colors`, `Spacing`, `Radius`, `Typography` (see below) | Importing into Figma variables |
| `tokens.d.ts` | Unions of theme, accent, density, font and token names, plus `CssVariable` | Typed token names in TypeScript |
| `native.json` | Resolved values for React Native (see below) | `StyleSheet` values in a React Native app |

### Figma collections

| Collection | Modes | Variables |
|---|---|---|
| `Colors` | 24: `<theme> / <accent>` (`warm / orange` … `midnight / slate`) | 28 colours: theme and accent colours, code colours, derived lines and washes (`color/ink-2`, `color/rule` …). Values are `{r, g, b, a}` in 0 to 1; alpha washes are resolved. |
| `Spacing` | 3: `comfortable`, `compact`, `spacious` | `space/s1`–`s9`, `control/sm|md|lg` (control heights), `layout/*` (including `container-*` widths and `bp-*` breakpoints) |
| `Radius` | 3: `square`, `soft`, `round` | `radius/radius`, `radius/sm|md|lg` (derived from `radius`), `radius/round` |
| `Typography` | 9: `<font> / <density>` (`mono`, `sans`, `serif` × density) | `type/*` (including `weight-*` and `leading-*`). Sizes are numbers; font stacks and `clamp()` display sizes are strings. |

Not exported, because Figma has no variable type for them: motion (`--ease`, `--fast`, `--base`, `--slow`), z-index (`--z-*`), the effect group (`--shadow-*`, `--focus-ring`, `--border-width`, `--opacity-disabled`) and the `--hatch` gradient. They are listed in `$skipped`.

The shape is `{$format, $skipped, collections: [{name, modes, variables: [{name, resolvedType, valuesByMode}]}]}`. Modes are named, not given ids. It follows the REST variable model (`resolvedType`, `valuesByMode`), but it is **not** a request body for Figma's REST API.

### React Native (`native.json`)

```ts
import tokens from '@monoline/tokens/native.json'; // resolveJsonModule gives the types
const c = tokens.colors.dark.green;                  // colors.<theme>.<accent>
const styles = {card: {backgroundColor: c.background, borderColor: c.rule, padding: tokens.values.s4}};
```

- `colors.<warm|dark|midnight>.<accent>`: 24 sets of 28 colours (the 8 accents; `orange` is the default look). References and `color-mix()` are resolved, so `ink-2` is `rgba(22, 18, 14, 0.7)` in warm. Opaque colours are `#RRGGBB`, translucent ones `rgba(r, g, b, a)`.
- `values`: every other token for the default options (mono font, square corners, comfortable density). `px`, bare numbers and `calc()` become numbers (`control-sm` is 36); durations become milliseconds (`fast` is 120), for `Animated`; `ease` becomes `[0.76, 0, 0.24, 1]`, for `Easing.bezier(...tokens.values.ease)`. `leading-*` stay multipliers: multiply by the font size for `lineHeight`.
- `$omitted` lists what React Native cannot use, and why: `clamp()` sizes (`heading-*`, `display-*`; they depend on the viewport), the `--hatch` gradient, font stacks (`font-body`, `font-display`; load the font and use its family name), `ch` lengths (`measure`), shadows and the focus ring (React Native has no outline and its own shadow props).
- Not included yet: the font, radius and density options. Add them as `values` overrides when a React Native app needs them.

## Importing into Figma (not verified)

I could not open Figma from this environment, so none of these steps has been run.

1. Figma has no built-in JSON import for variables, as far as I know. You need a plugin or script that reads `figma-variables.json` and creates the collections, modes and values. Pick one you trust; do not paste the file into a third-party service without checking the rules for the source material.
2. Check the mode limit on your Figma plan before importing. `Colors` needs 24 modes, `Typography` 9. If the plan allows fewer, import per theme, or drop the accent modes you do not need.
3. Check `$skipped` and the string variables after import. Those are the parts that will not match Figma's own types.
4. For Tokens Studio, try importing `tokens.json` as a W3C file. The top-level keys (`base`, `theme`, `accent`, `option`) become token sets. I have not tested this import; the file uses the DTCG `$value` and `$type` keys, but the theme and accent layout may need remapping in Tokens Studio.

## How it is checked

`test/tokens.test.ts` runs with `node:test` and checks that:

- the three CSS files in `packages/css/src` are exactly what `src/tokens.ts` generates (the staleness check), and they parse back with a plain CSS reader to the same blocks and declarations as the source (the round trip);
- every custom property in `tokens.css`, `accents.css` and `options.css` is in `tokens.json` with the same value;
- `tokens.css` re-export parses back to the same values as the JSON, and `dist/tokens.css` is what the build writes;
- Figma colours match a hand calculation (for example `color/ink-2` on warm is the foreground at 70% alpha), and `control/sm` is 36px in comfortable density;
- `tokens.d.ts` lists the token names;
- `native.json` has 24 colour sets and numbers, and lists every token it leaves out.

`test/validate.test.ts` checks validation of the source, one case per class. The build stops and names the file, block and token. The fixtures are small models in the shape of `src/tokens.ts`.

- a reference to an undefined token (in every theme x accent x option combination);
- a cycle, also one that only closes when a theme or accent layer applies;
- the same token twice in one layer: in two groups, or in two blocks of the same layer, such as `:root` and `:root, [data-theme]`. A theme or accent overriding a base token is the cascade, not a duplicate. Within one group, TypeScript already refuses a repeated key;
- `var(` that is malformed, names something other than a custom property, or has a fallback. Fallbacks are refused: the token set is closed, so a fallback is dead code or hides a missing token;
- a selector list of `:root` and bare attributes (`:root, [data-theme], [data-accent]`) is the base layer; any other selector is refused;
- the contrast rules (`contrastChecks`, run by `npm run check` in `packages/css`) pass on the real tokens and fail on a broken theme colour, accent pair and more-contrast mix.

Every output reads the model in `src/tokens.ts` through `sources()` in `scripts/lib.ts`: these files, `@monoline/css/dist/tokens.json` (`packages/css/scripts/build.ts`) and the contrast check (`check.ts`). Nothing parses the token CSS to build anything. A misspelt `var(--name)` is caught by the type-level check at the end of `src/tokens.ts`.

CI runs `npm run tokens` and then `git diff --exit-code` on `dist/` and the three CSS files, so a stale output fails.

## Notes

- The source has **8 accent presets** (orange, green, blue, violet, rose, teal, amber, slate). Orange is the default in `tokens.css`. The output has 8 too.
- Package is `private`; it is not published to npm.
