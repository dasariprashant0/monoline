# End-to-end findings

Found by `npm run e2e` (scripts/e2e, real Chrome, built docs site). 123 tests. Fixed ones have a regression test in the e2e suite; the date-picker focus fix also has a unit test.

## Fixed

| # | Bug | Where | Fix | Regression test |
|---|---|---|---|---|
| 1 | The docs Direction (RTL) preference flipped the CSS but not Radix keyboard behaviour: tabs, slider, toggle-group, menubar, calendar-adjacent widgets ignored RTL because nothing mounted a `DirectionProvider`. | apps/docs/src/shell/App.tsx | Wrap the docs frame in `DirectionProvider dir={prefs.dir}` | `rtl:` tests |
| 2 | Date picker: opening it put focus on the "Previous month" arrow, not on a day. | date-picker.tsx | `onOpenAutoFocus` focuses the tabbable day | `date-picker: Enter opens...`, unit test in date-picker.test.tsx |
| 3 | Date picker popover ran 26px off the bottom of a 375x667 viewport. | date-picker.tsx | `collisionPadding`, `max-height: var(--radix-popover-content-available-height)`, scroll inside | `layout: date-picker stays inside a 375x667 viewport` |
| 4 | The Command demo bound Ctrl/Cmd+K, the same key as the docs search. Both palettes opened; Escape closed only the top one and left focus on `body`. | command.demo.tsx | Demo uses Ctrl/Cmd+J | `command: its own shortcut...` (asserts exactly one dialog) |
| 5 | Tap targets under 24x24 (WCAG 2.5.8, our own bar): checkbox, switch and radio rows were 21px tall; the remove button in Tag and TagsInput was 18x20. | 10-choices.css, 19-avatar.css | `min-block-size: 24px` on `.choice`; 24px minimum on `.tag button` | `tap targets:` tests |

Fix 5 changes pixels (rows 3px taller, tags up to 4px taller): expect the visual audit baseline to move. Fix 4 changes a demo description, so `registry/`, `llms.txt` and `llms-full.txt` need the maintainer's regenerate.

## Re-test 2026-11-20 (after the 0.4 native-dialog and floating-layer rewrite)

Commands, real Chrome 157 on macOS, built docs site:

| Command | Result |
|---|---|
| `npm run e2e` | 123/123 passed, 0 failed, 162 s |
| `npm run ax` | 42/42 components pass, 9 known findings, report unchanged apart from the new triage table |
| `node scripts/audit.mjs --overlays` | 282 overlay states audited, OK: no problems found (861 s) |
| `node scripts/css-computed.mjs` | 628 computed-style checks across 3 themes and 3 font looks, ok |
| `node scripts/e2e/probe.mjs` | 4 of 6 probes show a barrier (table below) |
| `node scripts/e2e/cross-browser/smoke.mjs --browsers chromium` | all 5 flows passed (control run in Chrome) |

Not run here: `node scripts/audit.mjs` (default, 3 accents x pages) and `--visual`, `scripts/audit-examples.mjs`. Firefox and WebKit: see "Cross-browser" below.

### Open items, each reproduced (WP2 acts on this table)

| ID | Item | Component | WCAG | Sev | Status | Evidence (probe output) | Suggested fix | Files |
|---|---|---|---|---|---|---|---|---|
| T4 | Context menu has no keyboard path in the demo | context-menu | 2.1.1 | M | **fixed** (probe F7a passes, 2026-11-20) | `{"tag":"span","tabIndex":-1,"role":null,"focusable":false}` | Demo with a focusable trigger; docs sentence that the trigger must be focusable | `context-menu.demo.tsx` |
| T5 | Tooltip does not show when Tab scrolls its trigger into view | tooltip | 1.4.13, 2.1.1 | M | **fixed** (probe F7c passes, 2026-11-20) | focus on `button "Save"`, trigger started at y=1903 in a 400 px viewport, tooltip in DOM: false. Control (trigger already visible): true | Do not close on scroll caused by focus; close on user scroll only | `tooltip`, `popover/float.tsx` |
| T6 | Combobox opens on focus | combobox | 3.2.1 | L | **fixed** (probe F7d passes, 2026-11-20) | `aria-expanded` after focus: `true` | Open on typing or ArrowDown; keep an opt-in prop | `combobox` |
| F7b | Drawer has no visible close | drawer | 2.5.8 | - | **stale, fixed** | buttons inside the open drawer: `["Close"]` | none | - |
| T7 | No `forced-colors` or `prefers-contrast` rules | all CSS | 1.4.11, 2.4.7 | M | **fixed** (probe F5a passes, 2026-11-20) | 0 forced-colors rules, 0 prefers-contrast rules. Focus ring survives forced-colors today (2px solid outline on button, checkbox, input) | add rules for borders, checked/selected/pressed; see WP4 | `base.css`, component CSS |

Radix menus not looping and Tab not closing a dropdown menu are still asserted by the e2e suite.

### Cross-browser (Firefox, WebKit)

`scripts/e2e/cross-browser/smoke.mjs` (Playwright) covers dialog (open, Tab trap, Escape, focus return), dropdown menu, select, combobox and tabs. CI runs it in the `cross-browser` job of `.github/workflows/e2e.yml`. Local results are in the section "Cross-browser run" at the end of this file.

## Harness notes (things that made tests flaky until fixed)

- Radix reads "arrow key is down" in a timeout after keydown; an instant keyup breaks radio-group arrow selection. The harness holds each key 40ms.
- Chrome headless needs `--disable-renderer-backgrounding` and friends, otherwise `Input.dispatchKeyEvent` sometimes never returns. Also added to the shared launcher.
- Chrome writes `DevToolsActivePort` in two steps; the launcher now waits for both lines (the old audit sometimes died with `Invalid URL`).
- Programmatic `focus()` scrolls and closes Radix tooltips; the harness scrolls first, then focuses with `preventScroll`.
- On a loaded machine pages took up to 10s to render; the wait is 20s. CI uses `--retries 1` and a retry that passes is printed as FLAKY.

## Cross-browser run (2026-11-20, macOS, Playwright 1.56.1)

`node scripts/e2e/cross-browser/smoke.mjs --browsers webkit,chromium`:

| Browser | Result |
|---|---|
| WebKit 26.0 | 5/5 flows passed |
| Chrome 157 (control) | 5/5 flows passed |
| Firefox 142.0.1 | **not run**: the Playwright build crashes at start-up on this machine (`RenderCompositorSWGL failed mapping default framebuffer`, launch timeout). CI runs it on ubuntu (`cross-browser` job); until that job has run, Firefox is untested |

Notes for whoever extends the suite:

- Safari and Playwright's WebKit on macOS skip buttons and links on `Tab` by default (a plain page with three buttons: Tab went input, body, input). Use `Option+Tab` (`Alt+Tab`) there; the smoke test does. This is also what a Safari user must turn on ("Press Tab to highlight each item") before the focus-trap and tab-order checks mean anything, so list it in the manual script (done in `docs/screen-readers.md`).
- Radix needs a held key: the smoke test presses with a 40 ms delay, or tabs fail in Chrome 157 (`ArrowRight did not select Activity` without it).
- If `npx playwright install` hangs at extraction, unzip the archive from `$TMPDIR/playwright-download-*` into `$PLAYWRIGHT_BROWSERS_PATH/<name>-<rev>/` and `touch INSTALLATION_COMPLETE`.
