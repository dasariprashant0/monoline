# Improvement plan (phase 0 recon)

Date 2026-11-20, branch `claude/ds-recon-plan-215911`, version 0.5.0 (released 2026-11-20 per `CHANGELOG.md`). Rebased onto `origin/master` `4bd0932` (was cut from `e4b3e46`). The findings were measured at 0.4.0 + unreleased tokens; the 0.5.0 delta (docs redesign, GitHub Pages removed, docs moved to monoline.prashantdasari.com, README badges, versions bumped to 0.5.0) is folded in below. The baseline command results were **not** re-run after the rebase. No component code changed. Rows are checked in this worktree unless marked otherwise.

## Baseline: commands actually run

`npm ci` was needed first (no `node_modules`). All commands run from the repo root.

| Command | Result |
|---|---|
| `npm run build` | pass (css 137.5 KB, 133 component bundles, docs prerender 173 pages). Warns: docs JS chunk 1,159 KB (320 KB gzip) |
| `npm run typecheck` | pass |
| `npm test` | pass, 162 files, 1446 tests |
| `npm run check` (css lint, doc comments, registry, typecheck, tests) | pass, 1446 tests |
| `npm run size` | pass, but close to budget: all CSS 19.9/20 KB, Everything 96.2/100 KB, Tooltip 2.3/2.5 KB |
| `test:mcp` / `test:cli` / `test:tokens` / `test:release` / docs `test:docs` | pass: 36 / 19 / 11 / 16 / 10 |
| `npm run e2e`, `ax`, `scripts/audit.mjs` (real Chrome) | **not run** (need a browser; the sandbox blocks it). Their last results are in `docs/a11y-report.md` and `docs/e2e-findings.md` |
| GitHub CI status, issues, npm publish state | **not checked**: `gh` cannot read its config in the sandbox and npm view needs network. There are no TODO/FIXME markers in source |

## Repo map

| Part | Where | Notes |
|---|---|---|
| CSS core | `packages/css` (`@monoline/css`) | tokens, 3 themes, 8 accents, 129 component files, `dist/core.css` + per-component bundles |
| React | `packages/react` (`@monoline/react`) | 135 components, 23 hooks, ESM + CJS, `sideEffects:false`, peer react >=18, dep `radix-ui` |
| Other packages | `packages/cli` (`monoline`), `mcp`, `tokens` (private), `vscode` | all 0.5.0 |
| Docs | `apps/docs` (Vite, prerendered, playground, theme builder, Themes, Blocks, Compare) | no Storybook; the docs site is the catalogue |
| Registry | `registry/` (160 files: `index.json` plus 159 entries, 136 components and 23 hooks), `llms.txt`, `llms-full.txt` | generated, maintainer-only |
| Examples | `examples/{dashboard,auth-settings,landing}` | |
| CI | ``.github/workflows/{ci,audit,ax,e2e,release}.yml` (`pages.yml` removed in 0.5.0; docs now served from monoline.prashantdasari.com, host config not in this repo) | release publishes with provenance, needs `NPM_TOKEN` |
| Design rules | `DESIGN.md`, `AGENTS.md`, `docs/ROADMAP.md` | |

## A. Findings

> **Status on master (5a4ffa8), checked 2026-11-23.** This is the 2026-11-20 audit; it is kept as written and the rows below carry a status where master moved. Done: F1 (React matrix), F2 (starters and install smoke; React Router in place of Remix), F9 (ROADMAP rewritten), F10 (AGENTS.md updated), F11 (ADRs 0001 to 0006), F12 (docs version aligned), F13 (route-level splitting, `apps/docs/src/shell/lazy.ts`), F8 (Firefox and WebKit smoke), M2 (`until-found`, ADR 0005), M5 (cascade layers, ADR 0003), G3 (starters). Open: F3/G1 (npm publish of 0.5.0), F4/G8 (screen-reader pass), F6 (three accessibility-tree findings remain; see `docs/a11y-report.md`), M1 (native anchor stays opt-in, rework in progress on another branch), the `monoline add` bug, `themeScript`, forced-colors on `.btn-solid`, CJS types.

Severity: H blocks adoption or violates the stated a11y bar; M real gap; L polish.

| ID | Area | Sev | Evidence | Fix |
|---|---|---|---|---|
| F1 (done on master) | library | H | `.github/workflows/ci.yml` runs one Node 22 job; no React 18/19 matrix, while `packages/react/package.json` peer is `>=18` | Add a matrix job (React 18 and 19) running `npm test -w @monoline/react` |
| F2 (done on master) | library | H | No clean-install test anywhere (`ROADMAP.md` 0.4 open); no `examples/` Vite/Next/Astro/Remix starters | Add install smoke tests that pack the tarballs and render Button + Dialog in 4 starters |
| F3 | library | H | `ROADMAP.md` 0.3: "not on npm yet" (stale?). 0.5.0 is tagged in `CHANGELOG.md` and the README now has an npm badge, so it may be published; **not verified** (no network check run). `release.yml` needs `NPM_TOKEN` and the `release` environment | Owner decides when to publish (see E1); dry-run `npm pack` per package first |
| F4 | a11y | H | `docs/a11y-report.md` line 7: no NVDA/JAWS/VoiceOver/TalkBack testing has been done by anyone | Owner-run manual pass on the 15 flows (report lines 36-115); agents only prepare scripts |
| F5 | a11y | M | `grep forced-colors\|prefers-contrast packages/css/src` returns 0 files | Add `forced-colors` and `prefers-contrast` rules for focus ring, borders, selected states; check in `scripts/css-computed.mjs` |
| F6 | a11y | M | `docs/a11y-report.md` "Open findings" (now 11, was 9; the two new ones are focusable `generic` elements with nothing to announce): Toast viewport has two unnamed focusable proxies; docs sidebar is a second unnamed complementary landmark; scrollable code blocks are focusable with no role | Name/role the docs items (`apps/docs`); for Toast, confirm after the 0.4 rewrite whether it is still Radix and fix or document |
| F7 | a11y | M | `docs/e2e-findings.md` "Not fixed": context-menu demo trigger not focusable, Drawer has no visible close, tooltip closes on scroll, combobox opens on focus. Written before the 0.4 native-dialog/floating-layer rewrite, so some may be stale | Re-test each in real Chrome; fix demos (focusable trigger, `DrawerClose`) and update the file |
| F8 (done on master) | a11y | M | `.github/workflows/e2e.yml` and `scripts/e2e/` are Chrome only; no Firefox/WebKit grep hits | Add Firefox and WebKit smoke for dialog, menu, select, combobox, tabs (roadmap 0.6) |
| F9 (done on master) | docs | M | `docs/ROADMAP.md` says 114 components, 1182 tests, Radix size risk, "Button 1.7 KB"; reality is 135 components, 1446 tests, Radix mostly removed, Button 0.7 KB (`CHANGELOG.md` 0.4.0) | Rewrite the status table and risks; mark done phases |
| F10 (done on master) | docs | M | `AGENTS.md` says deps are only `radix-ui` and `asChild` uses Radix `Slot`; `CHANGELOG.md` 0.4.0 says Slot is now `utils/slot.tsx` and overlays are native | Update AGENTS.md conventions (it is the contract for agents) |
| F11 (done on master) | docs | M | No `docs/decisions` or ADR folder; big choices (native `<dialog>`, own floating layer, per-module build, CSS split) live only in CHANGELOG | Add 4-5 short ADRs from `CHANGELOG.md` 0.4.0 |
| F12 (done on master) | docs | L | `apps/docs/package.json` version 0.3.0 vs 0.5.0 elsewhere | Align or leave (private) |
| F13 (done on master) | code | M | Build log (measured before the docs redesign, **not re-measured**): docs `index-*.js` 1,159 KB / 320 KB gzip in one chunk (`vite build` warning) | Route-level `import()` code splitting for docs pages |
| F14 | code | M | `npm run size` (pre-0.5.0 numbers): all CSS 19.9/20 KB, Everything 96.2/100 KB; any new component will trip the budget | Re-baseline budgets deliberately or trim; document the policy |
| F15 | code | L | No linter or formatter script in root `package.json`; "lint" is only `packages/css/scripts/check.mjs` and `check-docs.mjs` | Decide (E3): add ESLint with `jsx-a11y`, or keep custom checks |
| F16 | code | L | `CHANGELOG.md` Unreleased: `--bp-*` tokens are not used by any media query (stylesheets use 560/600/760/800/860/900/1100 px, 40/64rem) | Leave until the owner decides on tablet layout change |
| F17 | motion | L | `prefers-reduced-motion` appears in `packages/css/src/base.css:59` (global) and 14 of 33 CSS files that animate | Confirm base.css rule covers the rest; add a check in `packages/css/scripts/check.mjs` that every animating file is covered |
| F18 | components | L | `docs/api-audit.md` section 4: `label` vs `aria-label`, `title` as node vs string, `items` shapes, DatePicker/Combobox own open state left inconsistent on purpose | Add aliases only if the owner wants (E4) |

Checked and fine: `outline:none` uses in `packages/css/src` are either programmatic-focus containers or have a `:focus-within` ring (`tags-input.css:3`, `multi-select.css:4`); `README.md` and `packages/react/README.md` already describe the native/Radix split correctly.

### A2. Adoption gaps (from the repo audit; the competitor comparison is in `docs/BENCHMARK.md`, written by the ds-benchmark session and not duplicated here)

| ID | Area | Gap | Evidence | Fix |
|---|---|---|---|---|
| G1 | Install | Install path unverified: roadmap 0.3 says not published, but 0.5.0 is released and the README has an npm badge. Run `npm view @monoline/react` first | `README.md` "Use it"; `docs/ROADMAP.md` Phase 0 | Publish (E1), then verify on a clean machine (F2) |
| G2 | Install | README's first path loads all CSS (`import '@monoline/css'` = 19.9 KB gzip) while CHANGELOG 0.4.0 calls `core.css` plus per-component CSS the recommended path (core 3.6 KB) | `README.md`, `CHANGELOG.md`, `npm run size` | Make the small-CSS path the README default, with `@monoline/react` `styles` map |
| G3 (done on master) | Install | No starter a newcomer can clone for Vite, Next.js, Astro or Remix; `npx monoline init` exists but no "create app" route | `examples/` (3 apps, built from workspace), `packages/cli` | Starters per framework (WP1); decide on `npm create` (E8) |
| G4 | Install | Framework notes (Next.js `'use client'`, SSR, CSS import order, React 18 vs 19) are not tested or documented | `ci.yml`, `AGENTS.md` ("Server-safe") | Test in the install smoke, then add a short guide per framework |
| G5 | Docs | Guides exist (getting started, CLI, theming, forms, i18n, a11y, contributing, AI) but there is no migration guide, no "why Monoline / when not to use", no versioned docs | `apps/docs/src/guides.tsx:155-163`, `CHANGELOG.md` breaking changes only | Add migration and "choosing" pages; versioned docs after 1.0 (roadmap 3.7) |
| G6 | Docs | First-run view: docs build is one 1.16 MB JS chunk | build log (F13) | Code-split (WP5) |
| G7 | Theming | 5 theme attributes and a theme builder, but presets are not named and shareable (roadmap 3.4 partial); no `forced-colors`/`prefers-contrast` (F5) | `README.md` table, `apps/docs/src/theme-builder.tsx` | Named presets with export; high-contrast support (WP4) |
| G8 | A11y proof | Claims are strong but proof is Chrome-only and no assistive technology has been run; the a11y page says so honestly | `docs/a11y-report.md:7`, F4, F8 | Publish the manual-test results and a per-component conformance table when done; until then keep the "not covered yet" wording |
| G9 | Trust | Zero users, no RFC process, no issue labels, public roadmap is stale (F9) | `docs/ROADMAP.md` Phase 4, `.github/ISSUE_TEMPLATE` | Refresh roadmap, add labels and good-first-issues, ask 3 outside projects |

### A3. Modern web platform gaps (skill `modern-web-guidance:modern-web-guidance`, source GoogleChrome/modern-web-guidance-src)

The platform picture and priorities are in the "Modern web platform" section of `docs/STRATEGY.md` on the ds-benchmark branch (not duplicated here). Below are the places in this repo that use JS or older CSS where a guide exists. Guide ids come from `npx modern-web-guidance search` run in this session. Baseline status was **not** checked per feature: a guide says to add a fallback for anything not Baseline widely available, so each row is "evaluate", not "replace".

| ID | Area | Sev | Evidence in repo | Native option (guide id) | Fix |
|---|---|---|---|---|---|
| M1 | components | M | `packages/react/src/components/popover/float.tsx` (99 lines): `getBoundingClientRect` placement, flip, shift for Popover, Tooltip, HoverCard, Select and menus; no `popover` attribute, `anchor-name` or `position-anchor` anywhere in `packages/` (grep: 0 files) | `viewport-aware-dropdowns`, `position-aware-tooltips`, `interest-triggered-tooltips`, `declarative-dialog-popover-control`, `animate-to-from-top-layer` | Prototype CSS anchor positioning plus `popover` with `float.tsx` as the fallback behind feature detection; keep the same props and tests; measure the size win |
| M2 (done on master) | components | M | `components/accordion/accordion.tsx` and `collapsible` wrap Radix (`radix-ui`); no `interpolate-size`/`calc-size` (0 files), no `hidden="until-found"` (0 files), so closed content is not findable with Find in page | `accordion`, `animate-to-intrinsic-sizes`, `search-hidden-content` | Evaluate native `<details name>` plus `interpolate-size` for Accordion; at least add `until-found` to hidden panels |
| M3 | motion | L | `components/scroll-progress/scroll-progress.tsx:15-16` reads `scrollY` in a scroll handler to set a percentage; 7 files add scroll listeners; `animation-timeline`/`scroll-timeline` in 0 CSS/TS files | `scroll-progress-indicator`, `motion`, `scroll-entry-exit-effects` | CSS scroll-driven animation for ScrollProgress and similar effects, JS fallback; the base `prefers-reduced-motion` rule stays |
| M4 | motion | L | `@starting-style` in 0 files; overlay enter/exit animation approach not verified | `animate-to-from-top-layer`, `animate-element-entry-exit` | Check dialog/drawer/popover CSS; adopt `@starting-style` plus `transition-behavior: allow-discrete` where animations are JS-timed |
| M5 (done on master) | code | M | `@layer` in 0 files under `packages/css/src` while roadmap 0.7 requires "`@layer` so app styles always win"; also dogfood bugs A1-A3 were specificity fights (`docs/dogfood-log.md`) | `css` | Wrap tokens, base, components in cascade layers (WP4 core, WP2 components); document the override order |
| M6 | code | L | `@container` in 0 files; component responsiveness uses `@media` widths (see F16) | `css-layout`, `card` | Use container queries for card-like and dashboard components where they sit in variable-width slots |
| M7 | components | L | Select, Switch use Radix/own layer; native `switch` attribute is used in 1 file; customizable `<select>` not used | `switch`, `branded-select-styling`, `animated-select-picker` | Low priority; evaluate after M1 |
| M8 | a11y | L | `grep light-dark( packages/css/src` = 0; themes use `data-theme` custom properties (fine) but `prefers-color-scheme` default not verified | `browser-ui-theming`, `css` | Check `color-scheme` is set so native controls and scrollbars follow the theme |

Already native, no action: `<dialog>` with `showModal()` for Dialog, AlertDialog, Drawer and Command (`CHANGELOG.md` 0.4.0), `inert` in 11 files, `:has()` in 5 CSS files, `color-mix` in 7.

## B. Roadmap status (`docs/ROADMAP.md`)

| Item | Status | Evidence |
|---|---|---|
| 0.1 Per-module build and size budget | done | `scripts/size.mjs`, `npm run size` passes (Button well under 2.5 KB) |
| 0.2 Green CI on GitHub | unverified | workflows exist; run state not readable here |
| 0.3 Publish to npm with provenance | partial | `.github/workflows/release.yml`, `scripts/release.mjs`, `docs/releasing.md`; roadmap says not yet published |
| 0.4 Clean installs in Vite/Next/Astro/Remix | done on master | `npm run install-smoke`, `examples/starters/{vite,next,astro,react-router}` (React Router stands in for Remix) |
| 0.5 React 18 and 19 matrix | done on master | `react-matrix` job in `ci.yml` |
| 0.6 Real-browser interaction tests | partial | `scripts/e2e` (114 tests, Chrome only); no Firefox/Safari |
| 0.7 CSS split with `@layer` | done on master | `packages/css/scripts/bundle.mjs` adds the layers when it builds `dist/` (ADR 0003) |
| 1.1 API audit | done | `docs/api-audit.md` |
| 1.2 State attributes | partial | convention in `AGENTS.md`; `packages/react/src/api-consistency.test.tsx` covers some |
| 1.3 Slot/class naming | partial | rule in `AGENTS.md`; not audited per page |
| 1.4 Token completeness | done (unreleased) | `CHANGELOG.md` Unreleased, merged in #16; breakpoint tokens unused in CSS |
| 1.5 WAI-ARIA behaviour parity | partial | `docs/a11y-report.md` 41 components checked; 3 distinct findings open when last run (10 occurrences) |
| 1.6 Bug sweep | partial | `docs/e2e-findings.md`, `docs/dogfood-log.md`; unfixed items in F7 |
| 1.7 Docs playground | done | `apps/docs/src/page/playground.tsx` |
| 2 Fill gaps (date range, range calendar, time field, tour, resizable, mentions, tree-select, overflow list, copy button, image gallery, notification, sortable, virtual list) | done | all present under `packages/react/src/components`; no "splitter" or "lightbox" names (resizable and image-gallery cover them) |
| 2 Real tests with react-hook-form / TanStack Form | not started | no test workspace |
| 2 Full app shell | done | `sidebar`, `navbar`, `app-shell`, `page-header` components |
| 3.1 Templates | done | `examples/` (3 apps; no blog starter) |
| 3.2 Blocks gallery | done | `apps/docs/src/site/Blocks.tsx` |
| 3.3 MCP server | done | `packages/mcp`, 36 tests pass |
| 3.4 Theme presets and builder | partial | `apps/docs/src/theme-builder.tsx`, `site/Themes.tsx`; JSON/CSS export not checked |
| 3.5 Figma kit | partial | tokens only: `packages/tokens/dist/figma-variables.json`; no component kit |
| 3.6 Editor support | partial | `packages/vscode/snippets`; props autocomplete not checked |
| 3.7 Versioned docs, changelog, migration | partial | `CHANGELOG.md` has breaking-change notes; no versioned docs or migration guide page |
| 4 Manual screen-reader testing | not started | `docs/a11y-report.md` |
| 4 Benchmark page | partial | `apps/docs/src/site/Compare.tsx` exists; contents not verified |
| 4 Governance | partial | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`; no RFC process |
| 4 Real users | not started | no evidence |

Open items as of this audit: 15 not done. Since then 0.4, 0.5 and 0.7 are done on master. Still not started: RHF/TanStack tests, manual screen-reader pass, real users.

## Skills used and not used

| Skill | Status |
|---|---|
| design:design-system, design:accessibility-review, wcag-accessibility, documentation-and-adrs | invoked; their checklists shaped A and C |
| modern-web-guidance:modern-web-guidance | invoked; searches for popover, anchor, animation, accordion, scroll, select, layers (A3) |
| design:design-critique, agentic-council:visual-audit, :design-system-architecture, :a11y-audit, ui-ux-pro-max:design-system | **not invoked** in phase 0 (a visual pass needs a running browser); assigned to work packages |
| design:research-synthesis | skipped: `docs/research/` is library comparison, not user research |
| ui-ux-pro-max:brand | skipped: tokens are consistent (`npm run check` contrast and raw-colour lint pass) |

Skills found by `npx skills find` (not installed): `pbakaus/impeccable@impeccable` 421.8K installs; `pbakaus/impeccable@teach-impeccable` 50K; `bergside/awesome-design-skills@impeccable` 2.8K; `nexu-io/open-design@impeccable-design-polish` 2.8K; `anthropics/knowledge-work-plugins@design-system` 4.7K; `mattpocock/skills@codebase-design` 975.1K; `github/awesome-copilot@penpot-uiux-design` 13K; `forcedotcom/sf-skills@design-systems-slds-validate` 6.1K. No hit specific to design-system accessibility beyond these.

## C. Work packages (max 5, disjoint file ownership)

Generated files (`packages/react/src/index.ts`, `registry/`, `llms*.txt`, `dist/`) stay maintainer-only for every package.

| WP | Scope | Owns (globs) | Skills | Agents | Model / effort | Acceptance |
|---|---|---|---|---|---|---|
| WP1 Library and CI | F1, F2, F3 (dry run only), F14; roadmap 0.2-0.5, 3.7 migration notes | `.github/workflows/{ci,release}.yml`, root `package.json`, `packages/*/package.json`, `packages/{cli,mcp,tokens,vscode}/**`, `scripts/{release*,size*}.mjs`, `scripts/lib/**`, new `scripts/install-smoke/**`, `examples/**` | ci-cd-and-automation, shipping-and-launch, api-and-interface-design, modern-web-guidance:modern-web-guidance (browser-support policy, E9) | Frontend Developer, typescript-reviewer | sonnet, high | React 18+19 matrix green locally; 4 starters build; `npm pack --dry-run` lists expected files; `npm run check`, `size`, `test:release` pass |
| WP2 Components and a11y fixes | F6 (component part), F7, F17, F18 (only if E4 yes); roadmap 1.2, 1.3, 1.5 | `packages/react/src/**`, `packages/css/src/components/**` | wcag-accessibility, design:accessibility-review, agentic-council:a11y-audit, react-patterns, modern-web-guidance:modern-web-guidance (M1, M2, M7) | Frontend Developer, Accessibility Auditor, react-reviewer | sonnet, high | each fix has a test; `npm test`, `npm run check`, `npm run typecheck` pass; F7 items re-tested in Chrome and listed fixed or stale |
| WP3 Browser a11y and interaction tests | F4 prep, F5 test side, F8; roadmap 0.6, 4 | `scripts/{e2e,ax}/**`, `scripts/{audit,audit-examples,css-computed}.mjs`, `.github/workflows/{ax,e2e,audit}.yml`, `docs/{a11y-report,e2e-findings,screen-readers}.md` | browser-testing-with-devtools, e2e-testing, agentic-council:a11y-audit | Accessibility Auditor, Evidence Collector | sonnet, high | `npm run e2e` and `npm run ax` run and pass in Chrome; Firefox/WebKit smoke added; report regenerated; manual SR script ready for owner |
| WP4 Tokens, motion and visual polish | F5 (CSS side), F16, F17 check; roadmap 1.4, 3.4 | `packages/css/src/{tokens,base,accents,options,utilities}.css`, `packages/css/{scripts,js}/**`, `DESIGN.md`, `apps/docs/src/theme-builder.tsx` | design:design-critique, agentic-council:visual-audit, agentic-council:design-system-architecture, ui-ux-pro-max:design-system, modern-web-guidance:modern-web-guidance (M3-M6, M8) | UI Designer, UX Architect, Evidence Collector | sonnet, medium (high for forced-colors) | `npm run check` (contrast, raw-colour) and `test:tokens` pass; screenshots in 3 themes at 375 and 1280 px; forced-colors and reduced-motion checks added |
| WP5 Docs and ADRs | F6 (docs part), F9-F13; roadmap 3.7, 4 governance | `apps/docs/**` (except `theme-builder.tsx`, `src/shell/Home.tsx`, `src/guide*.tsx`, `src/guides*.tsx`, `src/site/**`, which WP6 owns), `docs/{ROADMAP,IMPROVEMENT-PLAN,api-audit,bundle-report,css-modules,dogfood-log,mcp,releasing,rtl,agent-brief}.md`, new `docs/decisions/**`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `packages/{css,react}/README.md` | documentation-and-adrs, design:design-system, humanizer | Frontend Developer, Reality Checker | sonnet, medium | ROADMAP numbers match this plan; ADRs added; docs chunk split; `npm run build`, `test:docs`, `npm run check` pass |
| WP6 Adoption (consumes `docs/BENCHMARK.md`) | A2 gaps G2, G3 (docs side), G4, G5, G7 (presets), G9; the ranked patterns in BENCHMARK.md that fit the repo. **Starts only when BENCHMARK.md exists** (merged or read from the ds-benchmark branch); first step: map each ranked pattern to a gap or a new task and drop any that need E-decisions | `README.md`, new `docs/ADOPTION.md`, `apps/docs/src/shell/Home.tsx`, `apps/docs/src/guide-parts.tsx`, `apps/docs/src/guides*.tsx`, `apps/docs/src/site/**` | design:design-critique, ui-ux-pro-max:design-system, documentation-and-adrs, design-control-loop, modern-web-guidance:modern-web-guidance | UX Architect, UI Designer, Evidence Collector, Reality Checker | sonnet, high | every adopted pattern traced to a BENCHMARK.md row; README quick start verified from a clean install (after WP1); first-run flow screenshotted at 375 and 1280 px; `npm run build`, `test:docs`, `npm run check` pass |

Dependency order:

1. Wave 1 (parallel, no shared files): WP1, WP3, WP4.
2. Wave 2: WP2 (after WP4 merges tokens and focus rules, so component CSS uses them; after WP3 gives the failing tests to fix).
3. Wave 3: WP6 (needs `docs/BENCHMARK.md` and WP1's clean-install proof) and WP5 (last, so docs describe the final state; WP5 also passes the `llms`/registry regenerate request to the maintainer). WP5 and WP6 split `apps/docs` by the globs above and run in parallel; WP6's README quick start must match WP1's tested install path.
4. WP count is 6, one over the original cap of 5, because the owner asked for the adoption package.

Shared-file notes: a package that needs a token adds a component-scoped custom property and reports it (AGENTS.md rule 3); WP2 owns `packages/css/src/components/**` while WP4 owns the shared CSS files; `packages/css/package.json` belongs to WP1.

## D. Final verification

Run on the merged branch, from a clean `npm ci`:

| Step | Command or agent | Proves |
|---|---|---|
| 1 | `npm run check`, `npm run build`, `npm run size`, `npm run test:cli`, `test:mcp`, `test:tokens`, `test:release`, `npm run test:docs -w docs` | all gates green (baseline above) |
| 2 | `npm run e2e`, `npm run ax`, `node scripts/audit.mjs`, `node scripts/audit.mjs --visual` | real-browser results, 0 axe violations |
| 3 | `node packages/tokens/scripts/build.mjs && git diff --exit-code packages/tokens/dist`; `npm run registry && git diff --exit-code registry llms.txt llms-full.txt` | generated files up to date (as CI does) |
| 4 | install-smoke in 4 starters with React 18 and 19 | library works as installed |
| 5 | Skill `superpowers:verification-before-completion` on each WP before it reports done | no claim without command output |
| 6 | Agent Reality Checker on the final diff and the output of 1-4; agent Evidence Collector for screenshots | independent "NEEDS WORK" default must be overturned with evidence |
| 7 | Agents react-reviewer and typescript-reviewer on WP1 and WP2 diffs | code review |

## E. Open questions for the owner

| # | Decision | Recommended |
|---|---|---|
| E1 | Publish to npm now (0.4.0 plus tokens), or after WP1 and WP3? Agents will not publish | After WP1 (matrix and install tests) |
| E2 | Who runs the manual NVDA/JAWS/VoiceOver pass (F4)? Agents cannot | You, with the script WP3 prepares |
| E3 | Add ESLint with `jsx-a11y`, or keep the custom check scripts (F15)? | Add ESLint, a11y rules only, to keep churn small |
| E4 | Add aliases for the prop-name inconsistencies in `docs/api-audit.md` section 4 (F18)? | No for now; breaking-risk for little gain |
| E5 | Align stylesheet breakpoints to `--bp-*` (F16)? It changes tablet layouts | Skip until a real user asks |
| E6 | Figma component kit (roadmap 3.5) and a blog starter (3.1): in scope? | Out of scope this round |
| E9 | Browser support policy (e.g. Baseline widely available only, or newly available with fallbacks)? Decides how far M1-M8 go; the guides default to Baseline widely | Baseline widely, plus feature-detected enhancements with the current JS as fallback |
| E8 | Ship an `npm create monoline` starter, or only `npx monoline init` plus cloneable starters (G3)? | Cloneable starters first |
| E7 | Raise size budgets (CSS 20 KB, Everything 100 KB) or cap component count? | Raise by about 5%, and write the policy in `docs/decisions` |
