# Current-state audit (M0)

Milestone M0 of [MISSION.md](../MISSION.md). Taken 2026-11-24 on branch `audit/m0-baseline` from `origin/master` 932c1ae. Read-only except for the two housekeeping changes listed at the end.

Evidence is tagged `verified: <command>` (run in this audit) or `unverified`. Verdicts: **keep**, **improve**, **replace**, **remove**. Cost: S (hours), M (a day or two), L (more).

## Summary

Monoline is further along than a rebuild brief assumes. Every root script passes: the packages build, 136 components pass their tests and axe checks, 125 e2e flows pass, size budgets hold, the packed packages install and render in seven framework/React combinations, and the release script is safe. M0 found no reason to replace the core decisions: plain CSS with build-time cascade layers, the per-component recipe, and React plus a shrinking set of Radix primitives.

The work ahead is hardening, not rebuilding. The five findings that matter most:

1. **Scoped theming is partial.** Derived tokens (`--rule`, `--wash`, `--ink-*`, `--focus-ring`, `--control-*`) resolve only on `:root`. A `data-theme`, `data-accent` or `data-density` on a wrapper element changes the base tokens but not these. Evidence: `packages/css/src/tokens.css:69+`, and the workaround at `apps/docs/src/docs.css:204`.
2. **The CLI and MCP read the registry from GitHub `master`, not from the installed version.** Evidence: `packages/cli/src/cli.mjs:8`, `packages/mcp/src/registry.mjs:6`. A 0.5.0 CLI copies whatever is on master that day.
3. **`monoline add` fails on the second component that shares a util.** `cli.mjs:255-256` refuses when `utils/cx.ts` already exists, even if the file is identical, and `--overwrite` replaces local edits. Found by reading the code; `unverified` by running.
4. **Published tooling is untyped JavaScript.** The CLI and MCP ship as `.mjs` with no `checkJs`. About 70 tooling scripts are `.mjs`. Node does not strip types under `node_modules`, so a TypeScript port of these packages must ship compiled JS.
5. **CI rebuilds about 16 times per push and skips three test suites.** `test:tokens`, `test:docs -w docs` and the vscode tests never run in CI.

## Baseline: every root script

Run locally on Node 26.10.0 / npm 11.19.1 (CI uses Node 22). `verified: npm run -s <script>` for each row.

| Script | Result | Time | Notes |
|---|---|---|---|
| `check` | pass | 71s | CSS lint, doc comments, registry, typecheck, all unit tests |
| `build` | pass | 29s | css, react, docs |
| `size` | pass | 2s | all budgets under limit |
| `test:mcp` | pass | 6s | 36 tests |
| `test:cli` | pass | 1s | 21 tests |
| `tokens` | pass | 1s | |
| `test:tokens` | pass | 0s | not run in CI |
| `test:release` | pass | 1s | |
| `check:package-types` | pass | 1s | not run in CI as its own step (install-smoke runs it) |
| `test:css-browser` | pass | 11s | 628 computed-style checks across 3 themes and 3 font looks. Needs Chrome outside the sandbox |
| `e2e` | pass | 163s | 125/125 flows. Needs Chrome outside the sandbox |
| `ax` | pass | 34s | 42/42 components, 4 known findings listed in `docs/a11y-report.md`. Needs Chrome outside the sandbox |
| `install-smoke` | pass | 246s | 7/7: Vite, Astro and React Router on React 18 and 19, Next on React 19. Astro needs to run outside the sandbox (it writes `~/Library/Preferences/astro`) |
| `cli` (no args) | pass | 1s | prints help |
| `dev` | not run | | long-running server; the docs build above covers it |

## Area verdicts

| Area | Current decision | Evidence | Verdict | Cost | Notes |
|---|---|---|---|---|---|
| Repository structure | npm workspaces `packages/*`, `apps/*`; css, react, tokens, cli, mcp, docs | `verified: package.json` per package | improve | S | `packages/vscode` has no package.json, so it is not a workspace and its test runs nowhere. `@monoline/tokens` is private and has `types` but no `"."` export. Stay on npm workspaces: no measured need for turbo or nx. |
| TypeScript | `strict` everywhere. react adds `noUncheckedIndexedAccess`, `noUnused*`, `verbatimModuleSyntax`. docs has only `strict`, yet type-checks the react demos | `verified: read every tsconfig` | improve | M | `exactOptionalPropertyTypes` is off everywhere. Estimate if enabled: tens to low hundreds of errors (691 optional props, 3 with `\| undefined`; 331 prop forwards), mostly fixed by adding `\| undefined` to Monoline's own props. Consumers who enable the flag need that change in the emitted `.d.ts` anyway. `unverified`: Radix prop types under the flag. |
| Build and package outputs | Vite `preserveModules` ESM + CJS; `emit-cts.mjs` rewrites `.d.ts` into `.d.cts` with regexes; `bundle.mjs` adds cascade layers | `verified: read vite.config.ts, emit-cts.mjs, bundle.mjs` | keep | — | The regex rewrite is fragile but covered: install-smoke runs `check-package-types.mjs` under Node16 CJS and ESM. |
| Exports and package metadata | react: exports, types, `sideEffects:false`, react 18/19 peers. css: exports with `./src/*` public | `verified: package.json dump` | improve | S | No package exports `./package.json`. css exporting `./src/*` makes the unlayered source public API. react declares `radix-ui ^1.4.2` but the lock resolves 1.8.1, so the declared minimum is never tested. |
| Styling | Plain CSS, 135 unlayered source files, layers added at build, flat unprefixed class names | `verified: grep -rn "@layer" packages/css/src` → 0; raw hex outside tokens.css → 0 | keep | — | Token discipline is clean. Per-component CSS files get `@layer monoline.components` without the layer-order statement, so importing one before `core.css` puts components below base (`bundle.mjs:32`). Generic names (`.muted`, `.display`, `.prose`) can collide with app classes. |
| Tokens | `tokens.css`, `accents.css` and `options.css` are the only place tokens are written. `@monoline/tokens` generates from them. 90 custom properties | `verified: packages/tokens/scripts/build.mjs:12` | improve | S | Two parsers (`packages/css/scripts/build.mjs:31-40` and `packages/tokens/scripts/lib.mjs`) produce different `tokens.json` files. Keep CSS as the source; delete one parser. DTCG JSON as the source is an M2 question, not an M0 finding. |
| Theming | Themes override semantic tokens directly; accents are `[data-accent]×[data-theme]` pairs; no primitive layer | `verified: tokens.css:9-67, accents.css` | improve | M | Finding 1 above. Also: the `orange` accent repeats the theme defaults, and in midnight it is lime `#AAFF00`; `data-density` does not re-derive `--control-*`. |
| SSR theme init | `themeScript()`: inline IIFE, allowlisted values, storage in try/catch | `verified: theme-provider/theme-script.ts` | keep | — | `docs/ADOPTION.md:46` still lists this as a bug. It is fixed. |
| Component API | 141 exported components | `verified: node scan of every component file` | keep (improve) | S | forwardRef 137/143 (the six without are providers and helpers), default exports 0, `as` prop 0, `asChild` 27. Icon-only `aria-label` is required at type level in 15 files. Gaps: handler names outside the documented trio (`onPageChange`, `onIndexChange`, `onSelectionChange` vs `onSelectedIdsChange`, ...); controlled/uncontrolled pairs missing in `file-upload`, `image-gallery`, `resizable`; `data-grid` `selectedIds` vs `data-table` `selection`. |
| State attributes | Mix of `data-state`, `[open]`, `aria-selected`, `aria-checked`, `data-highlighted`, `data-disabled` | `verified: grep counts` | improve | S | The mix is fine; it needs writing down as a contract in AGENTS.md (M3). |
| Inert affordances | — | `verified: read notification-center.tsx:56-57` | improve | S | "Mark all read" and "Clear all" always render but call optional handlers, so they can do nothing. The grep used only finds `onClick={handler}`, so there may be more. `narrow-react-prop-types` in M3. |
| Accessibility | vitest-axe per component, generated AX report, runtime audits, manual screen-reader script | `verified: npm run ax` 42/42 pass, 4 known findings in `docs/a11y-report.md` | improve | M | Open: toast/toaster Radix focus proxies (T1/C9), portal outside landmark (N7, best practice). The manual screen-reader results table in `docs/screen-readers.md` is empty. The moved audits name files that no longer exist (`tab-out.ts`, `leavesPanel`); the fix landed as `useDismiss`. |
| Radix | 22 files import `radix-ui` (21 components + `utils/direction.ts`) | `verified: grep -rlE "from ['\"]radix-ui" packages/react/src` | replace (partial) | M–L | See the Radix table below. About 12 components are small replacements. Toast is the only one carrying an open a11y finding. |
| Docs site | Vite SPA with prerender; components and hooks found automatically; props tables from the TS compiler | `verified: apps/docs/src/shell/registry.ts`, `gen-props.mjs` | improve | S | 156 of 159 entries have props; `alert-dialog`, `kbd` and `shimmer-button` don't, because aliased prop types fail and `gen-props.mjs` swallows the error (`catch {}`). Guide snippets are strings, not type-checked. No versioned docs. |
| docs/ folder | 18 top-level files plus research/, about 300 KB | `verified: git grep for references` | improve | M | Plans overlap. Per-file verdicts below. |
| CLI | One 273-line zero-dep `.mjs`; add, list, search, info, diff, update, init; 21 tests | `verified: npm run test:cli; node packages/cli/bin/monoline.mjs list` → 159 rows | improve | M | Findings 2 and 3. Also: names aren't validated (`info ../package --registry registry` loads the root package.json and crashes, `verified`); a malformed `monoline.json` throws uncaught (`cli.mjs:153`); `update` doesn't add newly needed siblings or remove dropped files. |
| Registry and llms files | 160 JSON (2.3 MB), `llms.txt` 34 KB, `llms-full.txt` 251 KB; CI fails on drift | `verified: wc -c; ci.yml:26-27` | keep (improve) | S | Absolute URLs. `llms-full.txt` already has one `## ` section per unit (160, median 1.4 KB), so it chunks cleanly. Per-component JSON has no `version` field. |
| MCP server | Hand-written JSON-RPC over stdio, no SDK, 6 tools, 36 tests | `verified: npm run test:mcp` | improve | M | Finding 2. It also prefers any `./registry/index.json` in the user's working directory over its own, without saying so (`registry.mjs:15`). |
| AI instructions | CLAUDE.md points to AGENTS.md; AGENTS.md is canonical | `verified: grep checks of each claim` | improve | S | The two Radix claims in AGENTS.md hold. Stale: the package table leaves out mcp, tokens and vscode; "generated files committed only by the maintainer" contradicts CI, which makes every PR regenerate them; `direction-provider` breaks "all five files" (no test file). `docs/agent-brief.md` and `docs/skill-legacy/SKILL.md` contradict AGENTS.md and point to paths that don't exist. |
| Unit tests | Vitest + jsdom + vitest-axe; `all-demos.test.tsx` renders every demo | `verified: npm run check` | keep | — | 135 of 136 component folders complete. No coverage config. |
| Browser tests | Chrome e2e and audits over a hand-written CDP client; Playwright smoke (5 flows) on Firefox and WebKit; `audit.mjs --visual` keeps screenshot baselines | `verified: read .github/workflows/*.yml, scripts/audit.mjs` | keep (improve) | M | Visual regression exists in `audit.mjs --visual`. MISSION.md's "no visual regression" is wrong; M6 evaluates this script against Playwright screenshots instead of starting from zero. Cross-browser coverage is thin. |
| CI | 5 workflows on Node 22; React 18/19 matrix; install-smoke | `verified: read workflows` | improve | M | About 16 full builds per push (audit across 8 accents, e2e, ax, ci); build once and share the artifact. No `permissions:` or `timeout-minutes` outside release. No dependabot or renovate. Missing suites: `test:tokens`, `test:docs`, vscode. |
| Node support | CI 22; cli and mcp declare `engines >=20` | `verified: grep for post-20 APIs` | improve | S | No shipped code needs more than Node 20, but 20 is EOL and CI never tests it. Move to `>=22` with a 22/24 matrix; add `.nvmrc`. |
| Release | `scripts/release.mjs` check, version, publish `--dry-run \| --yes`; workflow_dispatch with provenance | `verified: read release.mjs:388-422; npm run test:release` | keep | S | Safe: dry-run and yes are exclusive, `--yes` needs `npm whoami` and a clean tree, published versions are skipped. Gaps: a partial publish can't be rolled back; uses a long-lived `NPM_TOKEN` rather than trusted publishing (`unverified` whether available). |
| Dependencies | react 19.3.1, typescript 5.9.3, vite 7.3.8, vitest 3.2.7, radix-ui 1.8.1, vitest-axe 0.1.0 | `verified: package-lock.json` | improve | S | Undeclared imports: `esbuild` in `scripts/size.mjs` and `packages/css/scripts/check-layers.mjs`, `typescript` in docs scripts. `vitest-axe` 0.1.0 is old (`unverified` whether maintained). |

## Radix, per component

| Component | Primitive | Own replacement | Recommendation |
|---|---|---|---|
| sidebar | Slot | `utils/slot.tsx` | replace (S) |
| direction-provider, `utils/direction.ts` | Direction | a small context | replace (S) |
| aspect-ratio | AspectRatio | CSS `aspect-ratio` | replace (S) |
| separator | Separator | `<hr>` / `role=separator` | replace (S) |
| label | Label | native `<label>` | replace (S); loses the double-click selection guard |
| progress | Progress | `<progress>` or `role=progressbar` | replace (S) |
| toggle | Toggle | `<button aria-pressed>` | replace (S) |
| switch | Switch | `<button role=switch>` | replace (S); rebuild the hidden form input |
| checkbox | Checkbox | native input + `indeterminate` | replace (S–M); keep the `'indeterminate'` value |
| avatar | Avatar | img `onError` + load state | replace (S); loses `delayMs` |
| collapsible | Collapsible | `until-found` + controllable state | replace (M); ADR 0005 and 0007 rely on `forceMount` |
| accordion | Accordion | `<details name>` + until-found | defer (M); ADR 0005 rejected this, needs a new ADR |
| radio-group | RadioGroup | native radios | replace (M) |
| tabs, toggle-group, segmented-control, toolbar | Tabs, ToggleGroup, Toolbar | none shared yet | first extract one roving-focus hook from `menu.tsx`, `tree.tsx`, `data-grid.tsx` (M) |
| slider | Slider | `input range` is single-thumb | keep; range mode needs two thumbs |
| scroll-area | ScrollArea | native overflow + `scrollbar-*` | evaluate (S) |
| toast | Toast | none | replace (L); carries the open a11y finding |
| navigation-menu | NavigationMenu | `float.tsx` + menu | keep for now (L) |

## Architecture: deepening candidates

Found with the improve-codebase-architecture method: hot spots from `git log --oneline -300 --name-only` (2026-11-12 to 11-24), then the deletion test. Vocabulary from `codebase-design`.

1. **Floating layer. Strong.** `popover/float.tsx` (12 commits) and its five callers (tooltip, hover-card, menu, popover, select) each wire `Floating`, `useHydrated` and `useDismiss` together; two also wire `useHoverIntent`. The interface leaks the hydration and dismissal protocol to every caller. `place()` and `placeNative()` are two adapters, so the seam is real. Deepen into one module that owns open state, dismissal, hydration and placement. Consistent with ADR 0001 and 0006.
2. **Field control wiring. Worth exploring.** `field/field.tsx` exports `useFieldControl` (18 callers), `invalidAttrs` (14), `hiddenInputs` (9) and `useFieldLabelId`. Folding the helpers into `useFieldControl` gives each control one call and concentrates the complexity.
3. **Registry entry contract. Worth exploring.** One producer (`gen-registry.mjs`, `registry-fields.mjs`), three consumers (CLI `load()`, MCP `registry.mjs`, `check-registry.test.mjs`), two separate fetch-or-file loaders, no shared schema. The M1 TypeScript port is the place to add one. Constraint: CLI and MCP stay zero-dependency.
4. **Listbox keyboard and typeahead. Speculative.** select, combobox, multi-select, tree-select and command each have their own `onKeyDown`. Revisit when M3 moves collections off Radix.

## docs/ folder

| File | Verdict | Why |
|---|---|---|
| ROADMAP.md | keep | The single living plan |
| STRATEGY.md | archive | Move §9 (1.0 criteria) and §13 (platform features) into ROADMAP or ADRs first |
| IMPROVEMENT-PLAN.md | archive | 0.4.0-era; this audit replaces it |
| ADOPTION.md, BENCHMARK.md | archive | Already marked historical; update the README and `guides-start.tsx` references |
| agent-brief.md | remove | After folding its gotchas into AGENTS.md; contains stale claims |
| skill-legacy/SKILL.md, legacy-index.html | remove | Nothing references them; dead paths |
| research/ | archive | Frozen 2026-11-12; `Compare.tsx` cites `synthesis.md`, `build-matrix.mjs` generates `coverage-matrix.md` |
| mcp.md | consolidate | Into `packages/mcp/README.md` |
| api-audit.md, dogfood-log.md | archive | Update the comments in `check-duplicates.mjs` and `css-computed.mjs` that cite them |
| a11y-report, e2e-findings, screen-readers, bundle-report, css-modules, releasing, rtl | keep | Referenced by CI or scripts |

## Other defects

- `.claude/.sb-nudged` is tracked in git.
- `packages/react/src/components/.claude/.cc-writes`: an empty, untracked folder left by a tool, which the folder-scanning generators read.
- `packages/css/src/tokens.css:1`: the header still says "@personal/ui tokens … portfolio and loadout".
- `packages/css/src/components/toaster.css:9` depends on `--radix-toast-swipe-move-x`.
- `packages/tokens/package.json` has no `repository` field.

## For the user to clean up (left untouched)

- `.claude/worktrees`: 68 directories, 12 GB; `git worktree list` shows 69 entries.
- 109 local branches, 91 already merged into master; 61 remote branches.

## Tooling and skills for later milestones

- `mattpocock-skills:improve-codebase-architecture` is installed but marked `disable-model-invocation: true`, so only the user can run it. M0 applied its method through an audit agent instead.
- `wcag-accessibility`, `documentation-and-adrs`, `api-and-interface-design`, `gsap-react` and `site-architecture` are symlinks into `~/.agents/skills`, which the sandbox blocks for direct reads; invoke them through the Skill tool.
- Searching or installing from skills.sh needs `NODE_USE_ENV_PROXY=1`.
- The Chrome-based scripts (`e2e`, `ax`, `test:css-browser`) can't launch Chrome inside the sandbox; run them outside it.

## Changes made in M0

- `.gitignore`: `audit/` → `/audit/`. The unanchored rule also ignored `docs/audit/`, which would have left this file untracked. The root `audit/` folder is the screenshot output of `scripts/audit.mjs`.
- Moved `AUDIT-C-a11y.md` → `docs/audit/a11y-audit-c.md` and `AUDIT2-a11y.md` → `docs/audit/a11y-audit-2.md`. Nothing linked to them.
