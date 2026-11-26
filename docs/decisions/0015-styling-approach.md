# 0015: Keep plain CSS and custom properties for component styles

Status: proposed (M2). Date: 2026-11-26.

## Context

- Monoline styles 136 React components with plain CSS: 130 unlayered source files in `packages/css/src`, flat unprefixed classes (`.btn .btn-solid`), state on `data-*` attributes, tokens as custom properties, cascade layers added at build ([ADR 0003](0003-css-cascade-layers.md)). The same CSS serves React, CSS-only users and the `npx monoline add` registry copy.
- M2 asks to re-test that choice with a PoC in a separate consumer app, comparing plain CSS, CSS Modules and a zero-runtime typed option, on consumer customisation, SSR/RSC, bundle and CSS output, React Native reach, agent usability and migration cost ([MISSION.md](../MISSION.md) M2).
- The PoC, [`examples/styling-poc`](../../examples/styling-poc), builds Button, Alert, Tabs and Dialog four ways with one shared behaviour implementation, so only styling differs. Every number below is in [docs/audit/m2-styling-poc.md](../audit/m2-styling-poc.md) with the command that produced it.

## Options considered

### A. Plain CSS + custom properties (today)

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6: `className`, `--btn-bg` and `--accent` on a wrapper, `[data-variant]`, `[data-state]` |
| SSR / RSC | Nothing needed; no runtime |
| Output | 70.00 KB JS gzip for the page; own CSS 1.11 KB gzip, 20 readable classes |
| Build cost | No tool, no package |
| Agent usability | One CSS rule per variant; a missing variant is not caught by `tsc` |
| Migration | None |

**Pros:** the CSS is the public API: readable classes, works without React or a bundler, copied as is by the CLI. Smallest JS. Subtree themes and wrapper overrides work because components read the live variables.
**Cons:** no compile-time link between a prop's union and its CSS rule; specificity is the author's job (cascade layers cover consumers).

### B. CSS Modules

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6 (with a hand-written `@layer`) |
| SSR / RSC | Needs a bundler that compiles modules on the server; no runtime |
| Output | +0.25 KB JS (class maps); own CSS 1.18 KB gzip |
| Build cost | Built into Vite, Next, webpack |
| Agent usability | One rule per variant; keys are untyped (`string \| undefined`), a typo is `undefined` |
| Migration | 1 to 2 weeks; every public class name becomes a hash |

**Pros:** local names, no collisions with app classes (the audit's `.muted`, `.prose` concern).
**Cons:** loses the stable class names that CSS-only users and consumer selectors rely on; the registry and CLI would need a bundler on the consumer side; no type safety gained.

### C. Vanilla Extract

| Dimension | Assessment |
|---|---|
| Consumer overrides | 6/6 (with `globalLayer` wrapped around every rule) |
| SSR / RSC | Needs its bundler plugin on the server (`style()` throws outside it); recipe runtime is a pure function |
| Output | +0.79 KB JS; own CSS 1.09 KB gzip, 28 hashed classes |
| Build cost | 3 packages, 41 installed (26.2 MB); a token contract to keep in step with `tokens.css` |
| Agent usability | A missing variant fails `tsc`; 3.4× the source lines; selectors must target `&`, so 247 combinator rules would be restructured |
| Migration | 3 to 4 weeks, breaking (hashed names, CSS package built from TS) |

**Pros:** typed variants and tokens; a global contract can name the existing variables, so themes keep working everywhere.
**Cons:** a compiler in every consumer's or Monoline's build; hashed names; more to learn and write per component.

### D. Panda CSS

| Dimension | Assessment |
|---|---|
| Consumer overrides | 5/6: `--accent` set on a wrapper does not reach components |
| SSR / RSC | Needs `panda codegen`; generated runtime is plain JS |
| Output | +7.55 KB JS (recipe runtime about 3.9 KB, `css()` about 3.7 KB); own CSS 1.62 KB gzip |
| Build cost | 2 packages, 44 installed (34.3 MB, native compiler); 42-line config, PostCSS, codegen before build and typecheck |
| Agent usability | A missing variant fails `tsc`; three defaults (no preset, static extraction, token copies on `:root`) leave styles missing or wrong without failing the build |
| Migration | 3 to 4 weeks, breaking unless Monoline ships Panda's generated CSS |

**Pros:** typed recipes and slot recipes; readable class names (`button--variant_solid`).
**Cons:** tokens are copies resolved where declared, which breaks subtree themes unless `cssVarRoot` lists `[data-theme], [data-accent]` and still breaks wrapper overrides; the most JS and setup of the four.

## Trade-off analysis

The only criterion where a candidate beats plain CSS is the compile-time check on variants (VE, Panda). It costs a compiler, 41 to 44 packages, hashed or tool-specific class names, a 3- to 4-week breaking migration, and for Panda a failed override and 7.5 KB of JS. React Native reach is equal for all four: what RN can use is token values, which none of the typed options holds in the PoC; that is the tokens work (ADR 0014). SSR and RSC do not separate them: none needs a client runtime, and plain CSS needs nothing at all. CSS Modules would solve the class-collision concern from the audit but break the stable class names that are Monoline's CSS API.

The variant check can be had without changing the styling approach: a test that every value of a component's variant unions has a matching selector in its stylesheet.

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

- Nothing changes for consumers, the CLI, the registry or CSS-only users.
- A variant added to a prop union without CSS still passes `tsc`. Close that with a check (action 1) rather than a new styling tool.
- The class-collision risk for generic names (`.muted`, `.display`, `.prose`) from the audit stays; it is a naming question, not a reason to hash every class.
- Subtree themes do not re-derive `--wash` and other tokens computed on `:root` in any approach; that belongs to scoped theming (ADR 0012).
- Revisit if Monoline drops CSS-only users and the registry copy, or if a zero-runtime tool appears that reads existing custom properties without copies and ships readable class names with no consumer-side compiler.
- `examples/styling-poc` stays as the evidence and a place to re-run the comparison (`npm run measure`, `ssr`, `browser`); it is not maintained with the kit.

## Action items

1. [ ] Add a check to `npm run check`: for each component, every value of its `variant`, `size` and `tone` unions has a selector in its CSS file (lead to schedule, owner TBD).
2. [ ] Add the row for 0015 to `docs/decisions/README.md` and `examples/styling-poc` to `examples/README.md` (lead).
