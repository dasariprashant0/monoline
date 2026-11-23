# AUDIT-C: accessibility runtime lens (master 5a4ffa8, release 0.5.0)

Read-only audit. Built the docs site (`npm run build`, exit 0), served `apps/docs/dist` in real Chrome over CDP. Chrome only. No screen reader was run.
Evidence and scripts: `audit-out/` (sweep*.json, keyboard.json, focus.json, *.mjs, *.png). Everything is uncommitted.
Chrome and local ports needed the sandbox lifted (listen EPERM); nothing outside the worktree was touched.

Legend: **TV** = tool-verified (DOM, computed style, axe, key events in Chrome). **INF** = inferred from the accessibility tree or code, not heard in a screen reader.

## 1. Findings (new, not in docs/a11y-report.md)

| ID | Sev | WCAG 2.2 | Where | Evidence | Ver. | Suggested fix |
|---|---|---|---|---|---|---|
| C1 | P2 | 1.4.3 | Home page `/`, `.alert-description` | axe color-contrast 4.29:1, `#8c8279` on `#21211e` (check_contrast tool: fail normal text) | TV | Use a stronger muted on alert/tinted surfaces, or a token for "muted on wash" |
| C2 | P2 | 1.4.10, 1.4.4 | Docs header, all pages | Brand "monoline" overlaps Search button: 25x28px at 320, 17x28 at 360, 4x28 at 375 (`audit-out/zoom400-select.png`) | TV | Hide the wordmark or collapse search to icon below ~400px |
| C3 | P2 | 1.4.10 | 43 docs pages at 320px (e.g. tools/themes 913px wide, theme-builder 531, code-block 642, data-grid 604, many block-* 323-385) | `reflow320.hscroll` in sweep.json; offenders `.tabs-list`, `.cdoc-preview-head`, `.cdoc-open-pg`, theme builder controls | TV | Let preview tab row wrap or scroll inside its own box; make theme pages single column |
| C4 | P2 | 1.4.11, 1.4.1 | Tabs, forced-colors | Computed in `forced-colors: active`: selected and unselected tab both `border-bottom 2px rgb(255,255,255)`, same weight, no other mark. Selected state is invisible. (T7 marked fixed; this gap remains) | TV | In forced-colors give the selected tab `border-bottom-color: Highlight` or a different width, or unselected `transparent` handled via `forced-color-adjust` |
| C18 | P2 | 2.4.3, 2.1.1 | tour | Opened 6 of 6 times on fresh page loads (Enter and click, reduced motion on and off): focus stays on "Start tour" instead of the card (`inside:false` after 3s), so Escape and arrow keys do nothing until Tab. Contradicts the doc comment and `meta.json`. Cause: `tour.tsx:138` effect runs while `card.current` is still null. Tab then reaches Skip tour and Next, and the trap works once focus is inside | TV | Focus the card in a layout effect or callback ref once it mounts, and add an e2e test (none exists) |
| C5 | P2 | 4.1.2 | navigation-menu (open) | axe `aria-hidden-focus`: `<span aria-hidden="true" tabindex="0">` (Radix focus proxy) inside the list | TV | Own the proxy: `tabindex=-1`, or drop `aria-hidden` |
| C6 | P3 | 1.3.1, 2.4.1 | Docs shell, 187 pages | `aside.docs-side` is an unnamed `complementary`; AX tree lists `complementary ""` (known T2, still open) | TV | `aria-label="Components"` or make it `nav` |
| C7 | P3 | 1.3.1 | Docs rail, 159 of 189 pages, every component page in warm, dark, midnight | axe `region`: `dl.docs-facts` is outside any landmark (side effect of making `.docs-rail` a div) | TV | Put the facts list inside the Toc `nav` or an `aside` with a name |
| C8 | P3 | 4.1.2, 2.4.3 | Docs code blocks | 6 `pre[tabindex=0]` per page, no role or name, `scrollWidth <= clientWidth` at 1280 so they are tab stops that scroll nothing (known T3, still open) | TV | `tabindex` only when scrollable, plus `role=region` and label |
| C9 | P3 | 4.1.2 | toast / toaster | The 2 focusable `generic` proxies are `<span tabindex="-1">`: focusable by script, not by Tab (T1 says "reachable by Tab"; Tab goes trigger -> `li` toast) | TV | Keep as known; reword T1 and add `aria-hidden` |
| C10 | P3 | 1.4.12 | Docs pager `.pager-desc` on ~all pages | With WCAG spacing overrides the box is 50-66px of text in a 33px clipped box | TV | Remove the fixed height / line clamp |
| C11 | P3 | 1.3.1 | empty-state, page-header playground | axe `empty-heading`: `.empty-title` renders an empty heading when no title | TV | Render the heading only when `title` is set |
| C12 | P3 | 1.3.1, 2.4.6 | app-shell, block-dashboard-shell, tools/blocks (+3 block pages) | h1->h3 jumps (6 pages); nested and duplicate `<main>` (3 pages); duplicate nav names `.docs-tabs` (9 pages) | TV | Demo blocks render `<div role=...>` in docs, or demote their headings |
| C13 | P3 | 2.5.8 | Docs header version link `a.docs-version` | 49x23px on 131 pages, neighbour inside the 24px circle | TV | min-height 24px |
| C14 | P3 | 2.2.2 | marquee, border-beam, orbiting-circles, shimmer-button, typewriter, spinner | Infinite animations under no-preference (focus.json). Marquee pauses on hover or focus-within only; none has a pause control. All stop under `reduce` | TV/INF | Offer a pause control on marquee; document that decorative loops rely on reduced motion |
| C15 | withdrawn | - | tree | Probe artefact: my selector matched the treeitems of both examples on the page, so two `tabindex=0` meant one per tree. Each tree has one tab stop | - | none |
| C16 | P3 | 1.3.1 | Docs component pages | ~9 `region` landmarks named like "Import Link to Import" (heading plus anchor link text) | INF | `aria-labelledby` the heading text only; hide the anchor link name |
| C17 | P3 | 2.1.1 | context-menu | Keyboard-invoked `contextmenu` event with clientX/Y 0,0 opens the menu at (8,8), away from the trigger. Browsers differ on the coordinates, so low confidence | TV (synthetic) / INF | If coords are 0, anchor to the trigger rect |

Not findings: toc link follow leaves `activeElement` on body (native fragment navigation, sequential start point is kept); Shift+F10 could not be sent by CDP (no native `contextmenu`), so tested with a dispatched event (opens, named "File actions", focus in menu, Escape returns).

## 2. Coverage matrix (136 component pages; axe = warm, dark, midnight)

| Group | axe 3 themes | keyboard | name/tree | contrast | 320px / zoom | Result |
|---|---|---|---|---|---|---|
| All 136 component pages | pass except `region` dl (C7), see C12 for block pages | Tab sweep: 563 stops, 0 without visible focus ring, 0 obscured | repo ax suite 42/42 | tokens: pass | 43 pages scroll sideways (C3) | partial |
| dialog, alert-dialog | pass (open state) | pass: trap 8x Tab and Shift+Tab, Escape, focus returns | named, described, `:modal` | pass | pass | **pass** |
| drawer, command | pass (open) | pass (e2e + probe) | named | pass | pass | **pass** |
| popover, tooltip, hover-card | pass (open) except C7 | pass: Enter, Escape, return; tooltip hoverable and dismissable (1.4.13) | `role=tooltip`, describedby | pass | pass | **pass** |
| dropdown-menu, menubar, context-menu | pass except C7 | pass (e2e typeahead, arrows, Home/End); context-menu event path see C17 | menu named | pass | pass | pass |
| select, combobox, multi-select, date-picker | pass except C7 | pass: ArrowDown opens, Enter picks, Escape, grid arrows, PageDown, Home | listbox named | pass | pass | pass |
| tabs, accordion, toolbar, toggle-group, segmented, radio-group | pass | pass: arrows, Home/End, one effective tab stop | pass | pass | pass | tabs fail forced-colors (C4) |
| navigation-menu | **fail** C5 | pass | pass | pass | C3 | fail |
| tree | pass | **partial** C15 | levels, setsize ok | pass | pass | partial |
| toast, toaster | pass | pass: F8 moves focus in, Undo and Dismiss are buttons | region "Notifications"; success `role=status`, error `alert`/assertive | pass | pass | pass (T1 reworded, C9) |
| toc (library and docs rail) | pass | pass: Tab reaches links, Enter sets hash, `aria-current=location` follows scroll | `nav` "On this page" and "Sections" | pass | pass | **pass** |
| marquee and 5 other animated | pass | n/a | n/a | n/a | n/a | C14 |
| sortable-list | pass | pass: Space picks up, arrows move, polite live region, Escape restores, End then Space drops, Tab cancels; handle `aria-pressed` + description | pass | pass | pass | **pass** (2.5.7 keyboard alternative works) |
| resizable | pass | pass: separator value/min/max/orientation/controls, arrows 5, PageUp 10, Home 15 and End 90 (limits enforced) | pass | pass | pass | **pass** |
| tour | pass | **fail** C18 | dialog named and described | pass | pass | fail |
| color-picker | pass | pass: swatches `aria-pressed`, hex shows `aria-invalid` + message while invalid, reverts on blur | group named | pass | pass | **pass** |
| virtual-list | pass | pass: one tab stop, arrows/Page/Home/End, 1/10000 to 10000/10000 | named | pass | pass | **pass** |
| data-grid | pass | pass: one tab stop, arrows, Home/End, PageDown, Ctrl+End reaches row 100001 (real Ctrl+End key not delivered by the CDP driver, verified with a dispatched event) | `aria-rowcount=100001`, `colcount=5`, named | pass | pass | **pass** |
| rich-text-editor | pass | pass: Ctrl+B, Tab leaves editor, toolbar roving | `textbox`, `aria-multiline`, named | pass | pass | **pass** |
| /playground/ | pass (0 violations) | n/a | title, 1 `h1`, 1 `main` | n/a | n/a | pass (renders when loaded directly; the e2e `open()` helper times out because it waits for `.docs-main h1`) |
| Others (~88: display, charts, blocks, layout) | pass | focus ring only | axe only | axe only | axe only | not deeper |

Cross-cutting, TV: skip link is the first Tab stop, visible, lands on `main#main` (all 189 pages); one `h1` and `lang` on every non-block page; `prefers-reduced-motion: reduce` leaves 0 running animations on all 136 pages; 200% root text size, no horizontal overflow; 3 themes x 8 accents contrast (below).

## 3. Status of the 10 known findings (docs/a11y-report.md)

All 10 reproduced by `npm run ax`: "42/42 components pass, 10 known finding(s)". Toast 2, toaster 2, docs-page-structure 6.

| Known | Status |
|---|---|
| toast x2, toaster x2 (T1) | Still open, but changed: the proxies are `tabindex=-1`, not Tab-reachable (C9). Impact lower than written |
| docs-page-structure x6 (T3) | Still open: 6 `pre[tabindex=0]`, none scrolls at 1280 (C8) |
| T2 unnamed complementary | Still open (C6); not counted in the 10 |
| T4 context-menu, T5 tooltip, T6 combobox | Fixed, probes F7a, F7c, F7d pass (re-run: "0 of 6 probes show a barrier") |
| T7 forced-colors | Rules exist (3 forced-colors, 1 prefers-contrast), ring is a 2px outline, but tabs selection is lost (C4) |
| Firefox / WebKit gap | Not run, Chrome only (see 6). Native anchor positioning opt-in: not exercised (default `place()` path used) |

## 4. Verified clean

- Repo suites: `npm run ax` 42/42, `npm run e2e` 123/123 (195s), `node scripts/e2e/probe.mjs` 0 of 6 barriers.
- Dialog and alert-dialog: native `<dialog>` with `:modal`, labelled and described, trap holds, background not reachable, Escape returns focus; alert-dialog focuses the safe action; backdrop click does not close it.
- Tooltip meets 1.4.13 (hoverable, dismissable with Escape, persistent). Popover: Escape returns, Tab leaves without a trap.
- Library Toc: labelled nav, real anchors, single `aria-current=location`, works in forced-colors by mark, not colour.
- Token contrast over 3 themes x 8 accents (computed): text 15.3:1 min, muted 5.02, accent-text 4.67, on-accent 4.7, accent ring vs background 3.29 (>=3), danger/warning/ok >=6.05. Input and select borders use full foreground (not the 1.6:1 `--rule` hairline).
- Focus ring: solid 2px outline on all 563 tab stops across 136 pages, none hidden or obscured; stays an outline in forced-colors.
- Skip link, landmarks `banner`, `main`, named `navigation` on every non-block page.

## 5. Commands run

```
npm run build
npm run ax -- --no-write        # 42/42, 10 known
npm run e2e                     # 123/123
node scripts/e2e/probe.mjs      # 0 of 6
node audit-out/sweep.mjs        # axe wcag2a/aa, 21a/aa, 22aa, best-practice, 189 pages warm + structure, targets, text-spacing, 320px reflow
node audit-out/sweep-themes.mjs # axe dark and midnight, 136 component pages
node audit-out/keyboard.mjs     # 37 keyboard and open-state probes (13 failures reviewed by hand: 9 probe artefacts, 4 real: C5, C7, C15, plus open-state C7)
node audit-out/keyboard{2,3,4}.mjs, tour.mjs  # sortable, resizable, tour, color-picker, virtual-list, data-grid, rich-text, playground
node audit-out/focus.mjs        # 563 tab stops, motion reduce vs normal
node audit-out/{contrast,forced,known,misc,misc2,ctx,followup,retry}.mjs
check_contrast tool: #8c8279 on #21211e = 4.29 (fail), #FF4500 on #FAFAF5 = 3.29
```

## 6. Could not check

- **Screen readers** (NVDA, JAWS, VoiceOver, TalkBack): none installed here. Names, roles, states and live regions come from Chrome's accessibility tree and DOM (TV for the tree, INF for what is spoken). The manual flows in docs/a11y-report.md still need a person.
- **Firefox and WebKit**: Firefox is not installed, Playwright is not in the repo, and installing a browser needs network access I was not given. Safari is installed but needs "Allow Remote Automation" and safaridriver, which is a user setting. Only Chrome was driven.
- **Native Shift+F10 / ContextMenu key**: CDP cannot produce the browser's `contextmenu` event from a key, so tested with a dispatched event (C17). Same driver limit for a real Ctrl+End (data-grid verified with a dispatched event).
- **Real browser zoom**: emulated as a 320x256 viewport (same CSS width, the WCAG test setup); text-spacing and 200% text size by injected CSS.
- **Touch targets**: rect check with an approximate 24px-circle overlap test, not a hit-test.
- Remaining ~88 components (display, charts, blocks, layout) got axe in 3 themes and the focus-ring check, not a per-widget keyboard script. They have no composite widget behaviour, so the risk is low.
- The Accessibility Auditor agent was not used; the work was scripted directly.

## 7. Fix status (branch claude/audit-c-a11y-69dda9, after the audit)

| ID | Status |
|---|---|
| C1 | Fixed: `.alert-description` uses 78% foreground instead of `--muted` (alert.css) |
| C2 | Fixed: wordmark hidden visually below 440px, still named for screen readers; overlap 0 at 320, 360, 375 |
| C3 | Fixed: 52 pages overflowed at 320px, 0 do (code-block and preview min-width, inline code wrap, theme gallery and builder single column) |
| C4 | Fixed: forced-colors tabs, selected `Highlight`, inactive `Canvas` (tabs.css), verified computed |
| C5 | Not fixed: Radix NavigationMenu focus proxy; removing `tabindex` would break Tab into the panel. Upstream, same class as T1 |
| C6, C7 | Fixed: `aside` named "Documentation sidebar"; facts list is its own named `aside` |
| C8 | Fixed: CodeBlock is a tab stop only when it scrolls, then a named group (ax known findings 10 to 4) |
| C9 | Documented in docs/a11y-report.md (T1 reworded), still open |
| C10, C13 | Fixed: pager description no longer clamped; version link min-height 24px |
| C11 | Fixed: EmptyState renders no heading for an empty title (+ test) |
| C12 | Not fixed: block demos embed whole page shells (`main`, `h1`); demo artefact |
| C14 | Fixed for marquee: new `pausable` prop (Pause / Play, aria-pressed, + tests and demo); decorative effects unchanged |
| C15 | Withdrawn (probe artefact) |
| C16 | Not fixed |
| C17 | Fixed: keyboard-invoked contextmenu at 0,0 anchors to the trigger |
| C18 | Fixed: tour card takes focus once placed; new e2e test; 6 of 6 fresh opens now focus the card and Escape closes |

Re-run after the fixes: `npm test` 1472 passed, `npm run check` pass, `npm run e2e` 124/124 (one new test), `npm run ax` 42/42 with 4 known findings (was 10).
