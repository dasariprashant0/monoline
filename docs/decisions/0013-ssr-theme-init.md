# 0013: SSR theme init: inline themeScript, ThemeProvider applies after load

Status: accepted

## Context

- A server-rendered page has no access to `localStorage`, so the saved theme can only be applied in the browser. Done in React, it lands after hydration: a visitor who saved `dark` sees one light frame first (MISSION M2: "SSR-safe theme initialisation with no flash").
- The M0 audit (`docs/audit/2026-current-state.md`, Theming/SSR row) believed `themeScript()` already solves this: an inline IIFE in `<head>`, values checked against an allowlist, storage in try/catch, in a file without `'use client'` so a Next.js root layout can call it. Nothing had tested it in a browser.
- `ThemeProvider` reads the saved choices in an effect and only then writes `data-*` to `<html>` (the `ready` state), so it does not overwrite the script with its props on the first render.
- Who uses it: the Next.js guide (`apps/docs/src/site/start-snippets.ts`) inlined `themeScript()` (no options, in a `'use client'` `ThemeInit` file) and rendered `<ThemeProvider accent="teal">`. The docs site has its own inline script and `monoline-prefs` key and does not use either. The `examples/` starters hard-code `data-theme="warm"` and use neither.

## What was measured

`npm run test:css-browser` (`scripts/css-computed.ts`, section "First paint") bundles a page with esbuild: `core.css`, `themeScript(options)` inline in `<head>`, a recorder script, then a hydrated `<ThemeProvider {...props}>`. The recorder runs synchronously in `<head>`, after the stylesheet and the script and before anything can paint. It stores `<html>`'s `data-theme` and `data-accent` and its computed look: `--background`, `--accent`, `--font-body`, `direction`, `--radius-md` and `--s4` (a density step). After React has hydrated and run its effects, every one of those must be unchanged. A first version sampled in `requestAnimationFrame` (which can run after hydration) and logged attribute flips with a `MutationObserver` (which ignored a value appearing where there was none); both were replaced.

This suite was chosen over `scripts/e2e/` and the docs `probe` because both of those drive the built docs site, which uses neither `themeScript` nor `ThemeProvider`; `css-computed.ts` already takes any folder and checks what the CSS paints.

| Case (saved in localStorage; script options; provider props) | Before (be7bafd) | After |
|---|---|---|
| theme dark, accent green | first frame dark/green, no flip | same |
| theme midnight, accent rose, density compact | midnight/rose, no flip | same |
| theme system with the OS in dark mode, accent violet | dark/violet, no flip | same |
| nothing saved, OS light | warm/default, no flip | same |
| nothing saved; `themeScript()`; `<ThemeProvider accent="teal">` (the Next.js guide) | **first frame orange `#FF4500`, then teal `#0F766E` after hydration** | first frame teal with `themeScript({accent: 'teal'})` |
| accent blue saved; `themeScript({accent: 'teal'})`; provider `accent="teal"` | blue, no flip | same |
| nothing saved; all five options (`violet`, `serif`, `round`, `spacious`, `rtl`) to both | n/a (options did not exist) | first frame = hydrated look; hydrated radius 12px, density step 20px, `rtl` |
| deliberate drift: provider `dir="rtl"`, script without `dir` | n/a | caught: `dir ltr -> rtl` (kept as an expected failure) |

The audit's belief holds for saved choices: the script paints them before the first frame and `ThemeProvider` writes the same values after load. It does not hold for an app's own defaults: the script knows only `defaultTheme`, so an accent, font, corner, density or direction passed to `ThemeProvider` reaches the page after hydration, a flash on every visit by anyone who never changed it (the provider saves only on a `set*` call).

## Options

1. **Document a workaround**: write the app's defaults on `<html>` in the server markup (`<html data-accent="teal">`). No code change; the app states each default twice in different syntax, and the guide does not do it today.
2. **themeScript takes the same options as ThemeProvider** (`accent`, `font`, `radius`, `density`, `dir`, beside the existing `storageKey` and `defaultTheme`): used when nothing valid is saved. Additive; the guide passes the same values to both.
3. **ThemeProvider renders the script itself**: one place for the options, but the provider is a client component under `<body>`, so its script runs after the `<head>` CSS and the first paint can already have happened; it also needs `suppressHydrationWarning` handling inside the kit.
4. **Cookie instead of localStorage, server reads it**: no inline script, works without JavaScript, but needs per-framework server code and changes where choices are stored (the vanilla `monoline.js` uses the same keys).

## Decision

Option 2. `themeScript()` accepts `accent`, `font`, `radius`, `density` and `dir`. Each, and `defaultTheme` (which falls back to `system`), is checked against the same allowlist as saved values before it is serialised; every serialised value, `storageKey` included, has `<` escaped as `\u003c`, so no option can close the `<script>` element. A valid saved value still wins. Storage is read inside its own `try`, so a throwing `localStorage` (blocked site data, a sandboxed iframe) still applies the app's options. `ThemeProvider` is unchanged: its `ready` gate already keeps it from overwriting the script.

## Consequences

- Additive API: existing calls behave as before, except that an invalid `defaultTheme` now falls back to `system` instead of being written to `data-theme`.
- The Next.js guide's root layout (a server component) renders `<script dangerouslySetInnerHTML={{__html: themeScript({accent: 'teal'})}} />` itself; the `'use client'` `ThemeInit` file is gone (it was needed in 0.4.0, where `themeScript` came from a client module).
- Duplication stays: an app states its options for both the script and the provider. Pass the provider's `theme` as `defaultTheme`; no `theme` alias is added, since two names for one option cost more than they save.
- CSP: an inline script needs `nonce` on the `<script>` element, or a hash in `script-src` that must be recomputed whenever the options change or Monoline is upgraded (the script text changes).
- Astro: `<script is:inline set:html={themeScript()} />` in `<head>` (without `is:inline`, Astro bundles and defers it).
- The test does not run Next.js itself. It checks the contract (script before first frame, provider after hydration) with React's `hydrateRoot` against server markup identical to what `ThemeProvider` renders.

Evidence:
- `npm run test:css-browser` with the first version of the check, on be7bafd's `themeScript`: 30 of 697 failed (2 the teal case, 28 the scoped-token cases of ADR 0012). One-off run, 2026-11-25.
- `npm run test:css-browser` with the drift case temporarily treated as a normal case: 1 of 700 failed, `[theme init: drift: provider dir rtl, script without dir] the first paint is the hydrated look: dir ltr -> rtl`. With it kept as an expected failure: 700 of 700.
- `npx vitest run src/components/theme-provider` (in `packages/react`): 16 passed. The escaping and blocked-storage tests fail against the previous `theme-script.ts` (2 of 16).
