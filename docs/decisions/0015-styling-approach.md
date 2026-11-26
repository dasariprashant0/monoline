# 0015: Keep plain CSS and custom properties for component styles

Status: proposed (M2). Date: 2026-11-26, revised after review the same day.

## Context

- Monoline styles 136 React components with plain CSS: 130 unlayered source files in `packages/css/src`, flat unprefixed classes (`.btn .btn-solid`), state on `data-*` attributes, tokens as custom properties, cascade layers added at build ([ADR 0003](0003-css-cascade-layers.md)). The same CSS serves React, CSS-only users and the `npx monoline add` registry copy, and `options.css` restyles components by class name (`[data-radius="round"] .btn`).
- M2 asks to re-test that choice with a PoC in a separate consumer app, comparing plain CSS, CSS Modules and a zero-runtime typed option, on consumer customisation, SSR/RSC, bundle and CSS output, React Native reach, agent usability and migration cost ([MISSION.md](../MISSION.md) M2).
- The PoC, [`examples/styling-poc`](../../examples/styling-poc), builds Button, Alert, Tabs and Dialog four ways with one shared behaviour implementation, so only styling differs. Every number below is in [docs/audit/m2-styling-poc.md](../audit/m2-styling-poc.md) with the command that produced it. RSC was not built in Next; every RSC statement here is `unverified`.

## Options considered

### A. Plain CSS + custom properties (today)

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6: `className`, `--btn-bg` and `--accent` on a wrapper, `[data-variant]`, `[data-state]` |
| Theme, density, radius subtrees | all pass, including `options.css` radius |
| SSR / RSC | SSR needs nothing; no runtime (RSC `unverified: not built in Next`) |
| Output | 70.05 KB JS gzip for the page; own CSS 1.11 KB gzip, 20 readable classes |
| Build cost | No tool, no package |
| Agent usability | One CSS rule per variant; a missing variant is not caught by `tsc`, but a small script catches it (prototyped) |
| Migration | None |

**Pros:** the CSS is the public API: readable classes, works without React or a bundler, copied as is by the CLI, targetable by `options.css` and by consumers.
**Cons:** no compile-time link between a prop's union and its CSS rule without the extra check; generic names can collide with app classes; specificity is the author's job (cascade layers cover consumers).

### B. CSS Modules

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6 (with a hand-written `@layer`) |
| Theme, density, radius subtrees | theme and density pass; `options.css` radius fails (no `.btn`) |
| SSR / RSC | Needs a bundler that compiles modules on the server; no runtime (RSC `unverified`) |
| Output | +0.27 KB JS (class maps); own CSS 1.18 KB gzip |
| Build cost | Built into Vite, Next, webpack; Monoline's CSS build and registry would have to compile modules |
| Agent usability | One rule per variant; keys untyped (`string \| undefined`), a typo is `undefined` |
| Migration | 1,190 rules at 1.1× the lines, plus `styles.x` lookups in 136 components (`unverified`) |

**Pros:** local names, no collisions with app classes.
**Cons:** names are hashed by default; with `generateScopedName: '[local]'` they are stable but isolation is gone (alert `.title` and dialog `.title` merged in the PoC). No type safety gained.

### C. Vanilla Extract

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6 (with `globalLayer` wrapped around every rule) |
| Theme, density, radius subtrees | theme and density pass; `options.css` radius fails |
| SSR / RSC | Needs its bundler plugin on the server (`style()` throws outside it); recipe runtime is a pure function (RSC `unverified`) |
| Output | +0.80 KB JS; own CSS 1.09 KB gzip, 28 classes |
| Build cost | 3 packages, 41 installed (26.2 MB); a token contract to keep in step with `tokens.css` |
| Agent usability | A missing variant fails `tsc`; selectors must target `&`, so 247 combinator rules would move onto the child |
| Migration | 1,190 rules at 4.6× the lines (`unverified`) |

**Pros:** typed variants; a global contract can name the existing variables, so themes keep working everywhere.
**Cons:** a compile step in Monoline's CSS build; the CLI would copy `.css.ts` or generated CSS. Names are hashed by default; stable names via `identifiers` need a unique debug id on every style (the PoC got `.ml-undefined` and shared `.ml-tone_ok`).

### D. Panda CSS

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6 with recipes on raw `var(--accent)`; 5/6 with Panda tokens |
| Theme, density, radius subtrees | pass with raw `var()` (radius from `options.css` fails); with Panda tokens, density and `--accent` on a wrapper fail |
| SSR / RSC | Needs `panda codegen`; with typed class strings no Panda code ships (RSC `unverified`) |
| Output | 70.09 KB JS (+0.04) with typed class strings; 77.55 KB (+7.55) when calling recipe functions and `css()`; own CSS 1.27 KB gzip |
| Build cost | 2 packages, 44 installed (34.3 MB, native compiler); config, PostCSS, codegen before build and typecheck |
| Agent usability | A missing variant fails `tsc`; three defaults (no preset, static extraction, token copies) leave styles missing or wrong without failing the build |
| Migration | 1,190 rules at 3.7× the lines (`unverified`) |

**Pros:** typed recipes and slot recipes; readable class names (`button--variant_solid`).
**Cons:** to match plain CSS it has to give up its own tokens (copies resolved where declared) and its runtime (class strings instead of recipe functions), leaving a compiler that turns objects into the CSS plain CSS already is.

## Trade-off analysis

Once each tool is configured carefully, output and overrides are a tie: within 0.8 KB of JS and 0.2 KB of CSS gzip, 6/6 overrides each. The one capability the typed tools add is a compile-time check that each variant value has styles, and the prototype `scripts/variant-check.ts` gives plain CSS the same check with no dependency. Against that, every alternative costs a compile step in Monoline's CSS build, changes what `npx monoline add` copies (`.module.css`, `.css.ts` or generated CSS instead of the source file), breaks `options.css` and any consumer selector that targets `.btn` (measured: the radius subtree), and needs 1.1× to 4.6× the style source for 1,190 rules. Hashing is a default, not a requirement, but the stable-name settings either remove isolation (CSS Modules) or need a naming discipline on every style (VE). React Native reach does not separate them: it comes from token values, which none of the four styling layers holds.

## Decision

Keep plain CSS and custom properties, with cascade layers added at build (ADR 0003). No change to `packages/css` or `packages/react` follows from this ADR.

Dependencies, used only in `examples/styling-poc/package.json` (not a workspace, not in CI or the gate), pinned exactly so the measurements reproduce:

| Package | Version | Reason |
|---|---|---|
| `vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom` | 7.3.8, 5.2.0, 19.3.1, 19.3.1, 5.9.3, 19.3.0, 19.3.0 | The app shell; the versions the repo already installs, so sizes compare with the other examples |
| `@vanilla-extract/css` | 1.21.3 | Option C: `style`, `styleVariants`, `globalLayer`, the theme contract |
| `@vanilla-extract/recipes` | 0.5.7 | Option C: `recipe()` for multi-variant components, as asked |
| `@vanilla-extract/vite-plugin` | 5.2.6 | Option C: compiles `.css.ts` in client and SSR builds |
| `@pandacss/dev` | 2.6.0 | Option D: config, codegen, PostCSS plugin |
| `@pandacss/preset-base` | 2.6.0 | Option D: Panda 2 ships no conditions (`_hover`) or shorthands (`px`) without it |

## Consequences

- Nothing changes for consumers, the CLI, the registry, `options.css` or CSS-only users.
- A variant added to a prop union without CSS still passes `tsc` until the variant check exists in `npm run check` (action 1).
- The class-collision risk for generic names (`.muted`, `.display`, `.prose`) from the audit stays; it is a naming question, not a reason to hash every class.
- React Native reach comes from the tokens, not from this decision: the M2 tokens work (ADR 0014, pending) authors tokens in a TypeScript source that generates the CSS, and the same source can emit RN values.
- Revisit if Monoline drops CSS-only users and the registry copy, or if a zero-runtime tool appears that reads existing custom properties without copies and ships readable class names with no compile step for consumers.
- `examples/styling-poc` stays as the evidence and a place to re-run the comparison (`npm run measure`, `ssr`, `browser`, `variant-check`); it is not maintained with the kit.

## Action items

1. [ ] M3: a variant check in `npm run check` for every component, from the prototype `examples/styling-poc/scripts/variant-check.ts`: each value of a component's `variant`, `size` and `tone` unions (except its default) has a modifier class or `[data-*]` selector in its stylesheet. It will need the unions from the component types rather than a regex, and the prop-to-class mapping from `meta.json` or a convention.
2. [ ] Add the row for 0015 to `docs/decisions/README.md` and `examples/styling-poc` to `examples/README.md` (lead).
