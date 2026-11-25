# Screen readers and Monoline

**Short version: Monoline has an automated accessibility-tree check, and no screen reader testing at all.** Nobody has tried these components with NVDA, JAWS, VoiceOver or TalkBack yet. The claim "WCAG 2.2 AA" is a goal for the components, backed by axe, keyboard tests and the check described here. It is not a conformance statement and not a substitute for listening to the components.

## What is checked

`npm run ax` opens the built docs site in real Chrome and, for about forty components, does what a keyboard user does: it opens the dialog, the menu and the popover, presses Tab and the arrow keys, and then reads the accessibility tree Chrome builds from the page. That tree is what screen readers on Windows, macOS and Android consume, so it is the best automated stand-in for them. For each component it asserts:

- every control has a role and a non-empty accessible name;
- the states a user should hear are present: expanded, checked, selected, pressed, invalid, required, disabled, busy, current, sort order;
- relationships resolve to text: `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-activedescendant`;
- the node that has focus after real key presses is the one the pattern promises;
- dialogs have a name and a description, report that they are modal, and nothing behind them stays in the tree;
- toasts, alerts and status messages sit in live regions with the right politeness;
- nothing focusable is left with no role (a "generic" element a screen reader cannot announce), and each docs page has one main landmark and no skipped heading levels.

The expectations are plain data in `scripts/ax/expectations.ts`: to cover another component, add one entry. The run writes `docs/a11y-report.md`, which lists for each component the role, name, states, the announcement the tree implies ("Save, button, collapsed") and any finding. CI runs it on every pull request (the `ax` job in `.github/workflows/ci.yml`) and fails when the report would change.

## What is not checked

- **How a screen reader words it.** NVDA, JAWS, VoiceOver and TalkBack each build their own sentence from the tree, in their own order, with their own verbosity settings. The "expected announcement" in the report is a template, not a recording.
- **Whether it is a good experience.** Order, amount of speech, focus and browse mode switching, rotor and element lists, touch gestures, braille output.
- **Other browsers.** Only Chrome's tree is read. Firefox and Safari build theirs differently.
- **Anything that needs a person:** whether labels make sense, whether instructions are clear, whether a flow can be finished without sight.
- **Target size, zoom, text spacing and forced colours.** Not part of this check.

## What was already found and fixed

Reading the tree found real problems that axe had passed: decorative glyphs ("+", "−", "↓", "✓") that were read as part of names and values, dialogs that did not say they were modal, a focusable carousel track with no role, an unnamed suggestion list. They are listed, with the fixes, at the top of `docs/a11y-report.md`.

## Manual testing still to do

`docs/a11y-report.md` has a checklist with the fifteen most important flows and a short setup per technology: NVDA, JAWS, VoiceOver on macOS and iOS, and TalkBack. Until someone runs it, treat the accessibility notes on every component page as intent. If you find a barrier, an issue that names the component, the screen reader and version, the browser and the steps is the most useful thing you can send.

## Using the components well

The components give you names, roles and states. You still supply the words: every icon-only button needs an `aria-label`, every form control needs a label (use `Field`), every menu opened from a context needs a name (`aria-label`), and headings and landmarks depend on where you place things. No component can fix a missing label for you.

---

# Manual test script (owner runs this)

Agents cannot run a screen reader. This script is for you. About 45 minutes for VoiceOver on the first pass, the same again for NVDA. Record what is **said**, word for word, not "worked". Copy the results table at the bottom into an issue or into this file.

Open the live docs: `npm run build && npx vite preview -w apps/docs` (or the Pages site). Use the page for each component under `/components/<name>`; the first live example is the one to test.

## VoiceOver, macOS (Safari first, then Chrome)

Setup: `Cmd+F5` turns VoiceOver on. Open VoiceOver Utility, Web, and tick "Quick Nav" off for the first pass. In Safari: Settings, Advanced, tick "Press Tab to highlight each item on a webpage" (otherwise Tab skips buttons and links).

Keys: VO = `Ctrl+Option`. `VO+Right/Left` next/previous item. `VO+Space` activate. `VO+U` rotor (Left/Right changes list: Landmarks, Headings, Links, Form Controls). `VO+Shift+Down` into a group, `VO+Shift+Up` out. `Esc` closes overlays. `Ctrl` stops speech.

Do each flow once with Tab and once with VO+Right.

| # | Flow (page) | Do | You should hear |
|---|---|---|---|
| 1 | Skip link, landmarks (any page) | Tab once; activate; open the rotor, Landmarks, then Headings | "Skip to content, link"; one main; a named navigation; headings in order, none skipped |
| 2 | Button (button) | Tab to each, including the disabled and loading ones | name, "button"; disabled: "dimmed"; loading: busy |
| 3 | Field with error (input or field) | Tab in, submit invalid | label, hint, then the error with the field; the error is spoken when it appears |
| 4 | Checkbox, radio, switch | Space on each; arrows in the radio group | "checked/unchecked" (switch: "on/off"); radio group name and "1 of 3" |
| 5 | Select (select) | Enter on the trigger, arrows, Enter | trigger: "combobox, collapsed"; options with "selected"; after choosing, the new value is read |
| 6 | Combobox (combobox) | Type a letter, ArrowDown, Enter | number of results spoken; option names; chosen value read back |
| 7 | Tabs (tabs) | arrows between tabs | "selected", position "2 of 3", panel name after Tab |
| 8 | Accordion | Enter on a header | "expanded" or "collapsed"; no "plus" or "minus" spoken |
| 9 | Dialog and alert dialog | Open from the trigger, Tab around, Esc | title (and description) read once; "dialog"; page behind unreachable; focus back on the trigger |
| 10 | Dropdown menu, menubar, context menu (context menu: your trigger must be a button, see `docs/e2e-findings.md` T4) | Enter, arrows, Esc | menu name, "menu item", "1 of N"; Esc returns to the trigger |
| 11 | Popover, tooltip, drawer | open each | tooltip text read as a description of the control; drawer as a dialog; the drawer has a Close button |
| 12 | Toast (toast) | trigger a toast, do not move focus | text spoken once, politely |
| 13 | Form error summary | submit an empty form | summary spoken; each link jumps to its field; each invalid field says why |
| 14 | Data table and grid | sort a column; arrows in the grid | column and row headers with each cell; "sorted ascending" |
| 15 | Calendar, date picker | arrows by day, PageDown by month; pick a day | full date for each day; month change spoken; picked date read in the field |
| 16 | Slider, rating, OTP, file upload | arrows on the slider; type a code; choose a file | value each step; each digit named; file name |

Also try once: VoiceOver with `prefers-reduced-motion` on (System Settings, Accessibility, Display, Reduce motion), and Increase contrast on. Both should leave every flow working.

## NVDA, Windows (Firefox and Chrome)

Setup: install NVDA (free, nvaccess.org). `Ctrl+Alt+N` starts it. Open the docs in Firefox, then repeat in Chrome. NVDA key = `Insert` (or `CapsLock`). Press `NVDA+Space` once to switch browse mode and focus mode; browse mode reads like a document, focus mode passes keys to the page.

Keys, browse mode: `Down` read line, `Tab` next control, `D` landmark, `H` heading, `B` button, `F` form field, `K` link, `T` table. `NVDA+F7` elements list. `Enter` or `Space` activates. `Ctrl` stops speech.

Run the 16 flows above with these changes:

1. In browse mode, move to the control with `Tab` or its letter key, then activate it. NVDA should switch to focus mode on its own for fields, selects, comboboxes, sliders and menus. If it stays in browse mode and the arrow keys do not move the widget, write that down: it is a role problem.
2. Dialog: NVDA should read the title and the first control. Press `NVDA+Down` (say all) and check the description is read.
3. Menus: after Esc, focus must land on the trigger and NVDA must read it.
4. Toast and status: NVDA reads live regions even when focus stays elsewhere. Turn off "Report dynamic content changes" only if you want to prove it is the live region speaking.
5. Data table: `Ctrl+Alt+Arrow` moves by cell and speaks the headers.
6. Forced colours: turn on a High Contrast theme (Settings, Accessibility, Contrast themes). Check focus ring, checked states and borders are visible in each flow. This is the other gap (`docs/e2e-findings.md` T7).

## Results table (copy per screen reader and browser)

| Flow | Said (word for word) | Problem? (none / wrong name / wrong state / not announced / focus lost / other) | Component | Browser and version |
|---|---|---|---|---|
| 1 | | | | |

Report a problem as an issue with: component, screen reader and version, browser and version, the steps, and what was said. Add the line to `docs/a11y-report.md` only through `scripts/ax/report.ts`, which generates it.
