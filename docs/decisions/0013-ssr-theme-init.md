# 0013: SSR theme init: inline themeScript, ThemeProvider applies after load

Status: accepted

## Context

- A server-rendered page has no access to `localStorage`, so the saved theme can only be applied in the browser. Done in React, it lands after hydration: a visitor who saved `dark` sees one light frame first (MISSION M2: "SSR-safe theme initialisation with no flash").
- The M0 audit (`docs/audit/2026-current-state.md`, Theming/SSR row) believed `themeScript()` already solves this: an inline IIFE in `<head>`, values checked against an allowlist, storage in try/catch, in a file without `'use client'` so a Next.js root layout can call it. Nothing had tested it in a browser.
- `ThemeProvider` reads the saved choices in an effect and only then writes `data-*` to `<html>` (the `ready` state), so it does not overwrite the script with its props on the first render.
- Who uses it: the Next.js guide (`apps/docs/src/site/start-snippets.ts`) inlines `themeScript()` and renders `<ThemeProvider accent="teal">`. The docs site has its own inline script and `monoline-prefs` key and does not use either. The `examples/` starters hard-code `data-theme="warm"` and use neither.

## What was measured

`npm run test:css-browser` (`scripts/css-computed.ts`, section "First paint") bundles a page with esbuild: `core.css`, `themeScript(options)` inline in `<head>`, a recorder script, then a hydrated `<ThemeProvider {...props}>`. The recorder stores `<html>`'s `data-theme` and `data-accent` and the computed `--background` and `--accent` before the first frame (`requestAnimationFrame`), and a `MutationObserver` logs every attribute that changes from one set value to another. After React has run its effects, the colours must equal the first frame and no flip may be logged.

This suite was chosen over `scripts/e2e/` and the docs `probe` because both of those drive the built docs site, which uses neither `themeScript` nor `ThemeProvider`; `css-computed.ts` already takes any folder and checks what the CSS paints.

| Case (saved in localStorage; script options; provider props) | Before (be7bafd) | After |
|---|---|---|
| theme dark, accent green | first frame dark/green, no flip | same |
| theme midnight, accent rose, density compact | midnight/rose, no flip | same |
| theme system with the OS in dark mode, accent violet | dark/violet, no flip | same |
| nothing saved, OS light | warm/default, no flip | same |
| nothing saved; `themeScript()`; `<ThemeProvider accent="teal">` (the Next.js guide) | **first frame orange `#FF4500`, then teal `#0F766E` after hydration** | first frame teal with `themeScript({accent: 'teal'})` |
| accent blue saved; `themeScript({accent: 'teal'})`; provider `accent="teal"` | blue, no flip | same |

The audit's belief holds for saved choices: the script paints them before the first frame and `ThemeProvider` writes the same values after load. It does not hold for an app's own defaults: the script knows only `defaultTheme`, so an accent, font, corner, density or direction passed to `ThemeProvider` reaches the page after hydration, a flash on every visit by anyone who never changed it (the provider saves only on a `set*` call).

## Options

1. **Document a workaround**: write the app's defaults on `<html>` in the server markup (`<html data-accent="teal">`). No code change; the app states each default twice in different syntax, and the guide does not do it today.
2. **themeScript takes the same options as ThemeProvider** (`accent`, `font`, `radius`, `density`, `dir`, beside the existing `storageKey` and `defaultTheme`): used when nothing valid is saved. Additive; the guide passes the same values to both.
3. **ThemeProvider renders the script itself**: one place for the options, but the provider is a client component under `<body>`, so its script runs after the `<head>` CSS and the first paint can already have happened; it also needs `suppressHydrationWarning` handling inside the kit.
4. **Cookie instead of localStorage, server reads it**: no inline script, works without JavaScript, but needs per-framework server code and changes where choices are stored (the vanilla `monoline.js` uses the same keys).

## Decision

Option 2. `themeScript()` accepts `accent`, `font`, `radius`, `density` and `dir`; each is checked against the same allowlist as saved values before it is serialised into the inline script, and a valid saved value still wins. `ThemeProvider` is unchanged: its `ready` gate already keeps it from overwriting the script.

## Consequences

- Additive API: existing calls behave as before. The guide's `ThemeInit` should pass the provider's options (cross-owner request: `apps/docs/src/site/start-snippets.ts`, `themeScript()` becomes `themeScript({accent: 'teal'})`).
- Duplication stays: an app states its options for both the script and the provider. A shared object (`const look = {accent: 'teal'} as const`) works for every key except the theme, which the script calls `defaultTheme`.
- `storageKey` and `defaultTheme` are still serialised as given. They are developer input, typed, and not user data; a `storageKey` containing `</script>` would break the page.
- The test does not run Next.js itself. It checks the contract (script before first frame, provider after hydration) with React's `hydrateRoot` against server markup identical to what `ThemeProvider` renders.

Evidence: `npm run test:css-browser` -> 30 of 697 failed on be7bafd's `themeScript` (2 of them the teal case, 28 the scoped-token cases of ADR 0012); 697 of 697 after. Unit: `npx vitest run src/components/theme-provider` (in `packages/react`) -> 15 passed, including the new defaults case.
