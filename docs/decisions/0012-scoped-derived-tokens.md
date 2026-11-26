# 0012: Derived tokens are declared again on scoped data-* wrappers

Status: accepted

## Context

- Some tokens are computed from others: `--rule`, `--wash`, `--wash-2`, `--ink-1` to `--ink-5` from `--foreground`; `--hatch` from `--muted`; `--focus-ring` from `--accent`; `--control-sm/md/lg` from the space steps; `--radius-sm/md/lg` from `--radius`. They were declared only in the `:root` block of `packages/css/src/tokens.css`.
- A custom property resolves `var()` on the element that declares it, and children inherit the resolved value. So `<div data-theme="dark">` inside a warm page got dark `--foreground` but kept warm `--rule` and `--ink-*`; a `data-accent` wrapper did not move `--focus-ring`; a `data-density` wrapper did not move `--control-*` (M0 audit finding #1, `docs/audit/2026-current-state.md`). Only the radius scale worked on a wrapper, because `options.css` already re-declares it in each `[data-radius]` rule.
- The docs site worked around it: `.tp` in `apps/docs/src/docs.css` re-declared `--rule`, `--wash`, `--wash-2`, `--ink-2..5` for the Themes gallery previews.
- Precedent: the `prefers-contrast` and `forced-colors` blocks in `utilities.css` are already written on `:root, [data-theme]` (and `[data-accent]`).
- Measured on be7bafd with the new scoped cases in `npm run test:css-browser`: 28 of 673 checks fail. Every theme wrapper in every other theme kept the page's `--rule`, `--ink-3`, `--wash` (and `--focus-ring` where the accents differ); a green `data-accent` wrapper kept the page's ring; a compact `data-density` wrapper kept 48px buttons (36px expected).

## Options

1. **Keep `:root` only; document the workaround** (the `.tp` pattern). No change, but every consumer who themes a region repeats the formulas and drifts from them.
2. **One block on `:root, [data-theme], [data-accent], [data-density], [data-radius]`.** Smallest selector story, but it re-derives every group on every option wrapper. Under `prefers-contrast: more` a `data-accent` wrapper would then re-derive `--rule` at 20% in the tokens layer and lose the 55% override, which `utilities.css` writes on `:root, [data-theme]` only: an accessibility regression.
3. **One block per input group, selectors = the elements that set that input** (chosen):
   - `:root, [data-theme]`: `--rule`, `--wash`, `--wash-2`, `--ink-1..5`, `--hatch` (only themes set `--foreground` and `--muted`).
   - `:root, [data-theme], [data-accent]`: `--focus-ring` (themes and accents set `--accent`).
   - `:root, [data-density]`: `--control-*`.
   - `:root, [data-radius]`: `--radius-sm/md/lg`.
4. **The same blocks in `options.css`, no parser change.** Both token parsers accepted only an exact `:root` in `tokens.css` (`packages/tokens/scripts/lib.ts` threw `unexpected selector ":root, [data-theme], [data-accent]"`; `packages/css/scripts/lib.ts` silently dropped the block, so the public `@monoline/css/tokens.json` lost all 16 derived tokens). Putting the blocks elsewhere avoids that, but writes every formula twice and moves derived tokens into the options layer.
5. **`@property` with `inherits: false`**: a non-inherited property takes its initial value on children instead of being recomputed, so it does not help.

## Decision

Option 3, in `tokens.css` (layer `monoline.tokens`), with plain selectors. Both parsers read a selector list whose first selector is `:root` as base (commit `tokens: read a :root selector list as base`, approved by the M2 lead; any other list still fails). Values are byte-identical; only their position moved. The `.tp` re-declarations are removed from the docs.

Specificity and layers: `:root` and `[data-attr]` are both (0,1,0), and nothing else in `monoline.tokens` declares these tokens, so `:where()` would change nothing inside the kit. App CSS outside a layer beats every Monoline layer whatever the specificity (ADR 0003), so `:where()` would change nothing for apps either. `utilities.css` (`prefers-contrast`, `forced-colors`) is a later layer and still wins; the per-group selectors keep its `--rule` on accent and density wrappers.

`--radius-*` stays in `options.css` as well: `packages/tokens` reads the `[data-radius="…"]` rules into `option.radius.*`, and its generated `dist/tokens.css` has no scoped block, so removing them would drop the radius scale from that file's option rules. It can go when the token build emits the scoped blocks (worker B, ADR 0014).

## Consequences

- A `data-theme`, `data-accent`, `data-density` or `data-radius` wrapper now looks exactly like the same option on `<html>`: `npm run test:css-browser` -> 697 of 697 (28 of 673 failed before; 24 new theme-init checks are ADR 0013's).
- **The override trap.** An app that overrides a derived token on `:root` alone no longer sees it inside a scoped wrapper of that token's group, because Monoline re-derives it there. Measured in Chrome with the before and after `core.css` (app CSS unlayered):

  | App CSS | Where | Before | After |
  |---|---|---|---|
  | `:root{--rule:red}` | `<html>` | red | red |
  | `:root{--rule:red}` | `data-theme="dark"` wrapper | red | dark 20% rule |
  | `:root{--rule:red}` | `data-density` wrapper | red | red |
  | `:root, [data-theme]{--rule:red}` | `data-theme="dark"` wrapper | red | red |
  | `:root{--focus-ring:…red}` | `data-accent="green"` wrapper | red | green |
  | `[data-theme="dark"]{--accent:red}` (brand.css) | `data-theme="dark"` wrapper | ring orange (wrong) | ring red |
  | none, `prefers-contrast: more` | accent, dark and density wrappers | 55% rule | 55% rule |
  | none, `forced-colors: active` | accent and density wrappers | system colours | same |

  Accepted: DESIGN.md allows apps to override the accent group per theme, not derived tokens; a scoped wrapper of another theme should get that theme's lines, which is the point of the fix; and the supported route (brand.css per theme) now works where it did not before. Mitigation is documentation: override a derived token on the same selectors (`:root, [data-theme]`). The comment above the blocks in `tokens.css` says so; DESIGN.md needs the same sentence (lead).
- Generated token files change order only: `npm run tokens` rewrites `packages/tokens/dist/{tokens.json,tokens.css,tokens.d.ts,figma-variables.json}` (+47/−47 lines); sorted, every file is identical to be7bafd. `@monoline/css/tokens.json` keeps all 16 derived tokens in `base`.
- `core.css` grows by 22 bytes minified and gzipped (esbuild minify, gzip -9: 3,755 -> 3,777). `npm run size` and the check budget pass.
- Still not scoped, unchanged by this ADR: a `data-accent` wrapper without its own `data-theme` gets the accent's warm values inside a dark page (`accents.css` pairs `[data-accent][data-theme]` on one element); and `data-density="comfortable"` or `data-radius="square"` on a wrapper does not reset a compact or round page, because the default values have no rule.

Evidence: `npm run test:css-browser` before (be7bafd CSS) -> exit 1, 28 of 673 failed, all `[scoped …]`; after -> 697 of 697. `npm run check` -> 126 contrast checks pass. `npm run test:tokens` -> 12 of 12. Themes gallery: all 6 presets in each of the 3 page themes draw their own `--rule` and `--ink-*` without the `.tp` re-declarations (18 of 18, Chrome).
