# Roadmap: from a working kit to a library people choose

Last updated 2026-11-20. Status is checked against this tree (measured 2026-11-20). Detail on gaps and owners: `docs/IMPROVEMENT-PLAN.md`. Why we made big choices: `docs/decisions/`.

## Where we are

| Area | State | Evidence |
|---|---|---|
| Components | 136 components and 23 hooks | `registry/index.json` (159 entries) |
| Tests | 1,467 unit tests with axe and keyboard checks; every demo renders in a test | `npm test` |
| Real-browser checks | axe, overflow and console errors on every docs page in 3 themes at desktop and 375 px; e2e suite in Chrome (`scripts/e2e/tests`); Firefox and WebKit smoke (`scripts/e2e/cross-browser`) | `scripts/audit.mjs`, `scripts/e2e` |
| Look options | 8 accents, 3 fonts, 3 corner styles, 3 densities, RTL | `packages/css/src/options.css`, `docs/rtl.md` |
| Accessibility proof | axe and an accessibility-tree check for 41 components (0 fail, 10 open findings). No NVDA, JAWS, VoiceOver or TalkBack run by anyone | `docs/a11y-report.md` |
| Docs | page per component, search, playground, themes, blocks, compare | `apps/docs` |
| AI-readable | `meta.json`, `registry/`, `llms.txt`, `llms-full.txt`, Markdown per page, MCP server, `AGENTS.md` | generated |
| Size | Button 0.7 KB gzip, Dialog 1.8, Select 5.4, everything 98.5 of 100; all CSS 20.6 of 21. `npm run size` passes | `npm run size`, `docs/bundle-report.md`, ADR 0002 |
| Published | npm has `@monoline/css`, `@monoline/react`, `@monoline/mcp` and `monoline` at 0.4.0; `@monoline/tokens` returns 404 (never published). This tree is 0.5.0, not published | `npm view <pkg> version` on 2026-11-20 |
| Used by anyone | no evidence | n/a |

## What we compete on

MUI, Ant Design, Mantine and shadcn/ui have years of community. We compete on a few things and then earn trust:

1. **Small.** Plain CSS, no runtime styling, per-component bundles.
2. **Accessible, with proof.** Axe and real-browser audits in CI. Assistive-technology results are still missing (Phase 4).
3. **AI-first.** Registry, `llms.txt`, Markdown per page, MCP server, a CLI that copies source.
4. **One themeable identity.** Monospace and thin rules by default; font, corners, density and eight accents on one switch.
5. **Copy or install.** Both routes from the same source.

Skip on purpose: 3D, WebGL and glow effects; enterprise-only widgets (Transfer, Cascader, Watermark) until someone asks; Tailwind as a dependency.

## Phase 0: ship it safely

| Step | Status | Evidence |
|---|---|---|
| 0.1 Per-module build and size budget | done | `scripts/size.mjs`; budgets raised on purpose (all CSS 21 KB; Tooltip, Popover, DropdownMenu +0.2 KB for anchor positioning), see ADR 0002 |
| 0.2 Green CI on GitHub | unverified | workflows exist in `.github/workflows`; run history not read |
| 0.3 Publish to npm with provenance | open | workflow, `scripts/release.mjs` and a release dry run exist; the owner decides when to publish. `@monoline/tokens` has never been published |
| 0.4 Clean installs in Vite, Next.js, Astro, Remix | done | `npm run install-smoke` (`scripts/install-smoke/run.mjs`), `examples/starters/{vite,next,astro,react-router}`. A React Router starter stands in for Remix |
| 0.5 React 18 and 19 matrix | done | `react-matrix` job in `.github/workflows/ci.yml` (run history not read) |
| 0.6 Real-browser interaction tests | partial | `scripts/e2e` runs in Chrome. Firefox and WebKit run a smoke test only (`scripts/e2e/cross-browser/smoke.mjs`) |
| 0.7 CSS split with `@layer` | done | `core.css` plus per-component files; layers added in `packages/css/scripts/bundle.mjs` (ADR 0003) |

## Phase 1: make it consistent

| Step | Status | Evidence |
|---|---|---|
| 1.1 API audit | done | `docs/api-audit.md`; prop-name aliases left out on purpose |
| 1.2 State attributes | partial | rule in `AGENTS.md`; `packages/react/src/api-consistency.test.tsx` covers some |
| 1.3 Slot and class naming | partial | rule in `AGENTS.md`; not audited page by page |
| 1.4 Token completeness | done, unreleased | `CHANGELOG.md` Unreleased; forced-colors and more-contrast tokens in `packages/css/src/utilities.css` (ea6b4e5). The `--bp-*` tokens are not used by any media query |
| 1.5 Behaviour parity with WAI-ARIA | partial | `docs/a11y-report.md` lists open findings |
| 1.6 Bug sweep | partial | tooltip no longer closes on focus scroll, context-menu demo trigger is a button, Drawer close has a test (43f5096). Combobox no longer opens on focus alone and toast focus proxies left the Tab order. Open Chrome re-test of `docs/e2e-findings.md` is not done |
| 1.7 Docs playground | done | `apps/docs/src/page/playground.tsx` |

## Phase 2: fill the real gaps

Done: date range picker, range calendar, time field, tour, resizable panels, mentions, tree select, overflow list, copy button, image gallery, notification, sortable list, virtual list, app shell (`sidebar`, `navbar`, `app-shell`, `page-header`). All are under `packages/react/src/components`.

Open: tests against react-hook-form and TanStack Form (no test workspace).

## Phase 3: ecosystem

| Step | Status | Evidence |
|---|---|---|
| 3.1 Templates | done, no blog starter | `examples/{dashboard,auth-settings,landing}` |
| 3.2 Blocks gallery | done | `apps/docs/src/site/Blocks.tsx` |
| 3.3 MCP server | done | `packages/mcp`, `docs/mcp.md` |
| 3.4 Theme presets and builder | partial | `apps/docs/src/theme-builder.tsx`, `site/Themes.tsx` |
| 3.5 Figma kit | partial | variables only: `packages/tokens/dist/figma-variables.json`. No component kit |
| 3.6 Editor support | partial | `packages/vscode/snippets`; no props autocomplete |
| 3.7 Versioned docs, changelog, migration guides | partial | changelog notes breaking changes; no versioned docs or migration page |

## Phase 4: earn trust

- Manual screen-reader testing on the core 15 components: not started. Needs the owner; the script is in `docs/screen-readers.md`.
- Benchmark page: `apps/docs/src/site/Compare.tsx` exists. The written benchmark is `docs/BENCHMARK.md`, the plan that follows from it `docs/STRATEGY.md`.
- Governance: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` exist. No RFC process; decisions go in `docs/decisions/`.
- Real users: no evidence yet. Dogfood first, then three outside projects.

## Platform enhancements

Newer browser features are used behind detection with the old code as fallback (ADR 0004).

| Item | Status | Evidence |
|---|---|---|
| CSS anchor positioning for floating layers | prototype, opt-in (`data-anchor="native"` on `<html>`); off by default because a Select near the viewport edge shrank instead of flipping | `nativeAnchor()` in `packages/react/src/components/popover/float.tsx` (e2eb539, 6d8ea26); applies collision padding at viewport edges and reports the flipped `data-side`. Tooltip, Popover and DropdownMenu budgets were raised 0.2 KB for it (dde5ece) |
| Find in page for closed Accordion and Collapsible | done | `packages/react/src/utils/until-found.ts` (43f5096, ADR 0005) |
| Scroll-driven animation, `@starting-style`, container queries, `interpolate-size` | not started | no uses in `packages/css/src` or `packages/react/src` |

## Quality gates

- `npm run check`: CSS lint (contrast, raw colours, motion), doc comments on every prop, registry, typecheck, tests
- `npm run size`: per-component and CSS budgets
- `node scripts/audit.mjs`: real-browser axe, overflow, console errors; `--visual` compares screenshots on pull requests

## Measures of success

| Measure | Target |
|---|---|
| One Button, gzip | at most 2.5 KB (now 0.7) |
| Typical 10-component app, gzip | JS under 25 KB, CSS under 10 KB |
| Axe violations across all pages, themes and accents | 0, in CI |
| Clean install works in Vite, Next.js, Astro, Remix | all four, in CI |
| Every component documented: install, usage, API, accessibility, styling | 100 percent |

## Risks

- **Solo maintenance.** 159 units is a lot to keep correct. Mitigation: the gates above, and no component without tests and a demo.
- **Trust.** Nobody adopts an unproven kit. Mitigation: publish audit results, ship templates, dogfood.
- **Size budgets.** All CSS is near its 21 KB budget, so a new component can fail `npm run size`. Raise a budget only on purpose.
- **Radix drift.** Many components still use Radix (the list is in `docs/bundle-report.md`). Mitigation: React 18 and 19 matrix in CI, and dependency updates in CI.
