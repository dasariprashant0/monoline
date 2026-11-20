# Monoline strategy: how it becomes a kit people choose

Written 2026-11-20 from [BENCHMARK.md](BENCHMARK.md) and the repo as it stands on branch `claude/ds-benchmark-5b768f`. It is for two readers: a human deciding what to fund, and an AI agent picking a task. Every task has an ID, an owner area, an effort, and a test for "done", so either reader can act without asking.

How this fits with other docs:

| Doc | Role |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Component and quality phases. Still correct in most places; two lines are stale (see section 4, item F1). This file does not replace it. |
| [BENCHMARK.md](BENCHMARK.md) | The evidence: 13 listed libraries plus 9 extra, with links. Every claim here that cites a competitor comes from there. |
| [../AGENTS.md](../AGENTS.md) | Rules for building. This file never overrides it. |
| `docs/IMPROVEMENT-PLAN.md` | Written by the sibling audit session (`ds-recon`). Not present on this branch when this was written. If it exists when you read this, reconcile the two and keep one task list. |

Words marked **(proposal)** are decisions for the owner. Numbers marked **(target)** are goals, not measurements.

---

## 1. The honest position

**Monoline will not beat everything.** MUI, Ant Design, Mantine and shadcn/ui have years of users and thousands of fixed issues. Base UI and Radix are installed 30M+ times a week; Monoline had about 300 npm downloads last week ([BENCHMARK §5](BENCHMARK.md)). Trying to win on breadth of trust now would fail.

**Monoline can be clearly the best choice for a defined set of people.** Winning means being the obvious answer to six questions, and being able to prove each answer:

| # | Question a developer asks | Monoline's answer | Who else answers it today |
|---|---|---|---|
| W1 | "Can I get a good-looking, accessible UI with no Tailwind, no provider, no CSS-in-JS?" | One CSS import, plain custom properties, one `data-*` switch per look option | Nobody on the list at this level of coverage. daisyUI and shadcn need Tailwind; MUI, Chakra and Twigs use runtime CSS-in-JS ([BENCHMARK §3](BENCHMARK.md)) |
| W2 | "Can I own the code?" | `npx monoline add`, plus `diff` and `update` to stay current | shadcn (no update path, per the 11-12 research note) |
| W3 | "Will my AI tool build with it correctly?" | `llms.txt`, `llms-full.txt`, `registry/`, MCP package, `AGENTS.md`, per-component `meta.json` | shadcn (MCP, Skills), Mantine, Base UI, HeroUI (llms.txt) |
| W4 | "Can I prove it is accessible?" | axe and an accessibility-tree check on every component in real Chrome, in CI | Nobody publishes this with results. Gap: no human screen-reader results yet (§4, F6) |
| W5 | "Is it small?" | Button 0.7 KB gzip, everything 94.9 KB, dialog on native `<dialog>` | Few publish budgets at all |
| W6 | "Can it look like my brand without a fork?" | 3 themes x 8 accents x 3 fonts x 3 corners x 3 densities, all variables | HeroUI and daisyUI have themes; none has five independent axes with a contrast guarantee |

**Everything in this plan serves one of W1 to W6, or removes a reason someone would leave in the first 10 minutes.** If a task does neither, do not do it.

### What "success" means (target, proposal)

| When | Outcome | How it is measured |
|---|---|---|
| Day 30 | A stranger gets a styled Button and a Dialog in under 5 minutes, on 4 frameworks, checked by CI | `first-run` CI job (task A3) |
| Day 60 | 100 outside installs per week; 3 public projects using it | npm downloads API; GitHub "used by" and issue reports |
| Day 90 | 1,000 weekly downloads; 300 GitHub stars; first outside pull request merged | same |
| Day 180 | 1.0 released with the criteria in §9 met; 10 public projects | same |

These are small on purpose. Twigs, a real company's system, has about 2,200 weekly downloads ([BENCHMARK §5](BENCHMARK.md)); a first-year personal kit reaching 1,000 is a success.

---

## 2. Who we are building for

Pick the user before the feature. Each persona has the one thing that makes them stay and the one thing that makes them leave.

| Persona | Situation | Stays because | Leaves because | Served by |
|---|---|---|---|---|
| **P1 Solo or small-team React dev** | Starting a product, does not want Tailwind or a heavy kit | Styled in 3 minutes, small, looks distinct | Install fails, a component looks broken, no template to start from | A1 to A6, B1, B2 |
| **P2 AI-assisted builder** | Prompts Claude, Cursor or Copilot to make pages | The AI output uses real Monoline components and compiles | AI invents props, or the docs for agents are stale | D1 to D4 |
| **P3 Backend or server-rendered dev** (Rails, Django, Laravel, Go templates) | Wants a CSS file and sprinkles of JS | Classless defaults, CDN link, `monoline.js` | CSS-only story is half documented | C5, C6 |
| **P4 Team lead with an accessibility duty** (EAA, ADA, procurement) | Must show evidence | A public statement with results and known gaps | Claims without proof | F6, E1, E2 |
| **P5 Designer or founder who cares about look** | Wants the brand colour, a different feel | Pick a preset, paste a hex, done | Only one look, or colours that fail contrast | C1 to C4 |

P1 is the first target: the most people, the shortest path. P2 and P3 are the wedge: few competitors serve them. P4 and P5 are the long-term moat.

---

## 3. Where Monoline stands, by axis

From [BENCHMARK §1](BENCHMARK.md). "Gap" is what the plan closes.

| Axis | Today | Best other | Gap | Plan IDs |
|---|---|---|---|---|
| Install friction | `npm i` + one import, no provider. Published 0.4.0 on 2026-11-16 | Mantine templates; shadcn `init` | No starters; first-run not tested in CI | A2 to A4 |
| Theming | 5 `data-*` axes, contrast enforced | HeroUI Theme Builder; shadcn themes | No presets, no brand-colour tool, no auto dark mode (unverified, §4 F8) | C1 to C4 |
| Accessibility | axe and AX-tree per component; keyboard tests | React Aria (reputation); GOV.UK (public statement) | No human screen-reader results; no public statement | F6, E1, E2 |
| Coverage | 135 component folders | Mantine 122 components + 83 hooks | Level. Fill the gaps in ROADMAP Phase 2 | B-series |
| Docs | Per-page examples, props, a11y, search, Markdown | Radix (keyboard tables), Mantine (playground, Styles API), shadcn (install tabs) | Install tabs, keyboard table as a section, styling reference, wider playground | B1 to B6 |
| Customization | Copy or install from one source | shadcn | Add "recipes" and templates | B7, C7 |
| Bundle | Per-module build, budgets | Base UI (tree-shakable) | Ahead. Keep the budgets | E3 |
| TypeScript | Doc-comment gate, typed props | All | Level | none |
| Dark mode | 3 themes | daisyUI (`prefersdark` flag), shadcn | Auto mode unverified | F8, C2 |
| Motion | Reduced-motion zeroed | Magic UI (as product) | No motion tokens, no `data-motion` | C3 |
| Versioning | 0.x, CHANGELOG | Carbon, Ant (release discipline) | No migration guides, no deprecation policy | E4 |
| Community | New | everyone | Everything. Mostly time, plus pattern 2 and the first-outside-PR path (E5) | A, E |

---

## 4. Fix what exists first

Do these before adding anything. A new user who hits a broken component never sees the new features.

Sources: [e2e-findings.md](e2e-findings.md), [dogfood-log.md](dogfood-log.md), [api-audit.md](api-audit.md), [a11y-report.md](a11y-report.md), [ROADMAP.md](ROADMAP.md), plus counts checked on 2026-11-20.

| ID | Problem | Evidence | Fix | Effort | Owner area | Done when |
|---|---|---|---|---|---|---|
| F1 | **Docs disagree with each other.** README says 129 components and hooks; ROADMAP says 114 + 23 (137); the folder listing has 135. ROADMAP still says "not on npm yet", but 0.4.0 is published | `README.md`, `docs/ROADMAP.md`, `ls packages/react/src/components` | Generate every count from `registry/index.json` in README, ROADMAP and docs home; fix the npm line | S | core | one script prints the counts; a CI check fails if README differs |
| F2 | **Context menu has no keyboard path in its demo** (promised Shift+F10, but the trigger is a non-focusable `div`) | e2e-findings "Not fixed" | Demo with a focusable trigger; one sentence in the docs | S | overlays | keyboard test opens the menu with Shift+F10 |
| F3 | **Drawer demo has no visible close control** on touch | e2e-findings | Add `DrawerClose` to the demo, or a default close in `DrawerContent` (add prop, do not change existing) | S | overlays | axe plus a test that a button closes it |
| F4 | **Tooltip closes when Tab scrolls its trigger into view** (Radix closes on scroll; seen with scripted focus only) | e2e-findings | Reproduce with real Tab in a long page; if real, keep the tooltip open while the trigger has focus | M | overlays | e2e test: Tab to a trigger below the fold keeps the tooltip |
| F5 | **Combobox opens on focus**, unlike the APG default | e2e-findings | Decide: open on typing or Down (APG), or document. **(proposal)** follow APG | S | forms | test and `meta.json` a11y line match the decision |
| F6 | **No human screen-reader test has been done**, and the report says so | a11y-report.md "What this is, and what it is not" | Test the 15 core components with NVDA+Firefox, JAWS+Chrome, VoiceOver+Safari, TalkBack. Publish results, including failures | L | a11y | results added to the existing [screen-readers.md](screen-readers.md): date, versions, per-component pass/fail |
| F7 | **Cascade bugs are class-of-bug, not one-offs** (Grid, Heading, selected hover). A duplicate-selector check and a browser computed-style test now exist | dogfood-log "Same root cause: resolved" | Extend `scripts/css-computed.mjs` for every new component; keep `check-duplicates.mjs` in `npm run check` | S, ongoing | css | each new component adds one computed-style assertion |
| F8 | **Auto dark mode is not provided** (unverified): a grep for `prefers-color-scheme` in `packages/css/src` found none | grep on 2026-11-20 | Add `data-theme="auto"` that follows the OS; keep explicit values winning | S | css | Chrome test with emulated dark scheme; contrast check covers it |
| F9 | **API outliers** left on purpose in the audit (`label` vs `aria-label`, `title` meaning, `columns` meaning) | api-audit.md section 1 | Add the consistent name as primary, keep the old as a tested deprecated alias (rule: add, never remove) | M | react | each alias has a test and a deprecation line in the doc comment |
| F10 | **Radix weight remains for 18 components** (tabs 9.6 KB, toast 12.5 KB) | bundle-report.md | Replace only where parity is proven by the existing tests, one at a time. Not urgent; measure first | M, optional | react | size budget drops with no test change |
| F11 | **Visual regressions are only caught by a baseline** that moves with every tap-target change | e2e-findings fix 5 note | Refresh baselines in the same PR as the change; document the command | S | docs | `CONTRIBUTING.md` has the step |
| F12 | **Not all 41 AX-checked components cover the other ~94** | a11y-report "Components checked: 41" | Add AX expectations for the rest, starting with overlays and forms | L | a11y | the report lists all components with a verdict |

Rule while fixing: **add props, never rename or remove** ([AGENTS.md](../AGENTS.md)). Each fix gets a test that fails without it.

---

## 5. The plan, in phases

Each phase has a goal, a list of tasks, and an exit test. Do not start a phase's feature tasks until the previous exit test passes. Tasks inside a phase can run in parallel when their owner areas differ (ownership rules in [AGENTS.md](../AGENTS.md)).

### Phase A: First run must be perfect (days 0 to 14)

**Goal:** a stranger succeeds in 5 minutes, and CI proves it every day.

| ID | Task | Pattern from | Effort | Owner area | Acceptance |
|---|---|---|---|---|---|
| A1 | Fix F1, F2, F3, F8 | n/a | S | core, overlays, css | those four done |
| A2 | **Starter templates**: `examples/starter-vite`, `starter-next` (App Router), `starter-astro`, `starter-remix`. Each imports the CSS once and renders a Button and a Dialog | Mantine templates | M | cli, examples | each builds and passes a Playwright smoke test |
| A3 | **`first-run` CI job**: on a clean runner, follow the README commands verbatim against the published packages, then run the smoke test | all npm libs | S | ci | job green daily; failure opens an issue |
| A4 | **`npm create monoline`** (or `npx monoline create <name> --template vite`) that copies a starter | shadcn `init` | M | cli | one command to a running app in under 2 minutes on a warm cache |
| A5 | **README rewrite for the first 10 minutes**: the checklist in §8, install tabs, a screenshot, a "what you will not get" line | Bootstrap quick start | S | docs | README passes a read-through by someone who has never seen it |
| A6 | **CDN quick start** for CSS-only users: one `<link>` and one `<script>` from a CDN, copy-pasteable | Bootstrap | S | css | an HTML file with no build renders a styled page |
| A7 | **Publish provenance**: npm provenance on `@monoline/css`, `@monoline/react`, `monoline` | all | S | release | provenance badge on npm |

**Exit test:** A3 is green on four frameworks for 7 days in a row.

### Phase B: Docs that sell (weeks 2 to 6)

**Goal:** a visitor can answer "does this fit my project?" and "how do I use it?" from the docs alone.

| ID | Task | Pattern from | Effort | Owner area | Acceptance |
|---|---|---|---|---|---|
| B1 | **Install tabs** on every component page: npm, pnpm, yarn, bun, CLI. Remembered across pages | shadcn, Magic UI | S | docs | selection persists after reload |
| B2 | **Keyboard table and anatomy** as fixed sections on every page, generated from `meta.json` `a11y` and compound parts | Radix, Headless UI | S to M | docs, meta.json | all 135 pages show both; a CI check fails if a component has an empty `a11y` list |
| B3 | **Playground controls** (variant, size, state) above the first example on every component | Mantine | M | docs | controls change the live preview and the copied code |
| B4 | **Styling reference per page**: class names, `data-*` states, tokens the component reads, generated from the CSS | Base UI, HeroUI, daisyUI, Ant | M | docs, css scripts | generated, never hand-written; a CI check fails on drift |
| B5 | **Version, size and source column** on each page | Radix | S | docs | shows gzip size from the bundle report |
| B6 | **"Copy page" and "View as Markdown"** on every page, with the same text agents get | shadcn, Base UI | S | docs | exists in part; make it universal and add a test |
| B7 | **Recipes**: 20 short pages for real tasks (settings form, filterable table, onboarding checklist, confirm-delete, search with command bar). Each is a live example plus the copied code | Mantine, shadcn blocks | M | docs, examples | each recipe has an axe test |
| B8 | **Compare page** honestly listing what each library is better at | none (honesty as differentiator) | S | docs | built from BENCHMARK, reviewed for accuracy every release |
| B9 | **Migration and "coming from" guides**: from shadcn, from MUI, from Bootstrap, from Mantine (prop mapping tables) | Chakra v3 migration lesson | M | docs | each guide maps at least 10 components |

**Exit test:** open any 5 random component pages: each has install tabs, keyboard table, props, styling reference, a playground and copyable code.

### Phase C: Variety and options (weeks 6 to 10)

**Goal:** people with different tastes and stacks can make it theirs, without forking.

Today the five axes are theme, accent, font, corners, density. Add axes and bundles, keep the rule that every combination passes contrast.

| ID | Task | Pattern from | Effort | Owner area | Acceptance |
|---|---|---|---|---|---|
| C1 | **Presets**: named bundles (`paper`, `terminal`, `slate`, `soft`, `editorial`, `brutal`) that set the five axes plus a few token overrides. Ship as `@monoline/css/presets/<name>.css` and as one `data-preset` attribute | daisyUI themes, HeroUI | M | css, docs | every preset passes the contrast check in all component pages; a gallery page shows all |
| C2 | **Colour mode**: `data-theme="auto"` follows the OS; add a `hc` (high contrast) theme and honour `prefers-contrast: more` | daisyUI `prefersdark`, GOV.UK | M | css | contrast at AAA for text in `hc`; a browser test emulates each media feature |
| C3 | **Motion axis**: `data-motion="none \| reduced \| full"` plus motion tokens (duration, easing) | Magic UI (contrast), WCAG | S | css | `none` removes all transitions; tokens are documented |
| C4 | **Brand-colour tool**: `npx monoline theme --accent "#ff5a1f"` outputs a CSS file where the accent passes contrast in all themes by adjusting lightness; also in the docs theme builder | HeroUI Theme Builder | M | cli, css | the output passes `packages/css/scripts/check.mjs`; a test feeds 100 random hex values |
| C5 | **Classless defaults**: bare `button`, `input`, `table`, `dialog`, `details`, `form` look right with only `@monoline/css` loaded, scoped in `@layer monoline.base` so app styles win | Pico CSS | M | css | an HTML page with no classes passes axe and looks designed |
| C6 | **CSS-only behaviours** (`monoline.js`): list the components that need no JS and the few helpers that do; document with plain HTML for each | Bootstrap, Pico | M | css/js, docs | every CSS-only component has a no-framework example |
| C7 | **Page templates**: dashboard, auth, landing, settings, docs, blog, pricing as real apps | shadcn blocks | M to L | examples | each has the first-run smoke test |
| C8 | **Theme builder export**: CSS, JSON tokens, and a Figma tokens file | HeroUI, shadcn | M | docs, tokens | export round-trips: import it, get the same look |
| C9 | **Density and size for data-heavy UI**: a `data-density="dense"` for tables and admin tools | Ant (compact algorithm) | S | css | table row height token at least 24 px target size, per the WCAG bar in AGENTS.md |
| C10 | **More fonts as options**: add system and a second monospace via CSS only, no hosted font requests unless the user opts in | privacy | S | css | no network request without opt-in, checked in a browser test |

Variety rule: **a new option is accepted only if it is one attribute, one CSS file, a gallery entry, and a contrast pass.**

**Exit test:** the gallery shows at least 6 presets x 3 modes; the contrast check passes on every pair; the brand tool succeeds on 100 random hex inputs.

### Phase D: AI and ecosystem (weeks 10 to 16)

**Goal:** the best place to build with an AI tool.

| ID | Task | Pattern from | Effort | Owner area | Acceptance |
|---|---|---|---|---|---|
| D1 | **MCP server** over the registry: list, search, get component with props and a11y, get tokens, get recipe. Document setup for Claude Code, Cursor, VS Code | shadcn MCP, Magic UI MCP | M | `packages/mcp` | a scripted client lists and fetches 5 components; tests in `npm run test:mcp` |
| D2 | **Skills file** (an `AGENTS.md`-compatible skill) that tells an agent how to install, theme, and avoid inventing props | shadcn Skills | S | docs, `llms.txt` | a fresh agent given only the skill builds the settings recipe and `tsc` passes |
| D3 | **`llms.txt` quality bar**: every line links to a Markdown page; `llms-full.txt` stays under a size budget; both regenerate in CI | Mantine, Base UI | S | registry | CI diff check; size budget in `npm run size` |
| D4 | **Prompt gallery**: 10 copyable prompts (build a dashboard, add dark mode, migrate a form) with their expected output | shadcn | S | docs | each prompt is tested by the D2 procedure |
| D5 | **VS Code package**: snippets and prop autocomplete (exists as `packages/vscode`; verify it is published) | Mantine | S | vscode | listed in the Marketplace |
| D6 | **Figma kit**: tokens and components for designers | Ant, Carbon | L | tokens | published, with the same token names as CSS |
| D7 | **Framework recipes**: Rails, Django, Laravel, Phoenix, Hugo, Eleventy: how to use the CSS with their templates | Bootstrap | M | docs | each recipe renders a page in CI (container job) |
| D8 | **Evaluation harness for agents**: 20 build tasks scored automatically (compiles, axe clean, no invented props). Run on each release | none (new) | L | scripts | score published in docs; regressions block a release |

**Exit test:** D8 score at least 90 percent on the 20 tasks with the MCP server and skill, and the number is on the docs home page.

### Phase E: Earn trust, then 1.0 (ongoing, weeks 8 onward)

| ID | Task | Pattern from | Effort | Owner area | Acceptance |
|---|---|---|---|---|---|
| E1 | **Accessibility statement** per release: what is tested, with what, known gaps. Written now, updated as F6 results arrive | GOV.UK | S | docs | page exists and is linked from the footer |
| E2 | **Screen-reader results** (task F6) published | none | L | a11y | per-component results with versions |
| E3 | **Size budgets stay on**: Button at most 2.5 KB, 10-component app JS under 25 KB gzip, CSS under 10 KB | Bundle report | S | ci | `npm run size` green |
| E4 | **Versioning and deprecation policy**: semver after 1.0; a deprecation lasts at least two minors; every breaking change has a migration note | Carbon, Ant | S | releasing | `docs/releasing.md` updated; CHANGELOG has a "Migrate" line per breaking item |
| E5 | **Contributor path**: good-first-issue labels (15 ready), a 10-minute "add a component" guide, a response-time promise (reply within 3 days) | all healthy repos | S | docs | first outside PR merged |
| E6 | **Real users**: dogfood on the owner's own projects; recruit 3 outside projects to try it and log what broke (extend `dogfood-log.md`) | none | M | ops | 3 entries from non-owners |
| E7 | **Governance**: RFC template, maintainers list, security policy, public roadmap board | Carbon, Primer | S | docs | files exist and are linked |
| E8 | **Benchmark page**: Monoline vs others on the same demo app: bundle size, axe score, Lighthouse. Reproducible script, not screenshots | none | M | docs, scripts | script in repo; numbers dated |

---

## 6. Variety map: what a user can choose

This is the menu the docs home page should show. Existing items are real; **new** items are in this plan.

| Dimension | Options today | New (plan ID) |
|---|---|---|
| Install route | npm packages; CLI copy | `npm create monoline` (A4); CDN link (A6) |
| Framework | React; any (CSS only) | starters for Vite, Next, Astro, Remix (A2); server-template recipes (D7) |
| Theme | warm, dark, midnight | auto (C2), high contrast (C2), presets (C1) |
| Accent | 8 | any hex via brand tool (C4) |
| Font | mono, sans, serif | system and second monospace (C10) |
| Corners | square, soft, round | inside presets (C1) |
| Density | compact, comfortable, spacious | dense (C9) |
| Motion | reduced-motion respected | `data-motion` (C3) |
| Style of page | blocks | 7 full templates (C7), 20 recipes (B7) |
| Tokens | CSS variables, `tokens.json` | Figma export (C8, D6) |
| AI tools | `llms.txt`, registry, MCP package | skill, prompts, evaluation score (D2 to D4, D8) |

---

## 7. Metrics: how we know it is working

Measure weekly. Put the numbers in `docs/metrics.md` (new file, one table, one row per week).

| Metric | Type | Source | Why |
|---|---|---|---|
| Time to first working component | leading | `first-run` CI job duration (A3) | friction is the top reason to leave |
| `first-run` pass rate on 4 frameworks | leading | CI | broken install kills adoption |
| Weekly npm downloads of `@monoline/react`, `@monoline/css`, `monoline` | lagging | [npm downloads API](https://api.npmjs.org/downloads/point/last-week/@monoline/react) | real installs |
| GitHub stars, forks, "used by" count | lagging | GitHub API | trust |
| Issues opened by non-owners, median time to first reply | leading | GitHub | contributors stay if answered |
| Axe violations across all pages, every theme-accent pair (ROADMAP says 27; 3 themes x 8 accents is 24, so check which is right), 2 viewports | quality | `npm run audit` | must stay 0 |
| Agent evaluation score (D8) | leading | scripts | AI is a growth channel |
| Bundle sizes vs budgets | quality | `npm run size` | W5 |
| Docs page views per component, search queries with no result | leading | privacy-respecting analytics (**proposal**: Plausible, self-hosted or cookieless) | tells which pages to improve |

Do not track people. No cookies, no third-party scripts on the docs without a decision from the owner.

---

## 8. First 10 minutes: the experience we are building to

This is the acceptance test for Phase A. It repeats the checklist in [BENCHMARK §4](BENCHMARK.md) and adds the pass condition for each step.

| Minute | Step | Passes when |
|---|---|---|
| 0 to 1 | Land on the docs home. See what it is, one screenshot, one install line | the install line copies in one click |
| 1 to 3 | `npm create monoline my-app` (or add to an existing project) | ends with a running dev server, no peer-dependency warning |
| 3 to 4 | See a styled page with a Button | no provider, one CSS import |
| 4 to 5 | Flip `data-theme`, `data-accent`, `data-preset` on `<html>` | whole page re-themes without reload |
| 5 to 7 | `npx monoline add dialog` and open it | Escape closes, focus returns to the trigger |
| 7 to 8 | Open a component page | install tabs, playground, props, keyboard table all visible |
| 8 to 9 | Ask an AI tool, with the MCP server, for a settings page | output compiles and uses real components |
| 9 to 10 | `npm run build`, look at size | a Button-only app adds about 1 KB JS gzip |

---

## 9. 1.0 criteria and versioning

Do not call it 1.0 until every line is true.

| # | Criterion | Check |
|---|---|---|
| 1 | No open High bug from any audit | `dogfood-log.md`, `e2e-findings.md` |
| 2 | F6 and E2 done: human screen-reader results published for the 15 core components | [screen-readers.md](screen-readers.md) |
| 3 | All 135 components have an AX-tree expectation (F12) | report |
| 4 | Migration notes for every breaking change since 0.4.0 | CHANGELOG |
| 5 | Deprecation policy written and used at least once (F9 aliases) | `docs/releasing.md` |
| 6 | 10 public projects use it; 3 are not owned by the author | search and issues |
| 7 | Size budgets met (E3) | `npm run size` |
| 8 | `first-run` CI green for 30 days | CI history |
| 9 | Agent evaluation score at least 90 percent (D8) | docs |

Until 1.0: semver, a minor may change class names, every change listed in [CHANGELOG.md](../CHANGELOG.md). After 1.0: no breaking change inside a major; deprecations last at least two minors.

---

## 10. Risks and when to stop

| Risk | Likelihood | Effect | Mitigation | Stop or change signal |
|---|---|---|---|---|
| **Solo maintenance** (Pico CSS and Polaris are archived on GitHub, see BENCHMARK §5) | High | kit goes stale | Tests and gates; automate counts and docs; E5 and E7 to share load; keep scope to W1 to W6 | No release for 90 days: say so on the README and pause new features |
| **Scope creep** (135 components already) | High | quality drops | No new component without tests, demo, `meta.json`, AX expectation | More than 3 open High bugs: stop features, fix only |
| **Radix dependency** | Medium | slow upgrades, bundle weight | Replace overlays with native elements where proven (done for dialog and menus); keep behaviour tests | A Radix major breaks a component for two weeks |
| **No users** | Medium | wasted effort | Phases A and B first; recruit three outside projects (E6) | At day 90 under 100 weekly installs: re-interview 5 users, drop the persona that does not convert |
| **Accessibility claim overreach** | Medium | trust loss | State exactly what is tested; publish failures | Any claim without a test: remove it |
| **Competitor catch-up** (shadcn already has MCP and Skills) | High | wedge W3 shrinks | Differentiate on W1, W4, W6; keep D8 score public | n/a |
| **Variety explosion** | Medium | untested combinations | Contrast and computed-style check over the full matrix in CI | CI time over 15 minutes: sample combinations nightly, full matrix weekly |

---

## 11. For agents: how to take a task

1. Read [../AGENTS.md](../AGENTS.md), then [agent-brief.md](agent-brief.md).
2. Pick a task ID from §4 or §5 whose "Owner area" you are allowed to touch. If two IDs touch the same files, do one.
3. Write the failing test first (an axe test, a computed-style assertion, or a CI job).
4. Make the change. Add props, never remove. Tokens only in CSS. No new dependency without a reason in the PR.
5. Run `npm run check`, `npm run build`, `npm run size`. For visual work, take screenshots at 375 px and 1280 px in three themes and look at them ([dogfood-log.md](dogfood-log.md): "read the pictures").
6. Never edit generated files (`registry/`, `llms.txt`, `llms-full.txt`, `packages/react/src/index.ts`, `dist/`).
7. Commit small, one task per branch: `task-id: what changed`, for example `A3: add first-run CI job`.
8. Report: what you did, what you could not finish, anything another owner area must change. Do not claim a thing works until you ran it.

Task states for the tracker **(proposal)**: `ready` (acceptance clear), `blocked` (names the blocking ID), `in progress`, `needs review`, `done` (acceptance met and linked).

---

## 12. Order of work, as a list you can start tomorrow

1. F1, F2, F3, F8: one afternoon each; they remove visible rough edges.
2. A3: write the `first-run` CI job before the starters, and watch it fail. That is the baseline.
3. A2, A4, A5: starters, `create`, README. Re-run A3 until green on four frameworks.
4. B1, B2, B6: the three cheapest docs wins.
5. E1: publish the accessibility statement with known gaps. It costs a page and buys trust.
6. C2, C3, C1: colour mode, motion, presets, in that order, because presets depend on the other two.
7. D1, D2: MCP and skill, then D8 so you can measure them.
8. F6 and E2: book the screen-reader testing early, because it takes calendar time. Start it in week 3 and let it run in the background.

---

## 13. Modern web platform: native features that should replace JavaScript

**Why this section exists.** Every feature below removes code Monoline ships and maintains (a floating layer, open and close state, focus handling, resize observers), which serves wedges W1 and W5 and cuts the Radix weight noted in [bundle-report.md](bundle-report.md). The 0.4.0 release already moved Dialog, AlertDialog, Drawer and Command to native `<dialog>` and built one shared floating layer ([CHANGELOG.md](../CHANGELOG.md)); this is the next step.

**Source and method.** Guidance from Google Chrome's [modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src) (guides under `guides/<category>/<id>/guide.md`), read on 2026-11-20 with the `modern-web-guidance` skill, version 2026_10_12-dacb5911. The source files hold template placeholders for support status; the real status text comes from `npx -y modern-web-guidance@latest retrieve "<id>"`, so the "Status" column below is that output. "Baseline" here is the guidance's own wording: *Widely available* is safe without a fallback, *Newly available* needs feature detection or a fallback, *Limited availability* is progressive enhancement only.

**Policy to adopt (proposal).** Add one line to [AGENTS.md](../AGENTS.md): *Browser support: Widely available features need no fallback; Newly available features only with a feature-detected fallback of at most 20 lines and no new dependency; Limited availability only as progressive enhancement, never the only path to a core action.* The skill recommends writing the policy down so agents stop guessing.

### What the repo does today (grep, 2026-11-20)

| Feature | In `packages/css/src` or `packages/react/src` |
|---|---|
| `<dialog>` + `showModal()` | yes: `dialog.tsx`, `modal.tsx`, `alert-dialog.tsx` |
| Popover API, anchor positioning, `@container`, `light-dark()`, `field-sizing`, view transitions, `@starting-style`, `interpolate-size`, `closedby`, invoker commands, `focusgroup` | none found |
| `:has()` | in 5 CSS files |
| `matchMedia` in JS | `theme-provider.tsx`, `tour.tsx`, `use-media-query`, `use-reduced-motion.ts` |
| Positioning in JS | `components/popover/float.tsx` (`getBoundingClientRect`) |

### Features, ranked by value to Monoline

| # | Feature | Status (CLI, 2026-11-20) | Replaces | Components affected | Caveat and fallback (from the guide) | Effort | Guide |
|---|---|---|---|---|---|---|---|
| P1 | **Popover API** (`popover`, `popovertarget`, light dismiss, top layer) | Newly available, Baseline since 2025-01-27 | open state, outside-click and Escape handling, z-index stacking | Popover, Tooltip, HoverCard, DropdownMenu, ContextMenu, Menubar, Select list, Toast | Feature-detect; load the popover polyfill only where missing. `popover="hint"` (tooltips, hovercards) is Limited availability and falls back to manual behaviour | L | [ui-components/hovercard](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/hovercard/guide.md), [persistent-toast-notifications](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/persistent-toast-notifications/guide.md) |
| P2 | **CSS anchor positioning** (`anchor-name`, `position-area`, `position-try-fallbacks: flip-block, flip-inline`) | Limited availability | the `getBoundingClientRect` flip and shift code in `float.tsx` | same set as P1, plus Tabs underline | Keep the JS layer behind `@supports (anchor-name: --a)`. The polyfill does not support `position-area` combined with `position-try-fallbacks`, so use `anchor()` insets when polyfilling. `showPopover({source})` gives an implicit anchor (Baseline since 2026-01-13) | L | [viewport-aware-dropdowns](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-atoms/viewport-aware-dropdowns/guide.md), [position-aware-tooltips](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-atoms/position-aware-tooltips/guide.md), [anchor-positioning-tab-underline](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/anchor-positioning-tab-underline/guide.md) |
| P3 | **Invoker commands** (`command`, `commandfor` on buttons) | Newly available, Baseline since 2025-12-12 | click handlers that open or close dialogs, popovers and disclosures | Dialog, Drawer, AlertDialog triggers, Accordion, Collapsible | Detect with `commandForElement` on `HTMLButtonElement.prototype`; polyfill `invokers-polyfill` loaded only when missing; without it the button does nothing, so keep a click fallback | M | [declarative-dialog-popover-control](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/declarative-dialog-popover-control/guide.md), [accordion](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/accordion/guide.md) |
| P4 | **`<dialog closedby>`** (light dismiss) and `overscroll-behavior` for scroll containment | `closedby`: Limited availability; `overscroll-behavior`: Limited availability | outside-click script on the modal | Dialog, Drawer, AlertDialog | The guide makes a click-outside fallback script mandatory. Without `closedby` Escape still works, so loss is graceful. Do not feature-detect `overscroll-behavior` with `@supports`; treat as enhancement | S | [light-dismiss-a-dialog](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/light-dismiss-a-dialog/guide.md), [ui-components/dialog](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/dialog/guide.md) |
| P5 | **Container queries (size)** `@container` | Widely available, since 2023-02-14 | viewport media queries (560 to 1100 px in the CSS) and `useMediaQuery` for layout | blocks, Sidebar, AppShell, DataTable card layout, Stat grids | No fallback needed per the guidance default. The guide shows a media-query fallback inside `@supports (container-type: inline-size)` if a target is older | M | [css/size-aware-styling](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/css/size-aware-styling/guide.md) |
| P6 | **`:has()`** and **`:user-valid` / `:user-invalid`** | `:has()` Widely available since 2023-12-19; user pseudos Widely available since 2023-11-02 | JS that toggles classes on a parent for invalid, checked or open state; "validate after interaction" scripts | Field, Form, Input, Checkbox and Radio cards, menu items | None for the default policy. The repo already uses `:has()` in 5 files; extend it to Field error grouping | S | [style-parent-with-has](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/css/style-parent-with-has/guide.md), [validate-input-after-interaction](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/forms/validate-input-after-interaction/guide.md) |
| P7 | **`color-scheme` + `light-dark()`** | `color-scheme` Widely available since 2022-02-03; `light-dark()` Newly available since 2024-05-13 | JS reading `matchMedia('(prefers-color-scheme)')` for an auto theme (STRATEGY F8, C2) | tokens, ThemeProvider | `light-dark()` handles only two schemes. Monoline has three themes (warm, dark, midnight), so use it for `data-theme="auto"` and native controls, keep `[data-theme]` blocks for the rest (my inference, not in the guide) | M | [component-specific-light-dark-theme](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-atoms/component-specific-light-dark-theme/guide.md) |
| P8 | **`field-sizing: content`** | Newly available, since 2026-06-16 | JS autosize for Textarea; growing inputs | Textarea, Input, TagsInput | Guide advises against the complex grid-mirror fallback for most apps: leave fixed-size fields as the fallback | S | [form-fields-automatically-fit-contents](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/forms/form-fields-automatically-fit-contents/guide.md) |
| P9 | **`@starting-style` + `transition-behavior: allow-discrete`** | both Newly available since 2024-08-06; animating `display` (transitionable_display) and `overlay`: Limited availability | presence logic (Radix `Presence`) for enter and exit animation | Dialog, Drawer, Popover, Toast, Collapsible | Where discrete `display` transitions are missing, exits are instant; the guide says add an explicit close control that animates through a class and JS | M | [animate-to-from-top-layer](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/animate-to-from-top-layer/guide.md), [animate-element-entry-exit](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/animate-element-entry-exit/guide.md) |
| P10 | **Native disclosure**: `<details name>`, `::details-content`, `interpolate-size` / `calc-size()` | `details name` Newly available 2024-09-03; `::details-content` Newly available 2025-09-16; `interpolate-size` and `calc-size()` Limited availability; `hidden="until-found"` Limited | JS height measurement for Accordion and Collapsible | Accordion, Collapsible, Tabs panels | Provide `block-size: auto` before `calc-size()` since older browsers drop the whole declaration; exclusivity needs a small JS fallback if required | M | [accordion](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/accordion/guide.md), [animate-to-intrinsic-sizes](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/css/animate-to-intrinsic-sizes/guide.md) |
| P11 | **View Transitions (same document)** | Newly available, since 2025-10-14 | hand-built cross-fade for panel swaps and list reorder | docs site navigation, Tabs, SortableList, Tour | Guide requires: if unsupported, just update the DOM; route focus to the new heading. Element-scoped transitions are a separate feature; check status before use | M | [same-document-transitions](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-behaviors/same-document-transitions/guide.md) |
| P12 | **Scroll-driven animations** | Newly available, since 2026-10-27 (shown in the tabs guide) | `scrollHeight` handlers | ScrollProgress | Keep the JS path when `animation-timeline` is missing | S | [ui-components/tabs](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/tabs/guide.md) |
| P13 | **`ariaNotify()`** | Newly available, since 2026-09-14 | hidden live-region text nodes | Toast, Alert | Keep `role="status"` as the base; call `ariaNotify` as enhancement | S | [persistent-toast-notifications](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/persistent-toast-notifications/guide.md) |
| P14 | **`focusgroup`** | Limited availability | Radix roving focus and collection (visible in the bundle report for Tabs, Toolbar, RadioGroup, ToggleGroup) | Tabs, Toolbar, Menu, RadioGroup, ToggleGroup | Not yet: keep Radix; revisit when status improves. Do not make it the only keyboard path | L, later | [ui-components/tabs](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/tabs/guide.md), [menu](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/ui-components/menu/guide.md) |
| P15 | **Customizable `<select>`** | Limited availability | the own listbox in Select | NativeSelect first, Select later | Progressive enhancement for NativeSelect only; keep the own listbox as the cross-browser path | M, later | [branded-select-styling](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/forms/branded-select-styling/guide.md) |

### Not covered by the guidance source (do not assume)

`@layer` and CSS nesting were not in the guides I read, so no support claim is made here. Monoline already wraps copied component CSS in `@layer monoline.components` (CLI README, [packages/cli/README.md](../packages/cli/README.md)). Container *style* queries are Newly available since 2026-05-19, but the guide says not to use them for core features; keep `data-density` and the other `data-*` selectors ([design-token-reactivity](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/css/design-token-reactivity/guide.md)). CSS `@function` is Limited availability ([reduce-style-repetition](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/css/reduce-style-repetition/guide.md)): skip.

### Suggested order

1. **P4, P6, P8, P12, P13** (S): small, safe, visible. One PR each, each with a test that runs in real Chrome.
2. **P5, P7**: container queries and auto colour mode. They unblock STRATEGY C2 and the template work in C7.
3. **P3, P1**: invoker commands and popover. Together they remove most open and close JS for overlays.
4. **P2**: anchor positioning last among the big ones, since it is Limited availability: ship it as an enhancement and keep `float.tsx` as the fallback until status improves.
5. **P9, P10, P11**: motion and disclosure, after C3 (the motion axis), so `data-motion="none"` disables them.

Rule for every item: keep the public props and `data-state` attributes unchanged ([AGENTS.md](../AGENTS.md): add, never remove), test in Chrome with the feature on and off, and re-run `npm run size`.

---

## Glossary

| Term | Meaning |
|---|---|
| **AX tree** | The accessibility tree Chrome builds from the page; the same data screen readers on several platforms read. |
| **APG** | WAI-ARIA Authoring Practices Guide: the reference keyboard patterns for widgets. |
| **Axis** | One independent look choice set by a `data-*` attribute on `<html>`: theme, accent, font, radius, density, and (new) motion and preset. |
| **Preset** | A named bundle of axis values and token overrides. |
| **Registry** | The generated JSON that lists every component and its files; used by the CLI, MCP server and `llms.txt`. |
| **Owner area** | The part of the repo a task may edit, from [ROADMAP.md](ROADMAP.md) and [AGENTS.md](../AGENTS.md). |
| **Wedge (W1 to W6)** | A question Monoline answers better than anyone on the list. Every task serves one. |
| **First-run** | The first 10 minutes of a new user, tested automatically. |
