# 0012: Derived tokens are declared again on scoped data-* wrappers

Status: accepted (M2, 2026-11-26), after an independent Skeptic review; its required changes are in.

## Context

- Some tokens are computed from others: `--rule`, `--wash`, `--wash-2`, `--ink-1` to `--ink-5` from `--foreground`; `--hatch` from `--muted`; `--focus-ring` from `--accent`; `--control-sm/md/lg` and `--window-pad` from the space steps; `--radius-sm/md/lg` from `--radius`. They were declared only in the `:root` block of `packages/css/src/tokens.css`.
- A custom property resolves `var()` on the element that declares it, and children inherit the resolved value. So `<div data-theme="dark">` inside a warm page got dark `--foreground` but kept warm `--rule` and `--ink-*`; a `data-accent` wrapper did not move `--focus-ring`; a `data-density` wrapper did not move `--control-*` or `--window-pad` (M0 audit finding #1, `docs/audit/2026-current-state.md`). Only the radius scale worked on a wrapper, because `options.css` already re-declares it in each `[data-radius]` rule.
- The docs site worked around it: `.tp` in `apps/docs/src/docs.css` re-declared `--rule`, `--wash`, `--wash-2`, `--ink-2..5` for the Themes gallery previews.
- Precedent: the `prefers-contrast` and `forced-colors` blocks in `utilities.css` are already written on `:root, [data-theme]` (and `[data-accent]`).
- Measured on be7bafd with the first version of the scoped cases: `npm run test:css-browser` (run 2026-11-25 on the be7bafd build of `apps/docs/dist`) -> exit 1, 28 of 673 failed, all `[scoped …]`. Every theme wrapper in every other theme kept the page's `--rule`, `--ink-3`, `--wash` (and `--focus-ring` where the accents differ); a green `data-accent` wrapper kept the page's ring; a compact `data-density` wrapper kept 48px buttons (36px expected).

## Options

1. **Keep `:root` only; document the workaround** (the `.tp` pattern). No change, but every consumer who themes a region repeats the formulas and drifts from them.
2. **One block on `:root, [data-theme], [data-accent], [data-density], [data-radius]`.** Smallest selector story, but it re-derives every group on every option wrapper. Under `prefers-contrast: more` a `data-accent` wrapper would then re-derive `--rule` at 20% in the tokens layer and lose the 55% override, which `utilities.css` writes on `:root, [data-theme]` only: an accessibility regression.
3. **One block per input group, selectors = the elements that set that input** (chosen):
   - `:root, [data-theme]`: `--rule`, `--wash`, `--wash-2`, `--ink-1..5`, `--hatch` (only themes set `--foreground` and `--muted`).
   - `:root, [data-theme], [data-accent]`: `--focus-ring` (themes and accents set `--accent`).
   - `:root, [data-density]`: `--control-*`, `--window-pad`.
4. **The same blocks in `options.css`, no parser change.** Both token parsers accepted only an exact `:root` in `tokens.css` (`packages/tokens/scripts/lib.ts` threw `unexpected selector ":root, [data-theme], [data-accent]"`; `packages/css/scripts/lib.ts` silently dropped the block, so the public `@monoline/css/tokens.json` lost every token in it). Putting the blocks elsewhere avoids that, but writes every formula twice and moves derived tokens into the options layer.
5. **`@property` with `inherits: false`**: a non-inherited property takes its initial value on children instead of being recomputed, so it does not help.

## Decision

Option 3, in `tokens.css` (layer `monoline.tokens`), with plain selectors. Both parsers read a selector list whose first selector is `:root` as base (commit `tokens: read a :root selector list as base`, approved by the M2 lead; any other list still fails). Values are byte-identical; only their position moved. The `.tp` re-declarations are removed from the docs.

The radius scale stays on plain `:root`. `options.css` already re-declares `--radius-sm/md/lg` in each `[data-radius="soft"|"round"]` rule, so a `:root, [data-radius]` block would change nothing for the built-in values, and it would hide an app's `:root` override of the scale inside every `data-radius` wrapper.

Specificity and layers: `:root` and `[data-attr]` are both (0,1,0), and nothing else in `monoline.tokens` declares these tokens, so `:where()` would change nothing inside the kit. App CSS outside a layer beats every Monoline layer whatever the specificity (ADR 0003), so `:where()` would change nothing for apps either. `utilities.css` (`prefers-contrast`, `forced-colors`) is a later layer and still wins; the per-group selectors keep its `--rule` on accent and density wrappers.

## Consequences

- A `data-theme` or `data-density` wrapper, a `data-theme` + `data-accent` wrapper, and wrappers nested inside each other now look exactly like the same options on `<html>`. Checked by `npm run test:css-browser` (section "Scoped options"): 771 of 771.
- **`data-accent` on a wrapper needs `data-theme` on the same element.** Accent presets are per theme (`[data-accent="x"][data-theme="y"]` in `accents.css`); alone, a wrapper gets the accent's warm values. Before this change such a wrapper kept the page's ring; now the ring follows that warm accent, which for slate in a dark or midnight page is `#334155` on `#111110`/`#060B1A`, 1.82:1 and 1.89:1. With `data-theme` on the same element every accent's ring is at least 3:1 on the wrapper background (24 cases, checked).
- **The override trap.** An app that overrides a derived token on `:root` alone no longer sees it inside a scoped wrapper of that token's group, because Monoline re-derives it there. The same holds for overrides on `body`, `#app` or any class above the wrapper. Each row is a check in `npm run test:css-browser` (app CSS injected unlayered):

  | App CSS | Where | Result |
  |---|---|---|
  | `:root{--rule:red}` | `<html>` | red |
  | `:root{--rule:red}` | `data-theme="dark"` wrapper | the dark rule (override lost; was red) |
  | `:root{--rule:red}` | `data-density` wrapper | red |
  | `:root, [data-theme]{--rule:red}` | `data-theme="dark"` wrapper | red |
  | `body{--rule:red}` | `data-theme="dark"` wrapper | the dark rule (override lost) |
  | `:root{--focus-ring:…red}` | `data-theme` + `data-accent="green"` wrapper | the green ring (override lost) |
  | `[data-theme="dark"]{--accent:red}` (brand.css) | `data-theme="dark"` wrapper | red ring (was the page's orange) |
  | none, `prefers-contrast: more` | dark, theme+accent, accent-only and density wrappers | the theme's 55% rule |
  | none, `forced-colors: active` | the same four wrappers | `CanvasText` |

  Accepted: DESIGN.md does not document overriding derived tokens (it documents overriding the accent group per theme); a scoped wrapper of another theme should get that theme's lines, which is the point of the fix; and the documented route (brand.css per theme) now works where it did not before. Mitigation is documentation: override a derived token on the same selectors (`:root, [data-theme]`). The comment above the blocks in `tokens.css` says so; DESIGN.md needs the same sentence (lead).
- App-owned wrappers do not re-derive: `<div class="panel" style="--foreground: …">` keeps the page's `--rule` and `--ink-*` (checked). Only Monoline's `data-*` options do.
- Generated token files change order only: `npm run tokens` rewrites `packages/tokens/dist/{tokens.json,tokens.css,tokens.d.ts,figma-variables.json}` (+47/−47 lines against be7bafd). `tokens.json`, `figma-variables.json` and `tokens.css` sorted are identical to be7bafd; `tokens.d.ts` has two unions (`EffectToken`, `CssVariable`) in a different order, semantically equal. `@monoline/css/tokens.json` keeps every derived token in `base` (same 77 keys and values, different order).
- `core.css` grows by 11 bytes minified and gzipped (esbuild minify, gzip -9: 3,755 -> 3,766). `npm run size` and the check budget pass.
- Still not scoped: `data-density="comfortable"` or `data-radius="square"` on a wrapper does not reset a compact or round page, because the default values have no rule.

Evidence: `npm run test:css-browser` -> 771 of 771 (with `--window-pad` left on `:root`: 3 of 771 fail, `win = the compact value: got 32px, expected 24px`). `npm run check` -> 126 contrast checks pass. `npm run test:tokens` -> 12 of 12. Themes gallery: all 6 presets in each of the 3 page themes draw their own `--rule` and `--ink-*` without the `.tp` re-declarations (18 of 18, Chrome, one-off script).
