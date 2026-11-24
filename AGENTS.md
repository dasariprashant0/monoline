# AGENTS.md: how to work in Monoline

Read this first. It is written for AI agents and human contributors alike. If a rule here conflicts with a habit from another library, this file wins.

## What this repo is

Monoline is an open-source UI kit with two layers:

| Layer | Package | What |
|---|---|---|
| Core | `packages/css` → `@monoline/css` | Plain CSS: tokens, 3 themes, 8 accents, look options (font, corners, density), base, one stylesheet per component. Built files are wrapped in cascade layers ([ADR 0003](docs/decisions/0003-css-cascade-layers.md)). Works with any framework or none. |
| CLI | `packages/cli` → `monoline` | `npx monoline add <component>` copies a component and its CSS from `registry/` into a project. No dependencies. |
| React | `packages/react` → `@monoline/react` | Accessible, typed React components that render the core's classes. Modals use native `<dialog>`, popovers and menus use one own floating layer ([ADR 0001](docs/decisions/0001-native-dialog-and-own-floating-layer.md)); roving focus and collections (tabs, accordion, slider and others) still come from Radix (`radix-ui`). |
| Docs | `apps/docs` | The documentation site. Discovers components automatically. |
| Registry | `registry/`, `llms.txt`, `llms-full.txt` | Generated, machine-readable component list and source for AI tools. |
| Decisions | `docs/decisions/` | Short ADRs. Read the one that covers your area before changing it. |

Look and feel: monospace type, square edges, thin rules, one accent. Rules and token list: `DESIGN.md`. Comparable libraries for scope and API shape: shadcn/ui, Radix, Mantine, Chakra, Ant Design, daisyUI, Headless UI, Base UI, HeroUI, Magic UI. Take their component coverage and prop conventions; keep Monoline's look.

## Commands (run from the repo root)

```bash
npm install --cache "$TMPDIR/npm-cache"   # once
npm run dev                               # docs site on :5180, live components and CSS
npm test                                  # vitest + axe for every component
npm run typecheck                         # tsc for react + docs
npm run check                             # css lint (contrast, raw colours, motion), doc comments, registry, typecheck, tests
npm run build                             # css dist, react dist, docs site
npm run size                              # gzip budgets for JS and CSS; run after build
npm run test:docs -w docs                 # docs scripts tests
npm run registry                          # regenerate registry/ and llms*.txt
```

## Where things live

```
packages/css/src/tokens.css, base.css, accents.css, options.css, utilities.css
packages/css/src/components/NN-name.css   legacy numbered files (keep order) and <name>.css for new ones
packages/css/js/monoline.js               optional vanilla behaviours for CSS-only users
packages/react/src/components/<name>/     one folder per component (see recipe)
packages/react/src/hooks/<name>/          one folder per hook, same shape
packages/react/src/index.ts               GENERATED, gitignored
apps/docs/                                docs site
registry/, llms.txt, llms-full.txt        GENERATED, committed only by the maintainer
```

## The component recipe

Reference implementation: `packages/react/src/components/button/`. Copy its shape.

```
packages/react/src/components/<name>/
  <name>.tsx        the component(s)
  <name>.test.tsx   behaviour tests + one axe test
  <name>.demo.tsx   live examples:  export const demos: Demo[] = [{title, description?, render}]
  meta.json         name, title, category, description, status, primitive?, css[], a11y[], keywords[]
  index.ts          export {X} and its Props type; nothing else
packages/css/src/components/<name>.css   styles, tokens only
```

`meta.json` is validated by `npm run registry`. `name` equals the folder. `css` lists the stylesheets (in `packages/css/src/components/`) the component needs.

### API conventions (follow these so every component feels the same)

- `forwardRef` to the root DOM element. Spread remaining props onto it. Accept and merge `className` with `cx()`. Providers and other parts that render no element of their own (`Toaster`, `ThemeProvider`, `DirectionProvider`) are the exception; a component whose root is a portal (`Tour`, `Command`) forwards the ref to that root. Where a component has a wrapper around its input, `className` goes to the wrapper in `TagsInput`, `MultiSelect`, `Combobox` and `TreeSelect`, and to the input in `NumberInput` and `PasswordInput`.
- Variants are string unions: `variant`, `size` (`sm | md | lg`), `tone`. Defaults are the most common use. Boolean props are `isX`-free: `disabled`, `loading`, `invalid`, `required`.
- Polymorphism: `asChild` using Monoline's own `Slot` (`packages/react/src/utils/slot.tsx`; only `sidebar.tsx` still imports Radix's) where a different element makes sense. No `as` prop.
- Controlled and uncontrolled pairs follow one pattern: `value` / `defaultValue` / `onValueChange(value)`; `open` / `defaultOpen` / `onOpenChange(open)`; `checked` / `defaultChecked` / `onCheckedChange(checked)`. Pass Radix's props through where a component wraps Radix.
- Compound components for anything with parts: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`... exported as named exports (not `Dialog.Trigger`), so they tree-shake and read plainly.
- State is exposed as `data-state="open|closed|checked|..."` and `data-disabled`, `data-invalid`, never class toggles that consumers must guess. CSS styles `[data-state=...]`.
- Add props, never change or remove one. A new prop is optional. Name booleans positively.
- No default exports in component files. No barrel imports across components: import from `../other-component`.
- Server-safe: no `window` access during render. Add `'use client'` only where hooks or handlers are used (a file-top directive is fine in every interactive component).
- No runtime CSS-in-JS, no Tailwind, no icon libraries. Icons are inline SVG with `currentColor`, `aria-hidden`, passed as `children` or props. If a component needs a built-in glyph (chevron, check), write a 10-line inline SVG in that component's folder.
- Dependencies: React (peer) and `radix-ui`, nothing else. 22 files under `packages/react/src` still import `radix-ui` (accordion, tabs, toast, slider, switch, checkbox, radio-group, toolbar and others; list them with `grep -rl "from .radix-ui." packages/react/src`). Dialog, popovers, menus, tooltips and `Slot` are Monoline's own. A new dependency needs a reason in the PR and must be a peer or optional where possible.
- Newer platform features (anchor positioning, `until-found`, scroll-driven animation) are allowed only behind capability detection with the current code as fallback ([ADR 0004](docs/decisions/0004-baseline-policy-with-js-fallback.md)). Detection returns false on the server.
- Size is a budget: `npm run size` fails over it. Raise one only with a reason in the commit ([ADR 0002](docs/decisions/0002-per-module-build-and-size-budgets.md)).

### CSS rules

- Tokens only: no raw hex, px font size or spacing number. `npm run check` fails on raw colours. If a value is missing, add a token to `tokens.css` first (all three themes).
- Square edges (`--radius` is 0), thin `--rule` lines, no shadows except toast/popover layers, no gradients except `--hatch` (the `effects` category is exempt but must respect `prefers-reduced-motion`).
- Source files are unlayered; `packages/css/scripts/bundle.mjs` adds the layers when it builds `dist/`. Do not write `@layer` in `src/`.
- Style Radix and native state through attributes: `[data-state="open"]`, `[aria-current]`, `[aria-invalid="true"]`, `:disabled`. Focus uses `:focus-visible` with the shared ring.
- A component's CSS lives in its own file, named after the component. Do not append to another file.
- Class names are plain and unprefixed (`.btn`, `.card`, `.dialog`). Variants are a second class (`.btn-solid`). Parts use a dash (`.card-header`). Keep them short and unsurprising.
- Every component works with CSS alone where the element is native (details, dialog, progress). Behaviour that needs JS goes in the React component; `monoline.js` only covers what existed.

### Accessibility is part of the definition of done

WCAG 2.2 AA. For each component, `meta.json` `a11y` lists the keyboard and screen reader behaviour, and the test file proves it:

- Native element first, then Radix, then ARIA. Never `div` + `onClick`.
- Every interactive part is reachable and operable by keyboard; Escape closes overlays; focus returns to the trigger; no keyboard trap.
- Every control has an accessible name (label, `aria-label`, `aria-labelledby`). Icon-only buttons require `aria-label` (make it a required prop in the type).
- Errors use `aria-invalid` and `aria-describedby`. Status changes use `role="status"` or `role="alert"` sparingly.
- Targets at least 24×24 CSS px; focus ring never hidden; colour is never the only signal.
- Motion respects `prefers-reduced-motion` (`base.css` has one global `prefers-reduced-motion` rule and `npm run check` fails if a stylesheet re-enables motion with `!important`).
- One `axe` test per component (`expect(await axe(container)).toHaveNoViolations()`), plus interaction tests with `@testing-library/user-event`.

### Tests

Vitest + Testing Library + `vitest-axe`. Test behaviour users see (roles, names, keyboard), not implementation. Cover: renders and default props, each variant class, controlled and uncontrolled use, keyboard operation, disabled, ref forwarding, `asChild` if supported, axe. Portal content (dialogs, menus) is found via `screen`, not `container`.

## Doc comments are required: `npm run check` enforces them

Every prop in an exported `*Props` interface or type, every exported component and every exported hook needs a `/** ... */` comment. The docs site props tables and the AI registry are generated from these comments, so a missing one is a hole in the docs.

- Prop: one plain sentence saying what it does and when to use it, with the default or allowed values (`/** Shows a spinner and ignores clicks. Default false. */`).
- Component or hook: one or two sentences, plus a one-line `@example` where it helps. For a hook, say what it returns, its parameters and what it does during server rendering.
- `npm run check` runs `packages/react/scripts/check-docs.mjs`, which lists each file, line and name that is missing a comment and exits 1. Run `npm run check:docs -w @monoline/react` to run only this check.

## Parallel work: ownership rules

Several agents may build at once, each in its own worktree. To avoid conflicts:

1. Work only inside the folders and CSS files your task owns (named in your task). Do not edit another category's component or CSS files; open a note in your report instead.
2. Never hand-edit or commit generated files: `packages/react/src/index.ts`, `registry/`, `llms.txt`, `llms-full.txt`, any `dist/`.
3. Shared files (`tokens.css`, `base.css`, `accents.css`, `options.css`, `utilities.css`, `package.json`, `AGENTS.md`, `DESIGN.md`) belong to the `core` task. If you need a token, add it in your own CSS file as a component-scoped custom property (`--dialog-width`) and note it in your report.
4. Commit early and small, on your own branch. Message style: `button: add loading state`.
5. Finish with the Definition of done below, and report: what you built, what you could not finish, anything another task must change.

### Start from `origin/master`

Local `master` can fall behind silently. Before you branch, run `sh scripts/sync-master.sh` (fast-forward only, quiet when current; a SessionStart hook runs it too), then branch from the remote: `git fetch origin && git switch -c <name> origin/master`. Never branch from local `master`. If the script refuses (dirty or diverged master), it says why and changes nothing.

## Definition of done (per component)

- [ ] Folder has all five files; `meta.json` valid; `index.ts` exports component and `*Props` types.
- [ ] CSS in its own file, tokens only, works in warm/dark/midnight, all eight accents and the font/corner/density options, at 360px and 1200px.
- [ ] Keyboard and screen reader behaviour implemented, listed in `meta.json`, and tested.
- [ ] `npm test`, `npm run typecheck` and `npm run check` pass.
- [ ] Your demos render in `packages/react/src/all-demos.test.tsx` (axe, no console errors; it runs automatically).
- [ ] The docs site shows every demo with no console errors (`npm run dev`, check the page).
- [ ] Copy follows `DESIGN.md` §7 (verbs, plain words, no exclamation marks).
- [ ] No new dependency, or the reason is in the report.

## Style of work

- Small, reviewable, boring code. No abstractions without a second use.
- Say what you did in plain words. Do not claim a thing works until you ran it.
- When the spec is unclear, pick the convention from shadcn/ui or Radix, note the choice in the component's doc comment, and move on.
