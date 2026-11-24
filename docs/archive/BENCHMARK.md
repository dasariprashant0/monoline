# Benchmark: Monoline against 13 UI libraries

> **Archived 2026-11-24.** A 2026-11-20 snapshot of 13 libraries; numbers are not kept current. Current state: [../audit/2026-current-state.md](../audit/2026-current-state.md); plan: [../ROADMAP.md](../ROADMAP.md). Relative links below still point to the old `docs/` location.

> **Historical snapshot.** Numbers and the npm status were measured when it was written; for the current state read [ROADMAP.md](ROADMAP.md).


Researched 2026-11-20. Public sources only. Stars, release dates and licences come from the GitHub API on that day; everything else is from the library's own docs, linked in the cells. **(u)** means not verified from a primary source. Builds on `docs/research/` (fetched 2026-11-12); where the two differ, this file says so.

## 1. Comparison matrix

### Distribution, setup and maintenance

| Library | Model | Setup to first component | Latest release (GitHub) | Stars | Licence |
|---|---|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com/docs/installation) | Copy via CLI (`init`, `add`, `diff`, `view`) from a [registry](https://ui.shadcn.com/docs/cli); Tailwind | One `init`, then `add` ([CLI](https://ui.shadcn.com/docs/cli)) | cli 4.23.0, 2026-10-27 | 128.6k | MIT |
| [Material UI](https://mui.com/material-ui/getting-started/installation/) | npm; Emotion peer deps | `npm i @mui/material @emotion/react @emotion/styled` | v9.5.0, 2026-10-09 | 99.4k | MIT |
| [Ant Design](https://ant.design/docs/react/introduce) | npm, CSS-in-JS (u: runtime cost) | `npm i antd`, no provider needed for defaults (u) | 6.7.1, 2026-11-16 | 100.3k | MIT |
| [Chakra UI](https://chakra-ui.com/docs/get-started/installation) | npm + snippets CLI; Emotion at runtime (page mentions both) | provider + snippets step | v3 line, panda-preset 3.38.0, 2026-11-03 | 40.7k | MIT |
| [Mantine](https://mantine.dev/getting-started/) | npm, split `@mantine/*`, PostCSS | [templates](https://mantine.dev/getting-started/) with deps preconfigured | 9.8.1, 2026-11-15 | 32.0k | MIT |
| [daisyUI](https://daisyui.com/docs/install/) | Tailwind plugin, class names only | `npm i -D daisyui@latest` + one `@plugin` line | v5.8.1, 2026-11-15 | 42.9k | MIT |
| [Headless UI](https://headlessui.com/) | npm, unstyled, for Tailwind | install + write your own CSS | 2.2.10, 2026-04-07 (slowest cadence here) | 28.8k | MIT |
| [Radix](https://www.radix-ui.com/primitives/docs/overview/introduction) | npm primitives; "Made by WorkOS" in the site header | install per primitive or `radix-ui` | no GitHub releases listed; last push 2026-10-14 | 19.5k | MIT |
| [Base UI](https://base-ui.com/react/overview/quick-start) | one tree-shakable package, unstyled | `pnpm add @base-ui/react` | v1.9.0, 2026-10-09 | 11.5k | MIT |
| [HeroUI](https://www.heroui.com/docs/guide/introduction) | npm; Tailwind v4 + React Aria | quick start ([page](https://heroui.com/docs/react/getting-started/quick-start)) | v3.2.7, 2026-10-28 | 31.3k | Apache-2.0 (GitHub API and npm both agree; the 11-12 note saying MIT was wrong) |
| [Magic UI](https://magicui.design/docs/installation) | Copy via shadcn CLI; paid Pro | shadcn CLI `add` | no release tags | 23.4k | MIT |
| [Aceternity UI](https://ui.aceternity.com/docs/install-nextjs) | Copy via CLI; free + paid blocks ([pricing](https://ui.aceternity.com/pricing)) | needs Next.js + Tailwind + utilities first no official open repo found (only community clones); licence is on its [licence page](https://ui.aceternity.com/licence) | n/a | see page |
| [Twigs](https://twigs.surveysparrow.com/docs/getting-started) | npm; Radix + Stitches (CSS-in-JS); ThemeProvider required | install 2 packages, wrap in `ThemeProvider` | twigs-react 0.38.2, 2026-10-08 | 29 | MIT |
| **Monoline** | npm (CSS + React) or CLI copy | `npm i @monoline/react @monoline/css`, one CSS import, no provider ([README](../README.md)) | 0.4.0, published to npm 2026-11-16 ([npm registry](https://registry.npmjs.org/@monoline%2freact)) | new | MIT |

### Theming, accessibility, docs, AI

| Library | Theme and dark mode | Accessibility evidence | Docs and AI surface |
|---|---|---|---|
| shadcn/ui | CSS variables in oklch, `.dark` ([theming](https://ui.shadcn.com/docs/theming)) | inherits from Base UI / Radix / React Aria (the 11-12 note) | [llms.txt](https://ui.shadcn.com/llms.txt), [MCP server](https://ui.shadcn.com/docs/mcp), Skills page, registry |
| MUI | `--mui-*` variables via [CSS theme variables](https://mui.com/material-ui/customization/css-theme-variables/overview/) | per-component a11y notes (u) | no `/llms.txt` (404 on 2026-11-20) |
| Ant Design | Seed, Map, Alias tokens plus algorithms ([customize theme](https://ant.design/docs/react/customize-theme)) | (u) | [llms.txt](https://ant.design/llms.txt) |
| Chakra | recipes and semantic tokens (11-12 note) | Ark UI base (note) | [llms.txt](https://chakra-ui.com/llms.txt) exists but is about 1 KB |
| Mantine | theme object becomes CSS variables (note) | jest-axe stated (note) | [llms.txt](https://mantine.dev/llms.txt), props + Styles API tabs |
| daisyUI | `data-theme`, `prefersdark` flag ([themes](https://daisyui.com/docs/themes/)) | none stated (note) | [llms.txt](https://daisyui.com/llms.txt) |
| Headless UI | none; data attributes | keyboard section per page ([home](https://headlessui.com/)) | no llms.txt (404) |
| Radix | data attributes; Themes package styles it | [Keyboard Interactions](https://www.radix-ui.com/primitives/docs/components/dialog) section per page | no llms.txt (404) |
| Base UI | none; `className` as string or function of state | dedicated [accessibility page](https://base-ui.com/react/overview/accessibility) | [llms.txt](https://base-ui.com/llms.txt), "View as Markdown" on each page |
| HeroUI | Tailwind v4 CSS variables, BEM classes, Theme Builder (note) | React Aria Components (note) | [llms.txt](https://www.heroui.com/llms.txt) |
| Magic UI | none of its own | none stated (note) | [llms.txt](https://magicui.design/llms.txt), [MCP page](https://magicui.design/docs/mcp) |
| Aceternity | none | none stated (note) | [llms.txt](https://ui.aceternity.com/llms.txt) |
| Twigs | Stitches theme object, merged over defaults ([theming](https://twigs.surveysparrow.com/docs/getting-started/theming)); dark mode via `createTheme` plus a `twigs.config` dark theme ([llms-full.txt](https://twigs.surveysparrow.com/llms-full.txt)) | Radix + react-aria dependencies; no a11y claims read | `llms-full.txt` (about 200 KB), no `llms.txt`; "Copy Markdown" button, [playground](https://play.twigs.surveysparrow.com/) |
| **Monoline** | 3 themes, 8 accents, font/corner/density via `data-*` on `<html>`; contrast checked per theme x accent | axe per component, real-Chrome AX-tree check; **no screen-reader test yet** ([report](a11y-report.md)) | `llms.txt`, `llms-full.txt`, `registry/`, MCP package, per-page Markdown |

### Coverage, bundle, TypeScript, motion

| Library | Coverage (nav counts, 11-12 note) | Bundle and dependencies | Motion |
|---|---|---|---|
| Mantine | 122 components + 83 hooks | split packages; own CSS | built in |
| Chakra | 100 | Emotion runtime | built in |
| Aceternity / Magic UI | 111 / 78 items, effect-heavy | copy-in, often with an animation lib (u) | the product |
| HeroUI | 73 | Framer Motion removed in v3 (note) | CSS |
| Ant / daisyUI | 67 / 67 | runtime CSS-in-JS / zero JS | built in / CSS |
| shadcn / MUI | 59 / 56 | copy-in / Emotion | via host |
| Base UI / Radix | 37 / 30 | tree-shakable / per primitive | none, use `data-*` |
| Twigs | 40+ (self-reported on [home](https://twigs.surveysparrow.com/)) | pulls in react-select, react-table 7, lodash-es, react-aria (package.json, `packages/react-components`) | (u) |
| **Monoline** | 135 component folders | one Button 0.7 KB gzip, everything 94.9 KB, dialog on native `<dialog>` ([bundle report](bundle-report.md)) | CSS, reduced motion zeroed in `base.css` |

TypeScript: every library above ships types (u for Twigs and Aceternity); Monoline generates props tables from required doc comments. Versioning: Monoline is 0.x, minors may rename classes, each change is in the CHANGELOG.

### Where Monoline stands, axis by axis

| Axis | Ahead, level or behind | Evidence |
|---|---|---|
| Install friction | level | one import, no provider; npm and CLI both exist. Behind Mantine/shadcn on starters. On npm since 0.4.0 (2026-11-16); the roadmap's "not published" line is out of date |
| Tokens and theming | ahead of most | five `data-*` switches, no JS; no export-to-Figma yet |
| Accessibility | ahead on automation, behind on proof | axe + AX tree in CI, but no human screen-reader results |
| Coverage | level with Mantine | 135 folders. README says 129 and the roadmap says 137: the counts disagree |
| Docs | level | per-page examples, props, a11y, search, Markdown. Missing: persisted package-manager tabs, per-page keyboard table as a first-class section, version/size side column |
| Customization | ahead | copy (CLI with `diff` and `update`) or install, same source |
| Bundle | ahead | per-module build and size budgets |
| TypeScript | level | doc-comment gate |
| Dark mode | level | three themes; `prefers-color-scheme` auto mode: (u), grep found no media query in `packages/css/src` |
| Motion | behind on guidance | no motion tokens page or recipes |
| Versioning | behind | pre-1.0, no migration guides yet |
| Community | behind | about 300 npm downloads last week (see section 5) |

## 2. Top 10 patterns to adopt, ranked by effect on real-user adoption

| # | Pattern | From | Effort | Repo area |
|---|---|---|---|---|
| 1 | **Starter templates** for Vite, Next.js, Astro that already import the CSS and render a Button and a Dialog; `npm create monoline` | Mantine templates, shadcn `init` | M | `packages/cli`, `examples/`, CI install test (roadmap 0.4) |
| 2 | **Publish and prove install**: npm with provenance, a clean-machine CI job that follows the README verbatim | all npm libraries | S | `.github/workflows/release.yml`, README |
| 3 | **Installation tabs** (npm, pnpm, yarn, bun, CLI) on every page, choice remembered | shadcn, Magic UI | S | `apps/docs/src/page/component-doc.tsx` |
| 4 | **Keyboard table and anatomy** as fixed sections, generated from `meta.json` `a11y` | Radix, Headless UI | S | `apps/docs`, `meta.json` schema |
| 5 | **Playground controls** (variant, size, state) above the first example | Mantine | M | `apps/docs/src/page/playground.tsx` (exists, widen to all components) |
| 6 | **Styling reference per page**: class names, `data-*` states, tokens the component reads | Base UI, HeroUI, daisyUI, Ant | M | generate from CSS into docs and `meta.json` |
| 7 | **MCP server and a Skills file**, with copyable prompts on the docs | shadcn MCP, Magic UI MCP | M | `packages/mcp`, `docs/mcp.md`, `llms.txt` |
| 8 | **Theme presets gallery** with export of CSS and JSON | HeroUI Theme Builder, daisyUI themes, shadcn themes | M | `apps/docs/src/theme-builder.tsx`, `packages/css/src/options.css` |
| 9 | **Migration guides and deprecation policy** written before 1.0 | Chakra v2 to v3 pain (11-12 note), Mantine, Ant | S | `CHANGELOG.md`, `docs/releasing.md` |
| 10 | **Blocks and templates gallery** with copy buttons | shadcn blocks | M | `apps/docs/src/site/Blocks.tsx`, `examples/` |

Also cheap: a version, size and source-link column on each page (Radix). Publish the screen-reader test results once someone has done them; nobody else on this list does.

## 3. Five things to deliberately not copy

1. **Tailwind as a dependency** (shadcn, daisyUI, HeroUI v3, Magic UI, Aceternity): it ties adopters to a build step. Plain CSS is the differentiator.
2. **Runtime CSS-in-JS and a mandatory provider** (Twigs on Stitches, MUI and Chakra on Emotion): server rendering friction and runtime cost, and `ThemeProvider` is required before any component renders.
3. **Heavy default dependencies in the core** (Twigs bundles react-select, react-table 7 and lodash-es): keep Monoline to `radix-ui` and React, as `AGENTS.md` says.
4. **Effects as the product and a paid tier to match** (Aceternity, Magic UI Pro): licences restrict redistribution (Aceternity, per the 11-12 note) and the visual language fights the thin-rule identity.
5. **Breaking changes in minors without a guide** (HeroUI, per the 11-12 note, and Chakra's v3 rewrite): pre-1.0 is fine, silent breaks are not.

## 4. First 10 minutes for a new user

| Minute | Step | Passes when |
|---|---|---|
| 0-1 | Read the README top: install line, one import, one component | the snippet pastes without edits |
| 1-3 | `npm create vite`, `npm i @monoline/react @monoline/css` (or `npx monoline init`) | install ends with no peer-dependency warning |
| 3-4 | `import '@monoline/css'` once, render `<Button variant="solid">Save</Button>` | a styled button appears, no provider |
| 4-5 | Set `data-theme="dark" data-accent="teal"` on `<html>` | the whole page re-themes with no reload |
| 5-7 | `npx monoline add dialog`, open it, press Escape | focus returns to the trigger, page behind is inert |
| 7-8 | Open the docs page for a component you need: find an example, the props, the keyboard table | all three are on the page, no hunting |
| 8-9 | Paste `llms.txt` or point the MCP server at an AI tool, ask for a settings form | output uses real Monoline components |
| 9-10 | Run `npm run build`; check the size | a Button-only app adds about 1 KB of JS gzip |

The checklist should run as a CI job (pattern 2), or it will rot.

## Method and gaps

- Subagent fan-out was blocked by a hook, so the research was done in one session: live fetches of install, theming and llms pages, plus the GitHub API for stars, releases and licences. The skills named in the brief were not invoked.
- Still not verified: Twigs alpha status (a search summary said alpha; its docs text shows no such warning) and a11y claims; every library's real screen-reader testing; Aceternity's licence terms beyond its page.
- The 11-12 notes in `docs/research/` supply claims marked "(note)"; they were not re-fetched.

## 5. Adoption signal and extra libraries (added 2026-11-20)

npm downloads, last week, from the [npm downloads API](https://api.npmjs.org/downloads/point/last-week/@monoline/react) (fetched on the same day):

| Package | Weekly downloads |
|---|---:|
| `@base-ui/react` | 32.4M |
| `radix-ui` | 30.1M |
| `@mui/material` | 14.9M |
| `@headlessui/react` | 10.3M |
| `react-aria-components` | 10.1M |
| `antd` | 5.5M |
| `@mantine/core` | 3.8M |
| `@chakra-ui/react` | 2.4M |
| `daisyui` | 1.5M |
| `@ark-ui/react` | 1.5M |
| `@heroui/react` | 1.1M |
| `@sparrowengg/twigs-react` | 2.2k |
| `@monoline/react` | 300 |

Primitive packages dominate because the styled kits depend on them (shadcn is copy-in, so it does not show up here). A real-user ceiling for a new kit is hundreds, not millions: the first goal is the first 100 outside installs, which is what patterns 1 to 3 serve.

Libraries beyond the 13 asked for, picked because each answers a Monoline question:

| Library | Why it matters | Facts (GitHub API 2026-11-20) | Take | Skip |
|---|---|---|---|---|
| [React Aria Components](https://react-aria.adobe.com/) | Strongest accessibility and i18n reputation; its site claims 50+ components with adaptive interactions (own words) | 16.1k stars, Apache-2.0, RAC 1.22.0 (2026-10-09), [llms.txt](https://react-spectrum.adobe.com/llms.txt) | Use as the audit yardstick for combobox, date picker, drag and drop behaviour | Another primitive layer on top of Radix |
| [Ark UI](https://ark-ui.com/) | Framework-agnostic headless layer under Chakra v3 | 5.5k stars, MIT, [llms.txt](https://ark-ui.com/llms.txt), 1.5M downloads/week | Same state machines for React, Vue, Solid, a hint if Monoline ever leaves React | The machine abstraction, too heavy for one framework |
| [Web Awesome](https://webawesome.com/docs/) (ex-Shoelace) | Closest to "works in any framework" with a CSS-variable theme | 1.4k stars, MIT, v3.15.0 (2026-11-17), [llms.txt](https://webawesome.com/llms.txt) (about 400 KB); some components are Pro | Theme gallery and the "no framework needed" pitch | Web components: SSR and form-association friction |
| [Pico CSS](https://picocss.com/docs) | Semantic HTML styled with no classes | 16.8k stars, MIT, **archived on GitHub**, last release v2.1.1 (2025-03-15) | Classless defaults for CSS-only users (style bare `button`, `input`, `table`) | Single-maintainer risk: a warning for Monoline's own roadmap |
| [GOV.UK Frontend](https://design-system.service.gov.uk/) | Public accessibility strategy and published research | 1.5k stars, MIT, v6.6.0 (2026-10-15) | A published accessibility statement per release, with known gaps | Look and tone |
| [Carbon](https://carbondesignsystem.com/) | Enterprise tokens, versioned releases, [llms.txt](https://carbondesignsystem.com/llms.txt) | 9.6k stars, Apache-2.0, v11.121.0 (2026-11-18) | Release train and token naming discipline | IBM scale of process |
| [Primer](https://primer.style/) | Token and component docs from a large product team | 3.9k stars, MIT, @primer/react 38.46.0 (2026-11-13), no llms.txt | Tokens documented as a searchable table | Version churn (major 38) |
| [Bootstrap](https://getbootstrap.com/) | The baseline for "CSS first, JS optional" | 175k stars, MIT, v5.3.9 (2026-11-11), [llms.txt](https://getbootstrap.com/llms.txt) | One CDN `<link>` quick start, copyable in 10 seconds | Utility sprawl |
| [Open Props](https://open-props.style/) | Tokens as plain CSS custom properties | 5.6k stars, MIT, last release v1.6.0 in 2023 (stale) | Ship tokens as a standalone import (`tokens.json` and `core.css` already do) | Stale releases |
| Polaris | Shopify's system | **archived** on GitHub, last release 2025-03-26 | Nothing: a reminder that even big sponsors retire kits | n/a |

Two more patterns from this round, ranked below the first ten:

| # | Pattern | From | Effort | Repo area |
|---|---|---|---|---|
| 11 | **Classless defaults**: bare `button`, `input`, `table`, `dialog` styled when `@monoline/css` is loaded, so a page with no classes still looks right | Pico CSS | M | `packages/css/src/base.css` |
| 12 | **Published accessibility statement** per release with known gaps, written before screen-reader results exist | GOV.UK Frontend | S | `docs/a11y-report.md`, docs site |

Not looked at: Fluent UI, PrimeReact, Flowbite and USWDS (repo data fetched, docs not read). Their GitHub licence shows as NOASSERTION for Fluent and USWDS, so read the LICENSE file before copying anything.
