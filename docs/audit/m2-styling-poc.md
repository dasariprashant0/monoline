# M2 styling PoC: plain CSS, CSS Modules, Vanilla Extract, Panda CSS

Date: 2026-11-26, revised after review the same day. App: [`examples/styling-poc`](../../examples/styling-poc). Decision: [ADR 0015](../decisions/0015-styling-approach.md).

M2 asks to re-test the plain-CSS decision ([MISSION.md](../MISSION.md) M2) on six criteria: consumer customisation, SSR/RSC, bundle and CSS output, React Native reach, agent usability and migration cost. The PoC builds the same four components four ways and measures each.

## Result

All four can be made to pass the same checks at about the same output size. None beats plain CSS on a MISSION criterion except one: Vanilla Extract and Panda make a missing variant fail `tsc`, and a small script gives plain CSS the same check (prototyped below). What separates them is what each costs to reach that point: a compile step in Monoline's build, a different file for `npx monoline add` to copy, configuration that is wrong by default (Panda), and class names that are either hashed or, when made stable, no longer isolated.

| Criterion | Plain CSS (today) | CSS Modules | Vanilla Extract | Panda CSS |
|---|---|---|---|---|
| Overrides: `className`, CSS variable, `data-*` (6 checks) | 6/6 | 6/6 | 6/6 | 6/6 with recipes on raw `var()`; 5/6 with Panda tokens |
| Theme, density on `<html>` and on a subtree | pass | pass | pass | pass with raw `var()`; fails with Panda tokens |
| `options.css` `data-radius="round"` on a subtree (targets `.btn`) | pass | fail | fail | fail |
| SSR (`renderToString`, classes equal client) | pass, needs nothing | pass, needs a bundler that compiles modules | pass, needs the VE bundler plugin | pass, needs `panda codegen` |
| RSC | no runtime; `unverified: not built in Next` | no runtime; `unverified` | pure recipe runtime; `unverified` | no runtime with class strings; `unverified` |
| JS gzip, page (delta vs plain) | 70.05 KB | 70.32 KB (+0.27) | 70.85 KB (+0.80) | 70.09 KB (+0.04) with class strings; 77.55 KB (+7.55) calling recipe functions and `css()` |
| Own CSS gzip (raw) | 1.11 KB (3.50) | 1.18 KB (3.82) | 1.09 KB (3.52) | 1.27 KB (4.05) |
| Style rules / class names in own CSS | 36 / 20 | 36 / 20 | 36 / 28 | 37 / 28 |
| Class names by default | readable, global | hashed | hashed | readable (`button--variant_solid`) |
| Packages added to the install | 0 | 0 | 41 (26.2 MB) | 44 (34.3 MB, native compiler) |
| Config | none | none (Vite built in) | 2 lines in `vite.config.ts` + a 24-line contract | 17-line `panda.config.ts`, PostCSS config, CSS entry, `codegen` before every build and typecheck |
| React Native reach | tokens only, and the tokens are not this decision | same | same | same |
| Add `tone="neutral"`: files / lines | 1 / 1 | 1 / 1 | 1 / 2 | 1 / 1 + codegen |
| Missing variant caught | no by default; yes with `scripts/variant-check.ts` | no | yes, `tsc` | yes, `tsc` |
| Migration size: 1,190 rules × source lines per rule vs plain (`unverified`) | 0 | 1.1×, breaking | 4.6×, breaking | 3.7×, breaking |

## Method

One behaviour implementation, four styling layers. [`src/kit.tsx`](../../examples/styling-poc/src/kit.tsx) has Button (solid, outline, ghost; sm, md, lg; disabled; loading), Alert (five tones; title, description, icon slot), Tabs (roving arrow-key focus, automatic activation, `data-state`) and Dialog (native `<dialog>`, Escape, focus return). An approach supplies only a `Styles` object of class names through `StylesProvider`, so markup, ARIA, keyboard handling and `data-*` attributes are identical. `Styles` uses property syntax (`alert: (p) => …`), not method syntax, so its parameters are checked strictly: method syntax is bivariant and let a missing tone through. [`src/demo.tsx`](../../examples/styling-poc/src/demo.tsx) is the same page for every approach: the components, a subtree with `data-theme="midnight" data-accent="blue"`, a subtree with `data-density="compact" data-radius="round"`, and the overrides.

All four read Monoline's tokens from `packages/css/dist/core.css` (built from the M2 branch, where derived tokens such as `--wash` and `--control-md` are declared again on `[data-theme]`, `[data-density]` and `[data-radius]`, ADR 0012) and copy the look of `packages/css/src/components/{02-buttons,alert,tabs,dialog}.css`. Each is in a cascade layer, as `dist/` is today ([ADR 0003](../decisions/0003-css-cascade-layers.md)): `@layer monoline.components` by hand in plain CSS and CSS Modules, `globalLayer('monoline.components')` in Vanilla Extract, Panda's own `recipes` layer in Panda. App CSS ([`src/app.css`](../../examples/styling-poc/src/app.css)) is unlayered and imported last.

| Approach | Files |
|---|---|
| Plain CSS | `src/plain/styles.css`, `styles.ts` (class strings) |
| CSS Modules | `src/modules/{button,alert,tabs,dialog}.module.css`, `styles.ts` |
| Vanilla Extract | `src/ve/theme.css.ts` (`createGlobalThemeContract` naming the existing variables), `{button,alert}.css.ts` (`recipe`, `styleVariants`), `{tabs,dialog}.css.ts` (`style`), `styles.ts` |
| Panda CSS | `panda.config.ts` (`@pandacss/preset-base`, `staticCss`), `src/panda/recipes.ts` (`defineRecipe`, `defineSlotRecipe`, values as `var(--x)`), `styles.ts` (typed class strings), `panda.css`, `postcss.config.js` |

Pages: `plain.html`, `modules.html`, `ve.html`, `panda.html` (one approach each, for measuring) and `index.html` (all four side by side). Versions: Vite 7.3.8, React 19.3.1, TypeScript 5.9.3 (the repo's own), Vanilla Extract css 1.21.3 / recipes 0.5.7 / vite-plugin 5.2.6, Panda 2.6.0. Node 26.10.0, darwin arm64.

Commands (from `examples/styling-poc`, after `npm run build -w @monoline/css` at the root):

```bash
npm install --cache "$TMPDIR/npm-cache"
npm run typecheck      # panda codegen, tsc for src and for scripts
npm run build          # panda codegen, vite build of all five pages
npm run browser        # Chrome: theme, density, overrides, keyboard, screenshots (outside the agent sandbox)
npm run ssr            # Vite SSR build, renderToString, compare classes with the browser's
npm run measure        # per-approach builds, sizes, rule and class counts, added packages
npm run variant-check  # every Variant, Size and Tone value has a selector in src/plain/styles.css
```

## Raw numbers

### Bundle and CSS (`npm run measure`)

Each page is built alone (`POC_PAGE=<approach> vite build`), once as shipped and once with `core.css` and `app.css` swapped for an empty file (`POC_STYLING_ONLY=1`), so "own CSS" is the approach's alone. gzip level 9 over every `.js` and `.css` in `assets/`. React 19 is in the JS; an empty React page is about 69 KB.

```
approach | JS gzip KB | CSS gzip KB (page) | own CSS raw KB | own CSS gzip KB | style rules | classes | build s | extra packages | extra MB
plain    | 70.05 | 4.65 | 3.50 | 1.11 | 36 | 20 | 1.30 | 0  | 0.0
modules  | 70.32 | 4.72 | 3.82 | 1.18 | 36 | 20 | 1.04 | 0  | 0.0
ve       | 70.85 | 4.63 | 3.52 | 1.09 | 36 | 28 | 1.09 | 41 | 26.2
panda    | 70.09 | 4.83 | 4.05 | 1.27 | 37 | 28 | 1.48 | 44 | 34.3
```

Build times (one page, about 1 s, 0.99 to 1.91 s over five runs) are noise at this scale. `panda codegen` adds 1.7 s (`time npx panda codegen`).

Panda's JS depends on how the class names are produced, not on Panda itself:

| Panda variant (commit) | JS gzip | Delta vs plain |
|---|---|---|
| Calling the generated `button()`, `alert()` recipe functions, plus one `css()` call for the spinner (`602ec9d`) | 77.55 KB | +7.55 |
| Recipe functions, spinner as a fixed class | 73.85 KB | about +3.9 (the recipe runtime) |
| Typed class strings from Panda's naming scheme, spinner as a recipe (`d8a293c`, current) | 70.09 KB | +0.04 |

The class-string version types each builder with Panda's generated variant types (`(v: Required<ButtonVariant>) => \`button button--variant_${v.variant} …\``), so a tone Panda has no CSS for still fails `tsc` (checked by adding `'extra'` to `Tone`: errors in `src/panda/styles.ts` and `src/ve/styles.ts`, none in plain or modules). It depends on `staticCss: {recipes: '*'}`, because no recipe function is called for Panda to extract.

- CSS Modules +0.27 KB JS: the class-name maps.
- Vanilla Extract +0.80 KB JS: the recipe runtime (`createRuntimeFn`, 1.2 KB gzip alone) and class maps. Its CSS repeats `@layer monoline.components;` once per file.
- Extra packages: the transitive closure of each approach's own devDependencies in its `package-lock.json`, minus what the plain baseline installs (74 packages), counting only what is on disk. npm skipped two install scripts (`esbuild` postinstall, `@parcel/watcher` build-from-source; `allowScripts`); everything ran without them.

### Theme, density and overrides (`npm run browser`)

Headless Chrome, 1280 px. Colours and lengths are read with `getComputedStyle` and compared with the token resolved inside the same element. Override values are sentinels (`rgb(0, 128, 0)` and others). Run on the current branch: 77 pass, 3 fail (the radius row below), exit 0.

| Check | plain | modules | ve | panda |
|---|---|---|---|---|
| solid Button = `--foreground` | pass | pass | pass | pass |
| `<html data-theme="dark">` repaints | pass | pass | pass | pass |
| subtree `data-theme="midnight"` Button = subtree `--foreground` | pass | pass | pass | pass |
| subtree `data-accent="blue"` alert bar = subtree `--accent` | pass | pass | pass | pass |
| subtree alert background = subtree `--wash` | pass | pass | pass | pass |
| subtree `data-density="compact"`: padding `--s5`, height `--control-md` | pass | pass | pass | pass |
| subtree `data-radius="round"`: button gets `--round` from `options.css` | pass | fail (12px) | fail (12px) | fail (12px) |
| neutral alert bar = `--muted` | pass | pass | pass | pass |
| `className="consumer-btn"` on Button | pass | pass | pass | pass |
| `className` on a tone-coloured AlertTitle (library rule `.alert[data-tone] .alert-title`, specificity 0,3,0 in plain) | pass | pass | pass | pass |
| `--btn-bg` on a wrapper | pass | pass | pass | pass |
| `--accent` on a wrapper | pass | pass | pass | pass |
| `.data-override [data-variant="ghost"]` | pass | pass | pass | pass |
| `.data-override [data-state="active"]` | pass | pass | pass | pass |
| Tabs ArrowRight, End, Home, ArrowLeft (wraps) | pass | pass | pass | pass |
| Dialog: Enter opens with focus inside; Escape closes, focus back on trigger | pass | pass | pass | pass |

Notes:

- The radius row is the one structural difference measured. `options.css` restyles components by class name (`[data-radius="round"] .btn { border-radius: var(--round) }`, 3 such rules), so it reaches only the approach whose button carries `.btn`. Any other approach has to move those rules into each component's styles.
- All override passes depend on the cascade layer. Without it (each tool's default for plain CSS, Modules and VE), the library's `.btn-solid:hover:not(:disabled)` (0,3,0) and `.alert[data-tone] .alert-title` beat a one-class consumer rule, and VE's one-class rules tie with it, so order decides. That is reasoned from specificity, not run. Every approach can express the layer; plain CSS gets it from `bundle.ts`.
- Panda with its own tokens, measured before the rewrite (`c88885b`, with `cssVarRoot: ':where(:root, :host, [data-theme], [data-accent])'`): `--accent` on a wrapper fail (`rgb(255, 69, 0)`), density subtree fail (`24px 48px` instead of `18px 36px`), radius 0px. Panda's tokens are copies (`--colors-accent: var(--accent)`) resolved on the elements `cssVarRoot` names, and inherited as fixed values below them. Without `cssVarRoot` the theme subtree failed too. Two routes fix it: recipes that read Monoline's variables directly (`var(--accent)`, what the PoC does now; Panda's typed tokens and `strictTokens` are then unused), or `cssVarRoot: ':where(*)'`, which declares every token copy on every element (33 copies in the PoC, about 90 for Monoline's full token set) so each re-resolves locally, at a style-recalculation cost on large pages that this PoC did not measure.
- Screenshots: `examples/styling-poc/dist/shots/<approach>.png` and `-dialog.png`. The four pages look the same.

### SSR (`npm run ssr`)

`vite build --ssr` of [`src/entries/ssr.tsx`](../../examples/styling-poc/src/entries/ssr.tsx) with the app's own config (VE plugin, Panda PostCSS), then `renderToString` of each approach in Node. The class names in the server HTML are compared with the class names the browser run found in the client DOM.

```
pass  plain: 8774 chars, 27 classes, client DOM 27
pass  modules: 9315 chars, 26 classes, client DOM 26
pass  ve: 8977 chars, 37 classes, client DOM 37
pass  panda: 9986 chars, 37 classes, client DOM 37
```

What each needs on the server:

- Plain CSS: nothing. CSS imports are dropped in SSR; class names are strings.
- CSS Modules: a bundler that compiles `.module.css` in the server build (Vite, Next and webpack do). Node cannot import one directly.
- Vanilla Extract: its bundler plugin. `style()` outside the plugin throws "Styles were unable to be assigned to a file" (run with `node` on a file calling `style()`).
- Panda: `panda codegen` before the build, for the types; with class strings no Panda code runs at all. The CSS comes from PostCSS at build time.

### RSC (`unverified: not built in Next`)

Judged from the build output only. None of the four needs React state or context to produce a class name (the PoC's `StylesProvider` is only the test harness), so none should force `'use client'` for styling. Plain CSS, CSS Modules and Panda with class strings have no styling runtime; VE's `recipe()` is a pure function. For a published library the question is different: VE and Panda need Monoline's build (or the consumer's) to run their compiler, where plain CSS is already the shipped file.

### Class names: hashed by default, not by necessity

Both checked with a throwaway config (`POC_PAGE=<page> vite build -c vite.stable.config.ts`, not committed):

- CSS Modules with `css.modules.generateScopedName: '[local]'` builds unhashed names. Isolation is then gone: the PoC's alert `.title` and dialog `.title` became one class, so every alert title got the dialog's display font (five `.title{…}` rules in the output). Stable names that do not collide need prefixes written by hand, which is plain CSS.
- Vanilla Extract with `vanillaExtractPlugin({identifiers: ({debugId}) => \`ml-${debugId}\`})` builds stable names where a debug id exists, but `style()` calls without one became `.ml-undefined`, and recipe variants from different recipes share names (`.ml-tone_ok`). Stable VE names need a unique id on every style.

So the real costs are not hashing: they are a compile step in Monoline's CSS build, `npx monoline add` copying `.css.ts` or generated CSS instead of the source file, and, for CSS Modules with stable names, no isolation at all.

### React Native reach

No approach styles React Native: what RN can use is token values. Plain CSS and CSS Modules have none of their own (they read `tokens.css`). The PoC's VE contract and Panda recipes hold only variable names (`var(--foreground)`), on purpose: VE's `createGlobalTheme` with real values, or Panda tokens with values, would have been a second source for every colour and size next to `tokens.css`. RN reach therefore comes from the M2 tokens work (ADR 0014, pending): the tokens will be authored in a TypeScript source that generates the CSS, and the same source can emit React Native values. That holds whichever styling approach reads the CSS.

### Agent usability: add `tone="neutral"` (commit `5fe7e57`)

The shared `Tone` union in `kit.tsx` gets one more value (in Monoline this is the component's `.tsx`). Then `npx tsc --noEmit -p .` failed in `src/panda/styles.ts` and `src/ve/styles.ts` (TS2322, TS7053); plain CSS and CSS Modules compiled and rendered the neutral alert with the base bar. Then the style, per approach (`git show --stat 5fe7e57`):

| Approach | Files | Lines |
|---|---|---|
| Plain CSS | `plain/styles.css` | 1 |
| CSS Modules | `modules/alert.module.css` | 1 |
| Vanilla Extract | `ve/alert.css.ts` | 2 (the formatter re-wrapped the variants object: +10 / −1) |
| Panda CSS | `panda/recipes.ts` | 1, then `panda codegen` for the types |

Plain CSS can get the missing-variant check without a new tool. [`scripts/variant-check.ts`](../../examples/styling-poc/scripts/variant-check.ts) reads the `Variant`, `Size` and `Tone` unions from `kit.tsx` and requires, for each value except the default, either a modifier class (`.btn-outline`) or an attribute selector (`.alert[data-tone="neutral"]`) in `src/plain/styles.css`:

```
$ node scripts/variant-check.ts
every variant value has a rule                                     (exit 0)
$ grep -v 'data-tone="neutral"' src/plain/styles.css | grep -v btn-outline > $TMPDIR/broken.css
$ node scripts/variant-check.ts $TMPDIR/broken.css
missing  variant="outline": no .btn-outline or .btn[data-variant="outline"]
missing  tone="neutral": no .alert-neutral or .alert[data-tone="neutral"]
2 variant value(s) without a rule                                  (exit 1)
```

It is a prototype: it reads unions with a regex and its prop-to-class table is hand-written for three unions.

Concepts an agent must learn beyond CSS (judged by the author from writing the four layers, one edit each; not a study): CSS Modules: import maps, untyped keys (Vite types them as `string | undefined` under `noUncheckedIndexedAccess`, so `!` everywhere and a typo is `undefined`). VE: `.css.ts` files, `style`, `recipe`, `styleVariants`, `fallbackVar`, `globalLayer`, `createGlobalThemeContract`, and the rule that every selector must target `&` (VE throws "Style selectors must target the '&' character"), so a descendant selector moves onto the child. Panda: config recipes vs `css()`, recipes vs slot recipes, presets, `staticCss`, codegen, the PostCSS entry, and why its tokens are not used here.

Traps hit while building the Panda layer, all silent at build time:

- Panda 2 loads no preset unless configured. Without `@pandacss/preset-base`, `_hover`, `_disabled` and `px` are dropped with only a warning (`unknown condition`) and a type error in `css()`.
- Panda extracts recipes statically. With run-time variant values, no button CSS was generated until `staticCss: {recipes: '*'}`; the build passed and the buttons were unstyled (browser check: background `rgba(0, 0, 0, 0)`).
- Panda's token copies broke subtree themes, density and wrapper overrides (above).
- `@pandacss/types` 2.6.0 fails its own declarations under `skipLibCheck: false` (TS2308), which every other example keeps on; the PoC turns it on.

### Migration size for Monoline (`unverified`)

Today: 136 React components, 130 component CSS files, 1,190 style rules; 226 use attribute selectors, 247 use a combinator (a part or another component inside a component), 5 use `:has()`, 22 keyframes, 42 `@media`/`@supports`/`@container` blocks; 3 rules in `options.css` restyle component classes. (Counted from `packages/css/src` with a regex over rule preludes.)

No rate was measured, so this gives sizes, not time. Line multiplier = the approach's style source lines for the four PoC components ÷ plain CSS's 41 lines (non-blank, non-comment, Biome-formatted; VE and Panda put one property per line, so part of the multiplier is formatting).

| Approach | Style source | Multiplier | Also needed |
|---|---|---|---|
| Plain CSS | 41 lines | 1× | nothing |
| CSS Modules | 47 lines (4 files) | 1.1× | `styles.x` lookups in 136 components; the 247 combinator rules and `options.css` rewritten with `:global` or `composes`; a CSS build and registry copy that compile modules; public class names hashed, or stable and colliding |
| Vanilla Extract | 188 lines (5 files, 24 of them the token contract) | 4.6× | the 247 combinator rules moved onto the child (`&` rule); a contract kept in step with `tokens.css`; a compile step for the CSS package, registry and CLI |
| Panda | 153 lines (recipes) | 3.7× | codegen in every build, test and typecheck; `staticCss` for every recipe; recipes on raw `var()`; a choice between shipping Panda's generated CSS or a preset every consumer must run |

All three replacements are breaking for consumers who target `.btn` and for the 3 `options.css` rules that do (measured: the radius row).
