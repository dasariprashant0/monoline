# M2 styling PoC: plain CSS, CSS Modules, Vanilla Extract, Panda CSS

Date: 2026-11-26. App: [`examples/styling-poc`](../../examples/styling-poc). Decision: [ADR 0015](../decisions/0015-styling-approach.md).

M2 asks to re-test the plain-CSS decision ([MISSION.md](../MISSION.md) M2) on six criteria: consumer customisation, SSR/RSC, bundle and CSS output, React Native reach, agent usability and migration cost. The PoC builds the same four components four ways and measures each.

## Result

Plain CSS + custom properties meets every criterion at least as well as the other three, with no build step, no added packages and the smallest JavaScript. The typed options win on one point only: a missing variant fails `tsc`. Panda failed one override check, and three of its defaults leave styles missing or wrong in a component library without any error.

| Criterion | Plain CSS (today) | CSS Modules | Vanilla Extract | Panda CSS |
|---|---|---|---|---|
| Overrides: `className`, CSS variable, `data-*` (6 checks) | 6/6 | 6/6 | 6/6 | 5/6 (`--accent` on a wrapper fails) |
| Theme on `<html>` and on a subtree | pass | pass | pass | pass only with `cssVarRoot` set |
| SSR (`renderToString`, classes equal client) | pass, needs nothing | pass, needs a bundler that compiles modules | pass, needs the VE bundler plugin | pass, needs codegen; runtime is plain JS |
| RSC (judged, `unverified`: not built in Next) | no runtime | no runtime | small pure runtime (recipes) | pure runtime functions |
| JS gzip, page (delta vs plain) | 70.00 KB | 70.25 KB (+0.25) | 70.79 KB (+0.79) | 77.55 KB (+7.55) |
| Own CSS gzip (raw) | 1.11 KB (3.50) | 1.18 KB (3.82) | 1.09 KB (3.52) | 1.62 KB (5.68) |
| Style rules / class names in own CSS | 36 / 20 | 36 / 20 | 36 / 28 | 43 / 33 |
| Stable, readable class names consumers can target | yes (`.btn-solid`) | no (hashed) | no (hashed) | yes (`.button--variant_solid`) |
| Packages added to the install | 0 | 0 | 41 (26.2 MB) | 44 (34.3 MB, native compiler) |
| Config | none | none (Vite built in) | 2 lines in `vite.config.ts` + a 24-line token contract | 42-line `panda.config.ts`, PostCSS config, CSS entry, `codegen` before every build and typecheck |
| React Native reach | tokens only | tokens only | nothing (contract has names, no values) | nothing (tokens are `var()` references) |
| Add `tone="neutral"`: files / lines | 1 / 1 | 1 / 1 | 1 / 2 | 1 / 1 + codegen |
| Missing variant caught by `tsc` | no | no | yes | yes |
| Migration of 130 CSS files / 1,190 rules (estimate) | 0 | 1 to 2 weeks, breaking | 3 to 4 weeks, breaking | 3 to 4 weeks, breaking |

## Method

One behaviour implementation, four styling layers. [`src/kit.tsx`](../../examples/styling-poc/src/kit.tsx) has Button (solid, outline, ghost; sm, md, lg; disabled; loading), Alert (four tones, then five; title, description, icon slot), Tabs (roving arrow-key focus, automatic activation, `data-state`) and Dialog (native `<dialog>`, Escape, focus return). An approach supplies only a `Styles` object of class names through `StylesProvider`, so markup, ARIA, keyboard handling and `data-*` attributes are identical. [`src/demo.tsx`](../../examples/styling-poc/src/demo.tsx) is the same page for every approach: the components, a subtree with `data-theme="midnight" data-accent="blue"`, and the overrides.

All four read Monoline's tokens from `packages/css/dist/core.css` and copy the look of `packages/css/src/components/{02-buttons,alert,tabs,dialog}.css`. Each is wrapped in a cascade layer, as `dist/` is today ([ADR 0003](../decisions/0003-css-cascade-layers.md)): `@layer monoline.components` by hand in plain CSS and CSS Modules, `globalLayer('monoline.components')` in Vanilla Extract, Panda's own `recipes` and `utilities` layers in Panda. App CSS ([`src/app.css`](../../examples/styling-poc/src/app.css)) is unlayered and imported last.

| Approach | Files |
|---|---|
| Plain CSS | `src/plain/styles.css`, `styles.ts` (class strings) |
| CSS Modules | `src/modules/{button,alert,tabs,dialog}.module.css`, `styles.ts` |
| Vanilla Extract | `src/ve/theme.css.ts` (`createGlobalThemeContract` naming the existing variables), `{button,alert}.css.ts` (`recipe`, `styleVariants`), `{tabs,dialog}.css.ts` (`style`), `styles.ts` |
| Panda CSS | `panda.config.ts` (tokens as `var(--x)`, `@pandacss/preset-base`), `src/panda/recipes.ts` (`defineRecipe`, `defineSlotRecipe`), `styles.ts`, `panda.css`, `postcss.config.js` |

Pages: `plain.html`, `modules.html`, `ve.html`, `panda.html` (one approach each, for measuring) and `index.html` (all four side by side). Versions: Vite 7.3.8, React 19.3.1, TypeScript 5.9.3 (the repo's own), Vanilla Extract css 1.21.3 / recipes 0.5.7 / vite-plugin 5.2.6, Panda 2.6.0. Node 26.10.0, darwin arm64.

Commands (from `examples/styling-poc`, after `npm run build -w @monoline/css` at the root):

```bash
npm install --cache "$TMPDIR/npm-cache"
npm run typecheck      # panda codegen, tsc for src and for scripts
npm run build          # panda codegen, vite build of all five pages
npm run browser        # Chrome: theme, overrides, keyboard, screenshots (outside the agent sandbox)
npm run ssr            # Vite SSR build, renderToString, compare classes with the browser's
npm run measure        # per-approach builds, sizes, rule and class counts, added packages
```

## Raw numbers

### Bundle and CSS (`npm run measure`)

Each page is built alone (`POC_PAGE=<approach> vite build`), once as shipped and once with `core.css` and `app.css` swapped for an empty file (`POC_STYLING_ONLY=1`), so "own CSS" is the approach's alone. gzip level 9 over every `.js` and `.css` in `assets/`. React 19 is in the JS; an empty React page is about 69 KB, so the shared kit and demo are about 1 KB.

```
approach | JS gzip KB | CSS gzip KB (page) | own CSS raw KB | own CSS gzip KB | style rules | classes | build s | extra packages | extra MB
plain    | 70.00 | 4.63 | 3.50 | 1.11 | 36 | 20 | 1.55 / 1.91 / 1.08 | 0  | 0.0
modules  | 70.25 | 4.70 | 3.82 | 1.18 | 36 | 20 | 0.99 / 1.80 / 1.08 | 0  | 0.0
ve       | 70.79 | 4.61 | 3.52 | 1.09 | 36 | 28 | 1.19 / 1.23 / 1.38 | 41 | 26.2
panda    | 77.55 | 5.17 | 5.68 | 1.62 | 43 | 33 | 1.05 / 1.39 / 1.16 | 44 | 34.3
```

Three runs; sizes did not change between runs, build times (one page, about 1 s) are noise at this scale. `panda codegen` takes 1.7 s on top (`time npx panda codegen`).

- CSS Modules +0.25 KB JS: the class-name maps.
- Vanilla Extract +0.79 KB JS: the recipe runtime (`createRuntimeFn`, 1.2 KB gzip on its own) and class maps. Its CSS repeats `@layer monoline.components;` once per file.
- Panda +7.55 KB JS: the recipe runtime and helpers (`styled-system/helpers.js` 5.1 KB gzip before tree-shaking) plus `css()` with its utility map. With the one `css()` call (the spinner) replaced by a fixed class, the page is 73.85 KB (`POC_PAGE=panda vite build`, gzip of the output): the recipes alone cost about 3.9 KB, `css()` 3.7 KB. Its CSS carries a token block of 33 `--colors-*`/`--spacing-*` copies, repeated for the `cssVarRoot` selector, and `--made-with-panda`.
- Extra packages: the transitive closure of each approach's own devDependencies in its `package-lock.json`, minus what the plain baseline installs (74 packages), counting only what is on disk. npm skipped two install scripts (`esbuild` postinstall, `@parcel/watcher` build-from-source; `allowScripts`); everything ran without them.

### Theme switching and overrides (`npm run browser`)

Headless Chrome, 1280 px. Colours are read with `getComputedStyle` and compared with the token resolved inside the same element. Override values are sentinels (`rgb(0, 128, 0)` and others).

| Check | plain | modules | ve | panda |
|---|---|---|---|---|
| solid Button = `--foreground` | pass | pass | pass | pass |
| `<html data-theme="dark">` repaints | pass | pass | pass | pass |
| subtree `data-theme="midnight"` Button = subtree `--foreground` | pass | pass | pass | pass with `cssVarRoot`; fail without |
| subtree `data-accent="blue"` alert bar = subtree `--accent` | pass | pass | pass | pass with `cssVarRoot`; fail without |
| subtree alert background = subtree `--wash` | fail | fail | fail | fail |
| neutral alert bar = `--muted` | pass | pass | pass | pass |
| `className="consumer-btn"` on Button | pass | pass | pass | pass |
| `className` on a tone-coloured AlertTitle (library rule `.alert[data-tone] .alert-title`, specificity 0,3,0 in plain) | pass | pass | pass | pass |
| `--btn-bg` on a wrapper | pass | pass | pass | pass |
| `--accent` on a wrapper | pass | pass | pass | **fail** |
| `.data-override [data-variant="ghost"]` | pass | pass | pass | pass |
| `.data-override [data-state="active"]` | pass | pass | pass | pass |
| Tabs ArrowRight, End, Home, ArrowLeft (wraps) | pass | pass | pass | pass |
| Dialog: Enter opens with focus inside; Escape closes, focus back on trigger | pass | pass | pass | pass |

Notes:

- All override passes depend on the cascade layer. Without it (each tool's default for plain CSS, Modules and VE), the library's `.btn-solid:hover:not(:disabled)` (0,3,0) and `.alert[data-tone] .alert-title` beat a one-class consumer rule, and VE's one-class rules tie with it, so order decides. That is reasoned from specificity, not run. Every approach can express the layer; plain CSS gets it from `bundle.ts` for free.
- The `--wash` fail is the same in all four: `tokens.css` derives `--wash` from `--foreground` on `:root`, so a subtree theme inherits the root's value. It is a token problem (M2 scoped theming, ADR 0012), not a styling-approach one.
- Panda's tokens are copies: `--colors-accent: var(--accent)` is resolved where it is declared, by default `:where(:root, :host)`. A subtree that changes `--accent` does not change `--colors-accent`. Setting `cssVarRoot: ':where(:root, :host, [data-theme], [data-accent])'` fixes theme subtrees; a consumer who sets `--accent` on any other element still gets the old colour unless they also set `--colors-accent`. Avoiding the copies means writing raw `var(--accent)` in recipes, which gives up Panda's typed tokens.
- Screenshots: `examples/styling-poc/dist/shots/<approach>.png` and `-dialog.png`. The four pages look the same.

### SSR (`npm run ssr`)

`vite build --ssr` of [`src/entries/ssr.tsx`](../../examples/styling-poc/src/entries/ssr.tsx) with the app's own config (VE plugin, Panda PostCSS), then `renderToString` of each approach in Node. The class names in the server HTML are compared with the class names the browser run found in the client DOM.

```
pass  plain: 8499 chars, 27 classes, client DOM 27
pass  modules: 9032 chars, 26 classes, client DOM 26
pass  ve: 8699 chars, 37 classes, client DOM 37
pass  panda: 10323 chars, 50 classes, client DOM 50
```

What each needs on the server:

- Plain CSS: nothing. CSS imports are dropped in SSR; class names are strings.
- CSS Modules: a bundler that compiles `.module.css` in the server build (Vite, Next and webpack do). Node cannot import one directly.
- Vanilla Extract: its bundler plugin. `style()` outside the plugin throws "Styles were unable to be assigned to a file" (run with `node` on a file calling `style()`).
- Panda: `panda codegen` before the build. `styled-system/` is plain JavaScript that runs in Node; the CSS comes from PostCSS at build time.

### RSC (judged, `unverified`)

Not built in Next. None of the four needs React state or context to produce a class name (the PoC's `StylesProvider` is only the test harness), so none forces `'use client'` for styling. Plain CSS and CSS Modules have no runtime. VE's `recipe()` and Panda's recipes and `css()` are pure functions that run on the server. For a published library the question is different: VE and Panda need the consumer's bundler to run their compiler unless the library ships pre-built CSS, which plain CSS already is.

### React Native reach

None of the four styles React Native. What could feed it is token values, and none of the PoC's typed approaches holds them: the VE contract names variables (`var(--foreground)`), Panda's tokens are `var()` references. RN reach is a tokens question: `@monoline/tokens` JSON (M2 token source of truth, ADR 0014), independent of the styling approach.

### Agent usability: add `tone="neutral"` (commit `5fe7e57`)

The shared `Tone` union in `kit.tsx` gets one more value (in Monoline this is the component's `.tsx`). Then `npx tsc --noEmit -p .`:

```
src/panda/styles.ts(19,3): error TS2322: Type 'AlertRecipe' is not assignable ... '"neutral"' is not assignable ...
src/ve/styles.ts(11,24): error TS2322: Type 'Tone' is not assignable to type '"info" | "ok" | "warning" | "danger" | undefined'.
src/ve/styles.ts(14,30): error TS7053: ... Property 'neutral' does not exist on type 'Record<"info" | "ok" | "warning" | "danger", string>'.
```

Plain CSS and CSS Modules compile and render the neutral alert with the base bar. Then the style, per approach (`git show --stat 5fe7e57`):

| Approach | Files | Lines | Concepts an agent needs |
|---|---|---|---|
| Plain CSS | `plain/styles.css` | 1 | a CSS rule on `[data-tone]` |
| CSS Modules | `modules/alert.module.css` | 1 | the same, inside a module |
| Vanilla Extract | `ve/alert.css.ts` | 2 (the formatter re-wrapped the variants object: +10 / −1) | `recipe` variants and `styleVariants`, the `inLayer` helper, `vars` |
| Panda CSS | `panda/recipes.ts` | 1, then `panda codegen` for the types | slot recipes, `token()` syntax, codegen |

What a new agent must learn to write a component, beyond CSS: CSS Modules: import maps, untyped keys (Vite types them as `string | undefined` under `noUncheckedIndexedAccess`, so `!` everywhere and a typo is `undefined`). VE: `.css.ts` files, `style`, `recipe`, `styleVariants`, `fallbackVar`, `globalLayer`, `createGlobalThemeContract`, and the rule that every selector must target `&` (VE throws "Style selectors must target the '&' character"), so a descendant selector is rewritten onto the child. Panda: config vs `css()`, recipes vs slot recipes, `token()`, presets, `staticCss`, `cssVarRoot`, codegen, the PostCSS entry.

Traps hit while building the PoC, all silent at build time:

- Panda 2 loads no preset unless configured. Without `@pandacss/preset-base`, `_hover`, `_disabled` and `px` are dropped with only a warning (`unknown condition`) and a type error in `css()`.
- Panda extracts recipes statically. `button({variant, size})` with run-time values generated no button CSS at all until `staticCss: {recipes: '*'}`; the build passed and the buttons were unstyled (browser check: background `rgba(0, 0, 0, 0)`).
- Panda's token copies broke subtree themes until `cssVarRoot` (above).
- `@pandacss/types` 2.6.0 fails its own declarations under `skipLibCheck: false` (TS2308), which every other example keeps on; the PoC turns it on.

Source size (non-blank lines, Biome-formatted): plain 62 (2 files), CSS Modules 71 (5), Vanilla Extract 212 (6), Panda 211 (5, with config). The declarations are the same; VE and Panda are objects with one property per line.

### Migration cost for Monoline (estimate)

Today: 136 React components, 130 component CSS files, 1,190 style rules; 226 use attribute selectors, 247 use a combinator (a part or another component inside a component), 5 use `:has()`, 22 keyframes, 42 `@media`/`@supports`/`@container` blocks; 3 rules in `options.css` restyle component classes. (Counted from `packages/css/src` with a regex over rule preludes.)

Method: the PoC's per-rule cost scaled to 1,190 rules, plus the fixed work the PoC showed, plus what changes for consumers.

- Plain CSS: none.
- CSS Modules: mechanical rename per file and `styles.x` lookups in 136 components (PoC: 1.1× the lines). Fixed work: `bundle.ts`, the registry and `npx monoline add` copy plain CSS; they would have to ship compiled CSS or require a bundler that compiles modules. The 247 combinator rules and `options.css` need `:global` or `composes` across files. Breaking: every public class name (`.btn`) becomes a hash, and CSS-only users (no React, no bundler) lose the stable classes. About 1 to 2 weeks.
- Vanilla Extract: every rule rewritten as a TS object (PoC: 3.4× the lines), the 247 combinator rules restructured onto the child (`&` rule), a theme contract kept in step with `tokens.css`, and a build step for the CSS package, registry and CLI. Breaking for the same class-name reason. About 3 to 4 weeks.
- Panda: the same rewrite into recipes and slot recipes, plus codegen in every build, test and typecheck, `staticCss` for every recipe, and a choice between shipping Panda's generated CSS (stable readable names) or a Panda preset (every consumer must run Panda). About 3 to 4 weeks, breaking.

These are estimates from four components, not measured migrations.
