# Adoption: the first ten minutes

> **Archived 2026-11-24.** A first-ten-minutes log against npm 0.4.0; the CLI, themeScript and install-box bugs in its table are fixed; the 375 px logo clipping was not re-checked. Current state: [../audit/2026-current-state.md](../audit/2026-current-state.md); plan: [../ROADMAP.md](../ROADMAP.md). Relative links below still point to the old `docs/` location.

> **Historical (2026-11-20), against npm 0.4.0.** The CLI `TS2307` failure in rows 5-7 and the bug table was fixed by PR #23 (`add` now copies `utils/cx`, `utils/slot` and `utils/overlay`). For the current state read [ROADMAP.md](ROADMAP.md).


Written 2026-11-20 (WP6). Scope: README, the getting-started guides and the docs home page. Evidence comes from commands run from empty folders against `@monoline/react` and `@monoline/css` 0.4.0 from npm (Node 26.10, npm 11.19, Vite 8.3, Next.js 16.4.6, React 19.3). Only npm was run; the pnpm, yarn and bun tabs use each tool's standard syntax and were not executed.

## Checklist from BENCHMARK.md section 4

| Minute | Step | Result | Evidence |
|---|---|---|---|
| 0-1 | README top: install line, one import, one component, pastes without edits | **Pass** | The README `main.tsx` is the exact file that was built (`vite-main-1`). One extra step is needed and is in the README: `rm src/App.tsx src/App.css src/index.css`, because the Vite template's CSS fights Monoline |
| 1-3 | `npm create vite`, install the two packages, no peer warning | **Pass** | `npm install @monoline/react @monoline/css` ended with `found 0 vulnerabilities`; the only warning was npm's own `install-scripts ... fsevents@2.3.3` |
| 3-4 | `import` the CSS once, render `<Button variant="solid">Save</Button>`, no provider | **Pass** (built) | `npm run build`: `index-BEFnxefQ.js 221.27 kB gzip 69.36 kB`, `index-BGGbU52u.css 13.26 kB gzip 3.87 kB`. A styled button was seen in a browser with the step-5 file (computed background `rgb(240, 237, 231)`); the button-only file was built but not opened |
| 4-5 | `data-theme` and `data-accent` re-theme the page with no reload | **Pass** (via `ThemeProvider`) | In a browser, clicking the toggle changed `<html data-theme>` from `dark` to `warm` and the body background from `rgb(17, 17, 16)` to `rgb(250, 250, 245)` with no reload. Hand-edited attributes in `index.html` were not run in a browser |
| 5-7 | `npx monoline add dialog`, open it, press Escape | **Fail for the CLI, pass for the package Dialog** | CLI: `npx monoline add dialog` wrote files, then `npm run build` failed: `modal.tsx(3,20): error TS2307: Cannot find module '../../utils/slot'` and `'../../utils/overlay'`. Same for `add button card` (`../../utils/slot`). A dry run against the local `registry/` lists the same files, so it is not only the remote registry. Package Dialog: real Escape key closed it, `document.activeElement` returned to "Delete project", and `dialog.matches(':modal')` was `true` |
| 7-8 | A component docs page has an example, props and a keyboard table | **Pass** (static HTML only) | `dist/docs/components/button/index.html` contains "Keyboard" (3), "Props" (12), "Examples or Usage" (7). Not reviewed visually; the component page is outside WP6's files |
| 8-9 | Paste `llms.txt` or use the MCP server, ask for a settings form | **Not run** | `llms.txt` exists and opens with the project summary. No AI tool was driven, so "output uses real Monoline components" is untested. The recipe prompt is on the site as a suggestion only |
| 9-10 | `npm run build`, a Button-only app adds about 1 KB of JS gzip | **Pass** | Empty React page: `index-DqkUHvg9.js gzip 68.57 kB`. Button-only: `69.36 kB`. Difference 0.79 KB |

Additional runs: the Next.js App Router path (below) and a settings card plus toast (browser-clicked: Save, Switch, toast text all worked).

## Commands run (from `$TMPDIR/clean`, outside the repo)

```text
npm create vite@latest app -- --template react-ts      ok, "Scaffolding project"
npm install                                           found 0 vulnerabilities
npm install @monoline/react @monoline/css             added @monoline/css ^0.4.0, @monoline/react ^0.4.0, react ^19.3.1
npm run build   (button only, then dialog + ThemeProvider, then recipes)   all built
npx create-next-app@latest next-app --ts --app --no-tailwind --no-eslint --no-src-dir ...   Success
npm install @monoline/react @monoline/css             found 0 vulnerabilities
npm run build   (Next, first try)                     FAILED: Attempted to call themeScript() from the server but themeScript is on the client
npm run build   (Next, with app/theme-init.tsx)       Compiled successfully; / prerendered as static
npx next start; browser check                         data-theme=dark data-accent=teal, :modal true, console empty
npx monoline init; npx monoline add dialog            wrote 7 files; build fails TS2307 (see table)
npx monoline add button card                          build fails TS2307
```

In the repo: `npm install`, `npm run typecheck`, `npm run build` (189 pages prerendered), `npm run check` (exit 0, 163 test files, 1467 tests), `npm run test:docs -w docs` (10 pass).

## Bugs found (not in WP6's files; for the owners)

| Where | Problem | Evidence |
|---|---|---|
| `packages/cli`, `registry/` | `add` does not copy `utils/slot` or `utils/overlay`, so copied Button, Card and Dialog do not compile. Blocks the "own the code" promise and checklist minute 5-7 | TS2307 above; guide and README now warn about it |
| `packages/react/src/components/theme-provider/theme-provider.tsx` | **Fixed in 5a2bff8:** `themeScript` now lives in `theme-script.ts` without `'use client'`, and a test guards it. Was: `themeScript` lives in a `'use client'` file, so a Next.js Server Component cannot call it | Next build error above. The guide uses a client wrapper (`app/theme-init.tsx`) |
| same file, JSDoc `@example` | **Fixed in 5a2bff8.** Was: shows `<ThemeProvider defaultAccent="green">`; the prop is `accent` | `ThemeProviderProps extends Partial<Look>`; `accent="teal"` works in the build |
| `apps/docs/src/shell/home-board.tsx` `InstallBox` | The hero copies `npm i @monoline/react` only. Without `@monoline/css` there is no styling. WP6 added one sentence under it in `Home.tsx`; the box itself should offer both packages | the hero on the rebuilt site |
| docs topbar at 375 px | The logo text is clipped ("MONOLIN") beside the search and theme buttons | screenshot `getting-started-mobile-375.jpg` |

## Patterns adopted (BENCHMARK.md section 2 and the plan's gaps)

| # | Pattern / gap | What was done |
|---|---|---|
| 2 | Publish and prove install | The guides were run from empty folders (log above). A CI job that follows the README verbatim is still WP1's (its smoke test uses starters, not the README text) |
| 3 | Install tabs, choice remembered | `PmCode` in `guide-parts.tsx`: npm, pnpm, yarn, bun, stored under `monoline-pm`; used on every command in Getting started and Next.js |
| 1 (part) | Starters | A tested Vite path and a tested Next.js path as copy-paste files. The code strings in `site/start-snippets.ts` are the files that were built. Starter templates and `npm create monoline` stay with WP1 |
| 7 (part) | Copyable prompts for AI tools | One prompt in the Recipes guide. No MCP or Skills file work |
| 9 (part) / G5 | Versioning honesty, "when not to use" | New guide "Is Monoline for you?" with 0.x policy and what is missing. No migration guide: needs the 1.0 plan |
| G2 | Small CSS as the default | README and guides use `core.css` plus per-component files; `import '@monoline/css'` is the exploring shortcut |
| G4 | Framework notes | Next.js page rewritten with the real failure and fix (above). Astro, React Router and Plain CSS pages were left as master wrote them; they were not run in WP6 |
| 12 (part) | Honest status | README and Choosing say no screen-reader test has been run |

Home page: master's redesign (Plain CSS and accessible React, install box, live board) replaced the old home, so WP6 only added one line under the install box. The first-run path is reached by "Get started".

## Deferred (and why)

| # | Pattern | Why not now |
|---|---|---|
| 1 | Starter templates for Astro, React Router and `npm create monoline` | Needs WP1's starters merged and a decision on `npm create` (E8) |
| 4 | Keyboard table and anatomy as fixed sections | Component page code, not WP6's files; the keyboard section already exists on the Button page |
| 5 | Playground controls on every component | `page/playground.tsx`, not WP6's files |
| 6 | Styling reference per page | Generated (`styling.generated.json` exists); component page code |
| 7 (rest) | MCP server docs and a Skills file | `packages/mcp`, `packages/mcp/README.md`: WP5 |
| 8 | Theme presets gallery with export | WP4 (`theme-builder.tsx`); a Themes page already exists on master |
| 9 (rest) | Migration guides, deprecation policy | Writing one before a breaking change exists would be guesswork; `docs/releasing.md` is WP5's |
| 10 | Blocks gallery | Already on master (Blocks page) |
| 11 | Classless defaults | Changes `packages/css` base styles |
| 12 (rest) | Per-release accessibility statement | `docs/a11y-report.md` is WP5's |
| G9 | Trust: issue labels, outside users | Not a docs change |

## Not verified

- The pnpm, yarn and bun commands.
- React 18 (the Next.js App Router needs 19; the Vite run used 19.3).
- Astro, React Router and Remix pages, and the CLI on any component that needs a shared helper.
- Whether an AI tool given `llms.txt` and the Recipes prompt produces working code.

## Re-run on the integration branch (2026-11-20)

From an empty temp folder, against npm 0.4.0 packages:

- README quick start: `npm create vite@latest my-app -- --template react-ts`, `npm install`, `npm install @monoline/react @monoline/css`, `rm src/App.tsx src/App.css src/index.css`, then the README's own `main.tsx` extracted from the file. `npm run build` passed: `index-BGGbU52u.css 13.26 kB gzip 3.87 kB`, `index-BEFnxefQ.js 221.27 kB gzip 69.36 kB`.
- CLI known issue reproduced with `npx monoline add dialog --registry <this tree's registry/>`: `modal.tsx(3,20): error TS2307: Cannot find module '../../utils/slot'` and the same for `'../../utils/overlay'`. The default registry URL (GitHub master) was not reachable from the sandbox, so the local `registry/` was used.
- Next.js path: **not re-run**. `create-next-app` could not be fetched in the sandbox (npm registry returned 403 from the network policy). The Next.js guide rests on the earlier run above.
- pnpm, yarn and bun tabs: still not executed.
