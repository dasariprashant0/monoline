# @monoline/tokens

Monoline's design tokens in the formats design tools and code read: W3C JSON, Figma variables, CSS, TypeScript types and React Native values. All of it is generated from [`packages/css/src`](../css/src) (`tokens.css`, `accents.css`, `options.css`). Edit the CSS, never the output.

```bash
npm run tokens       # regenerate dist/ (CI fails if dist/ is stale)
npm run test:tokens  # round-trip and figma checks
```

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

- every custom property in `tokens.css`, `accents.css` and `options.css` is in `tokens.json` with the same value;
- `tokens.css` re-export parses back to the same values as the JSON, and `dist/tokens.css` is what the build writes;
- Figma colours match a hand calculation (for example `color/ink-2` on warm is the foreground at 70% alpha), and `control/sm` is 36px in comfortable density;
- `tokens.d.ts` lists the token names;
- a reference to an undefined token fails the build;
- `native.json` has 24 colour sets and numbers, and lists every token it leaves out.

`test/validate.test.ts` checks the parser's validation, one case per class (the build stops with the file, block and token):

- a reference to an undefined token (in every theme x accent x option combination);
- a cycle, also one that only closes when a theme or accent layer applies;
- the same token twice in one layer (one block, or two blocks with the same selector). A theme or accent overriding a base token is the cascade, not a duplicate;
- `var(` that is malformed, names something other than a custom property, or has a fallback. Fallbacks are refused: the token set is closed, so a fallback is dead code or hides a missing token;
- a selector list of `:root` and bare attributes (`:root, [data-theme], [data-accent]`) is the base layer; any other selector is refused;
- the contrast rules (`contrastChecks`, run by `npm run check` in `packages/css`) pass on the real tokens and fail on a broken theme colour, accent pair and more-contrast mix.

The same parser builds `@monoline/css/dist/tokens.json` and runs the contrast check (`packages/css/scripts/build.ts`, `check.ts`), so there is one reader of the token CSS.

CI runs the build and then `git diff --exit-code packages/tokens/dist`, so a stale output fails the check.

## Prototype: DTCG JSON as the source (not used by the build)

`prototype/` holds the evidence for [ADR 0014](../../docs/decisions/0014-token-source-of-truth.md): `monoline.tokens.json` (the token CSS converted once to DTCG by `from-css.ts`) and `to-css.ts`, which generates the three CSS files from it. `test/prototype.test.ts` checks that the generated CSS has the same tokens, selectors and rules and prints the text diff. `npm run tokens` does not read it. If the CSS changes before the ADR is decided, rerun `node packages/tokens/prototype/from-css.ts`.

## Notes

- The source has **8 accent presets** (orange, green, blue, violet, rose, teal, amber, slate). Orange is the default in `tokens.css`. The output has 8 too.
- Package is `private`; it is not published to npm.
