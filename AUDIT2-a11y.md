# AUDIT2-a11y: accessibility at runtime, WCAG 2.2 AA (origin/master 98e5ce4, v0.5.0)

Report only. Nothing fixed, committed or pushed. Built `npm run build` (exit 0) and drove the built docs site (`apps/docs/dist`) in real Chrome over CDP with the repo's own `scripts/lib/cdp.mjs` and `scripts/e2e/page.mjs` (real key and pointer events). Chrome only. No screen reader. Probe scripts are in the shared notes folder, `audit2-a11y-scripts/`.

Legend: **TV** tool-verified (DOM, computed style, axe, key events in Chrome). **INF** inferred.

## 1. Result at a glance

| Check | Result |
|---|---|
| `npm run ax` | 42/42 pass, 4 known findings (toast x2, toaster x2) |
| `npm run e2e` | 124/124 pass (321s) |
| axe (wcag2a/aa, 21aa, 22aa, best-practice), 190 pages x warm/dark/midnight | Only landmark/heading structure on 10 block/demo pages, 1 empty heading, 1 `region` (section 2) |
| Contrast: tokens, 3 themes x 8 accents | Pass. fg 15.3, muted 5.02, accent-text 4.67, on-accent 4.70, danger/warning/ok >= 6.05, accent vs bg 3.29 |
| Contrast: axe `color-contrast`, 29 pages x 3 themes x 8 accents (696 runs) | 0 violations |
| Reflow at 320x256 (400%), all 190 pages | 0 pages scroll sideways (C3 was 43) |
| Target size 2.5.8, all 190 pages (rect plus 24px-circle spacing test) | 0 failures; docs version link is 24px tall now |
| Keyboard focus visible and not covered by the sticky header, 187 Tab stops on 3 pages | 0 covered |
| `prefers-reduced-motion: reduce`, all 190 pages | 0 infinite animations running |
| Text spacing (1.4.12) on a component page | no clipped text |
| `tabindex > 0`, duplicate ids, missing `lang` or `title`, h1 count (non-demo pages) | none |

## 2. Findings (new, and earlier items still open)

| ID | Sev | WCAG 2.2 | Where | Evidence | Ver. | Suggested fix |
|---|---|---|---|---|---|---|
| N1 | P2 | 2.4.3 Focus Order | popover, date-picker (tested); date-range-picker, hover-card share the same floating layer (INF, not tested) | Open the popover, press Tab. Popover (focus on the dialog container, 0 focusables in the demo): Tab 1 goes to `body`, Tab 2 to "Skip to main content" and the popover closes. Date-picker: Tab from a day button goes straight to "Skip to main content". Shift+Tab from the popover lands on "View as Markdown", not the trigger. The panel is portaled to the end of `body`, so sequential order does not continue from the trigger. Position on the page is lost and the user restarts at the top | TV | On Tab or Shift+Tab out of a non-modal floating panel, close it and move focus to the trigger, then let the browser continue (so the next Tab goes to the element after the trigger). Or render the panel right after the trigger in DOM order. Add an e2e test that Tab after the popover lands on the next control |
| C5 | P2 | 4.1.2 | navigation-menu (open) | axe `aria-hidden-focus`: `li:nth-child(2) > span[aria-hidden="true"]` (Radix focus proxy, still has `tabindex`). Reproduced on the Products trigger after Enter | TV | Open since audit C. Own the proxy (`tabindex=-1` and `aria-hidden`), or drop `aria-hidden`, or replace Radix NavigationMenu with the own layer |
| C12 | P3 | 1.3.1, 2.4.6 | `/docs/tools/blocks/` (10 h1), app-shell, block-dashboard-shell, block-empty-page, block-hero (3 each), block-login, block-settings-form, block-signup, heading (2), page-header (3) | Multiple `h1`. Nested and duplicate `main` on tools/blocks, app-shell (4 `main`: docs main plus 3 demo mains), block-dashboard-shell. axe `landmark-unique` on 10 pages (`.docs-tabs` x2 etc.), `landmark-main-is-top-level`, `landmark-no-duplicate-main` | TV | Open since audit C. Render block demos with `div role=...` and demoted headings inside the docs page, and name the duplicate `.docs-tabs` navs |
| C14 | P3 | 2.2.2 Pause, Stop, Hide | border-beam, orbiting-circles, shimmer-button, typewriter (caret blink), marquee default | Under `no-preference`, infinite animations are running: `border-beam-spin`, `orbit-turn`, `shimmer-sweep` (x2 on a page), `typewriter-blink`, `marquee-run`, plus `spin` on spinner. All stop under `reduce`. Marquee now has `pausable` (opt-in, Pause/Play, `aria-pressed`), but the default Marquee still only pauses on hover or focus-within. None of the other four has a control. Spinner is a loading indicator (essential, exempt) | TV | Open for four components and the Marquee default. Make `pausable` the default, or state in docs and `meta.json` that these are decorative and rely on reduced motion. Typewriter caret: stop blinking after 5 s |
| C16 | P3 | 1.3.1, 2.4.6 | Every component page (about 9 `region`s) | Chrome AX tree names: "Import Link to Import", "Usage Link to Usage", "Examples Link to Examples", "Props Link to Props", "Data Attributes Link to Data Attributes", "Accessibility Link to Accessibility", "Related Link to Related". The heading's anchor link `aria-label="Link to X"` is concatenated into the section name | TV | Open since audit C. Put `aria-labelledby` on the heading text span only, or `aria-hidden` the anchor and give it its own label |
| N2 | P3 | 2.1.1, 2.1.2 (APG) | dropdown-menu, menubar, select listbox | With a menu or listbox open, Tab does nothing: focus stays on the same item and the popup stays open (tested 5 presses). Escape works, so there is no hard trap, but APG and native behaviour is Tab closes the popup and moves on | TV | Tab (and Shift+Tab) closes the menu or listbox, then moves focus on (same fix as N1 gives the order) |
| N3 | P3 | 1.4.11 | slider, forced-colors | Computed with `forced-colors: active`: `.slider-track` and `.slider-range` both `rgb(255,255,255)`, so the filled part looks like the unfilled track. Value is still shown by the thumb position and `aria-valuenow` | TV (computed) | Draw the range with `Highlight` or a thicker border, and the track with `GrayText` or a dashed border, in a forced-colors block |
| N4 | P3 | 1.3.1 | page-header playground (`/docs/components/page-header/`) | axe `empty-heading`: `.pg-stage > .page-header h1[role=heading][aria-level=2]` has no text (same class of defect as C11, which fixed EmptyState only) | TV | Render the heading only when a title is set, as EmptyState now does |
| N5 | P3 | 2.2.1 Timing Adjustable | toast with an action (Undo) | Auto-dismisses at about 4.9 s. It pauses while hovered or while focus is inside (still present after 7 s with focus inside), and F8 moves focus in. A keyboard or screen-reader user who is not already in the toast has about 5 s to find Undo. The `duration` prop exists | TV | Document that toasts with an action should use a longer or `Infinity` duration; consider no auto-dismiss when an action is present |
| N6 | P3 | 1.4.10 | Docs shell at 320x256 (400% zoom) | Sticky header is 96px of a 256px viewport (37.5%). Content is not lost (no sideways scroll, targets fine), but only 160px is left for reading | TV | Make the header non-sticky below about 480px, or collapse it to one row |
| N7 | P4 | best-practice (axe `region`) | Open dropdown-menu, menubar, select, tooltip, hover-card | The portaled popup is outside any landmark while open (5 of 18 open states). WCAG does not require this; axe flags it | TV | Optional: portal into a landmark or accept as advisory |
| C9 | P4 | 4.1.2 | toast / toaster | Still open and documented. `npm run ax` lists 4 known findings, all this | TV | As audit C |

## 3. Status of earlier items (C1 to C18, plus the four you named)

| ID | Status on 98e5ce4 | How checked |
|---|---|---|
| C1 alert contrast | Fixed | axe color-contrast, 29 pages x 24 theme/accent combos, 0 hits |
| C2 header/search overlap | Fixed | 320px: header buttons 42x36, 36x36, 30x30, 40x32; no sideways scroll |
| C3 reflow at 320 | Fixed | 0 of 190 pages overflow (was 43) |
| C4 tabs forced-colors | Fixed | active tab bottom border `rgba(26,235,255,.8)` (Highlight), inactive `rgb(0,0,0)`; computed |
| C5 Radix focus proxy | **Still open** | navigation-menu axe `aria-hidden-focus` |
| C6 unnamed complementary | Fixed | AX: "Documentation sidebar", "Package facts" |
| C7 `dl.docs-facts` outside landmark | Fixed | axe `region` gone on all 159 pages |
| C8 scroll-less `pre[tabindex]` | Fixed | `docs-page-structure` known findings 6 to 0 |
| C9 toast proxies | Documented, open | ax known findings 4 |
| C10 pager clamp, C13 version link 24px | Fixed | no clipped text under spacing overrides; version link 24px, 0 target failures |
| C11 EmptyState empty heading | Fixed for EmptyState; same defect in PageHeader (N4) | axe |
| C12 block page structure | **Still open** | section 2 |
| C14 animations lacking pause | **Still open** for 4 components and the Marquee default (Marquee has opt-in `pausable`) | section 2 |
| C15 | Withdrawn (earlier) | n/a |
| C16 region names | **Still open** | AX tree |
| C17 context-menu keyboard coords | Fixed | `contextmenu` at 0,0 opens the menu (anchored at the trigger centre, 663,400) and focus goes into "File actions" |
| C18 tour focus | Fixed | focus is on the tour card after Enter, Tab cycles Skip tour and Next, Escape closes and focus returns; e2e passes |

## 4. Overlays: runtime behaviour (real keys, Chrome)

| Component | Open (key) | Focus on open | Trap / Tab | Escape | Name and role | axe (open) |
|---|---|---|---|---|---|---|
| dialog | Enter | "Keep both" (safe action) | Tab cycles inside, 5 of 5 | closes, focus on trigger | `dialog` `:modal`, labelled, described | pass |
| alert-dialog | Enter | "Keep it" | cycles | returns | `alertdialog` `:modal`, described | pass |
| drawer | Enter | Close | single stop, holds | returns | `dialog` `:modal`, named "Filters" | pass |
| command | Enter | combobox input | holds | returns | named "Command palette"; `aria-activedescendant`; live "6 results", "No results" | pass |
| popover | Enter | the dialog container | Tab leaves, N1 | closes, focus on trigger | `dialog` "Entry details" | pass |
| date-picker | Enter | today's day button | Tab leaves, N1 | closes | `dialog` "Choose a date"; arrows, PageDown change month with polite live "January 2027"; Enter picks | pass |
| dropdown-menu / menubar | Enter or ArrowDown | first item | N2 | closes, focus on trigger | `menu`, `menuitem`; Home/End work | `region` (N7) |
| select | Enter or ArrowDown | selected option | N2 | closes, focus on trigger | combobox named by its label ("Sync every"); listbox, `aria-selected` | `region` (N7) |
| combobox | typing, ArrowDown | stays in the input | Tab leaves | closes the list, keeps text | `aria-controls`, `aria-activedescendant` resolves, `aria-autocomplete=list` | pass |
| tooltip | focus | stays on trigger | n/a | dismisses, focus stays | `role=tooltip`, trigger `aria-describedby`; hoverable (pointer on the tooltip keeps it) | `region` (N7) |
| hover-card | focus | stays on link | Tab leaves | dismisses | trigger has no `aria-describedby` (supplementary content only) | `region` (N7) |
| context-menu | contextmenu event | first item | n/a | closes, focus on trigger | named "File actions" | pass |
| navigation-menu | Enter | stays on trigger, Tab enters panel links | Tab continues to the panel | closes | links | **C5**, `landmark-unique` |
| tour | Enter | the card | Tab cycles Skip tour and Next (trap inside a non-modal tour) | ends, focus on trigger | `dialog` named "Create", described, polite "Step 1 of 3" | pass |
| toast | Enter | stays on the button | F8 moves focus into the toasts | n/a | region "Notifications", `role=status`; Undo and Dismiss are buttons | pass |
| docs search (Ctrl+K) | key | input | holds | returns | `:modal`, combobox `aria-activedescendant`, live "189 results" then "4 results" | pass |
| docs mobile nav (320px) | Enter on "Open navigation" | first link | holds | closes, focus on the button | `dialog` | pass |

At 320x256 (400%) every overlay stayed inside the viewport (dialog, alert-dialog, drawer, menu, select, popover, date-picker, command, tour); content scrolls inside the panel, focused item visible, no page-level horizontal scroll.

## 5. Docs site

| Check | Result |
|---|---|
| Skip link | First Tab stop, visible, Enter moves focus to `main#main` (TV) |
| Landmarks | banner, main, navigation "Main", "Documentation", "Previous and next", "On this page", complementary "Documentation sidebar" and "Package facts" (TV, AX tree) |
| Header controls | All have names; theme toggle "Toggle light and dark theme"; "Customise" has `aria-expanded` (TV) |
| Headings | One `h1` on every page except demo-heavy block pages (C12) |
| Sticky header and focus 2.4.11 | `scroll-padding-top` is `auto` and the header is 104px, but 187 Tab stops on 3 pages were never covered (TV). Adding `scroll-padding-top` is cheap insurance |
| Reduced motion | 0 infinite animations on all pages (TV) |
| Forced-colors | Tabs fixed. Switch, checkbox, radio, progress fill, toggle: checked and unchecked differ (computed). Slider range = track (N3) |

## 6. Could NOT be tested

- **Screen readers** (NVDA, JAWS, VoiceOver, TalkBack): none run. Names, roles, states and live regions come from the Chrome accessibility tree and DOM; what is spoken is INF.
- **Firefox and WebKit**: Chrome only. Native anchor positioning paths are not exercised in other engines.
- **forced-colors visuals**: headless Chrome with `forced-colors: active` renders black canvases in screenshots, so forced-colors was judged from computed styles, not images. Windows High Contrast with real system colours was not tried.
- **Real 400% browser zoom**: emulated as a 320x256 viewport; sticky-header and text-size effects from true zoom were not seen.
- **Native Shift+F10 / ContextMenu key and Ctrl+End**: CDP cannot send the browser's `contextmenu` from a key; tested with a dispatched event (C17 path).
- **Touch**: target size by rects and a 24px-circle approximation, not a hit test; no touch gestures.
- Per-widget keyboard scripts were run for 18 overlay and picker flows; the other ~110 components got axe (3 themes), the Tab-order and focus-ring check, target size and reflow only. Sortable list, resizable, data-grid, tree, rich-text, virtual-list were covered by the 124 e2e tests, not re-driven by hand.
- Accent coverage for non-text contrast (1.4.11) is by token only (accent vs background >= 3.29 in all 24 combos), not each component.
- Cookie/consent, authentication and forms with real server errors: not applicable to the static docs site.

## 7. Fix status (same worktree, uncommitted; verified in Chrome)

Verification after the fixes: unit tests 1553 pass, typecheck clean, `npm run size` 0 failures (no budget raised), `npm run ax` 42/42 (4 known), `npm run e2e` 125/125 (one e2e test added, one rewritten), axe over 190 pages x 3 themes.

| ID | Status | What changed |
|---|---|---|
| N1, N2 | Fixed | `useDismiss` takes an optional `leavesPanel` (new `popover/tab-out.ts`): Tab/Shift+Tab out of a popover, date-picker, menu or select closes it and carries on from the trigger. Unit test and e2e test added |
| C5 | Fixed | NavigationMenu proxies taken out of the tab order; Tab hand-over done in code. axe `aria-hidden-focus` gone |
| C16 | Fixed | doc sections use `aria-label` |
| C12 | Fixed | demo headings become level 4 (3 on playground/blocks), duplicate nav and region names get the example's name, table regions get unique names, `AppShell` inside another `main` renders a plain container and no skip link (unit test added). The e2e shell tests were updated to match |
| N4 | Fixed | `PageHeader` renders no heading for an empty title (test added) |
| N3 | Fixed | slider forced-colors: range `Highlight`, track dashed |
| N6 | Fixed | docs header not sticky when the viewport is under 520px high |
| C14 | Fixed for Marquee (`pausable` now defaults to true), typewriter caret stops after 4 blinks; border-beam, orbiting-circles, shimmer-button pause on hover/focus only (no button) |
| N5 | Docs only | toast `meta.json` now says to lengthen `duration` for actions |
| N7 | Not changed | only the open Tooltip in the playground is flagged (axe best-practice `region`, not WCAG). Portaling overlays into the nearest landmark was tried: it broke the date-picker 375px layout e2e and the Popover/Select/Tooltip size budgets, so it was reverted |
| C9 | Not changed | toast proxies, documented |

axe on 190 pages x 3 themes now reports one finding: `region` on `/docs/components/tooltip/`.
