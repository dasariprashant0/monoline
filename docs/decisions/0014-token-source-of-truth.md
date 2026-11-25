# 0014: One token parser; CSS or DTCG JSON as the token source

Status: proposed (M2). Part 1 (one parser) is decided and built; part 2 (the source of truth) is for the user to pick. Date: 2026-11-26.

## Context

- Tokens are written by hand in `packages/css/src/tokens.css`, `accents.css` and `options.css` (232 lines, 240 token values across 34 blocks). Everything else is generated from them: `@monoline/css/dist/tokens.json` (public export), and `packages/tokens/dist` (`tokens.json`, `tokens.css`, `figma-variables.json`, `tokens.d.ts`).
- Four readers parsed that CSS (audit `docs/audit/2026-current-state.md`, Tokens row): `packages/css/scripts/lib.ts` (`blocks`, `parseTokens`) for the public `tokens.json` and the contrast check; `packages/tokens/scripts/lib.ts` (`cssBlocks`, `parseSources`, `resolve`); and inside `packages/css/scripts/check.ts` a regex for the code colours and a hand-written copy of the `prefers-contrast: more` colour mixes. The docs, MCP and React scripts only read the generated `tokens.json` or computed styles in a browser (`scripts/css-computed.ts`, `scripts/audit.ts`); they are not parsers.
- Nothing validated the sources. `resolve()` stopped at depth 10 and called that a cycle; a duplicate token silently won; a second block for one accent replaced the first; a `var(--x, fallback)` passed through.
- M2 (`docs/MISSION.md`) asks for one source of truth, evaluating DTCG JSON in `@monoline/tokens` that generates CSS, TS and React Native values; validation for missing, circular, duplicate and invalid references; contrast in 3 themes × 8 accents. The user asked for both source options to be prototyped and the pick brought back.
- Worker A (ADR 0012) moves the derived tokens (`--rule`, `--ink-*`, `--control-*`, `--focus-ring` ...) into a block whose selector is a list such as `:root, [data-theme], [data-accent], [data-density]`. The old css parser would have dropped those tokens from the public `tokens.json` without an error; the tokens parser threw `unexpected selector`.

## Decision

### 1. One parser (decided, built)

`packages/tokens/scripts/lib.ts` is the only reader of the token CSS. It was the deeper module (it already resolved references, colours and lengths for Figma). `packages/css/scripts/build.ts` and `check.ts` import it; the css lib's `blocks`/`parseTokens`/`contrast`, the code-colour regex and the hand-written mixes are deleted. `packages/css/scripts/lib.ts` keeps `read()` and a three-line `parseTokens()` that calls `parseSources()`.

`parseSources()` fails the build, naming file, block and token, on:

| Class | Rule | Example message |
|---|---|---|
| Missing reference | every token resolves in every theme × (no accent + 8 accents) × font, radius and density combination (3 × 9 × 27 = 729 environments) | `tokens.css :root: --a uses undefined token --nope (theme warm)` |
| Cycle | a real cycle check (the resolution stack), also cycles that only close when a theme or accent layer applies | `accents.css [data-accent="x"][data-theme="dark"]: reference cycle --a -> --b -> --a (theme dark, accent x)` |
| Duplicate | the same token twice in one layer: one block, or two blocks with the same scope (two `:root` blocks, two `[data-accent="x"]` blocks). The later one wins silently in CSS, so it is always a mistake. A theme or accent overriding a base token is the cascade and is allowed. | `--a is declared twice in this layer; keep one` |
| Invalid reference | `var(` must be exactly `var(--name)`: malformed (`var(--b`), not a custom property (`var(color)`), or with a fallback (`var(--b, red)`). Fallbacks are refused: the token set is closed, so a fallback is dead code or hides a missing token. None exist today. | `tokens.css :root: --a: "var(--b, red)" has a fallback, which would hide a missing token` |
| Selector | a list of `:root` plus bare attributes (`:root, [data-theme], [data-accent]`) is the base layer; any other selector in `tokens.css` is refused | `tokens.css: unexpected selector ".card"` |

Contrast (`contrastChecks`, run by `npm run check`) uses resolved values from the same parser: per theme, foreground, muted, danger, warning, ok on background; surface-text on surface (now its real translucent value laid over the surface, not `#FFFFFF`); the 7 code colours on surface; for no accent and each of the 8 accents, accent-text ≥ 4.5, accent ≥ 3 on background and on-accent ≥ 4.5 on accent; and the `prefers-contrast: more` mixes, read from `utilities.css` and resolved (≥ 7 and ≥ 3). 126 checks, the same set and count as before; green. `color-mix(in srgb, ...)` is evaluated premultiplied, as browsers do.

Output: `@monoline/css/dist/tokens.json` is byte-identical before and after (`cmp`, sha1 `fd4d52b2`). `packages/tokens/dist` was byte-identical after the parser change; it then changed only for the two items below.

Also in this change:

- `--heading-1` and `--heading-2` were filed under the `color` group (classify had no `heading` rule), so `tokens.json` gave two `clamp()` sizes `$type: color` and `ColorToken` listed them. They are now `type`. `apps/docs/src/site/Tokens.tsx:118-124` worked around it and is now dead code.
- `dist/native.json` (React Native), exported as `@monoline/tokens/native.json`: colours per theme × accent, resolved to `#RRGGBB` or `rgba()`; px, bare numbers and `calc()` as numbers; durations in ms; `cubic-bezier()` as four numbers for `Easing.bezier`. `clamp()`, the gradient, font stacks, `ch`, shadows and the focus ring are listed in `$omitted` (README). JSON, not `native.ts`: the package has no TS build, Metro and TS (`resolveJsonModule`) import JSON with types inferred, and the other outputs are JSON.

### 2. Source of truth (proposed: keep CSS; the user picks)

Recommendation: **A, CSS stays the source**, with the one parser as the gate and DTCG JSON as an output. Revisit B when designers edit tokens in a tool that writes DTCG (for example a Tokens Studio sync), because that is the case B serves and A does not.

## Options considered

Both were built. B is in `packages/tokens/prototype/` (`monoline.tokens.json`, `to-css.ts`, and `from-css.ts`, the one-off conversion) and checked by `packages/tokens/test/prototype.test.ts`; it is not used by `npm run tokens`.

### Option A: CSS is the source (today)

Hand-written CSS → one parser (validate) → `tokens.json` (DTCG-shaped), `tokens.css`, `figma-variables.json`, `tokens.d.ts`, `native.json`, the public `@monoline/css/tokens.json`, the contrast check.

| Dimension | Assessment |
|---|---|
| Source size | 232 lines in 3 files; a new colour is 3 lines (one per theme) |
| Pipeline code | parser + validation 126 lines, colour + contrast 69, native 49 (shared with B) |
| Contributor workflow | unchanged: edit `tokens.css`, run `npm run tokens`; AGENTS.md and DESIGN.md need no change |
| Comments and contrast notes | kept where they are written (33 comments in `tokens.css`) |
| Validation | the parser, on the file people edit |
| DTCG compliance of `dist/tokens.json` | partial (below) |

DTCG gaps in `packages/tokens/dist/tokens.json` (240 values): 23 hold CSS `var()` instead of a DTCG alias (6 whole-value, 17 inside `color-mix()`, `calc()`, a gradient or the focus-ring shorthand); 8 have `$type: color` on a `var()` or `color-mix()` value; 44 have no `$type` (font stacks, `clamp()`, durations, `cubic-bezier`, weights, z-index, shadows); 46 `dimension` values are strings (`"4px"`), the older draft form, not the 2025.10 `{value, unit}` object; themes, accents and options are top-level groups, since DTCG has no modes. The cheap fix was the heading misfiling above. Writing whole-value `var()` as `{color.foreground}` aliases is also cheap in the generator, but `apps/docs/src/site/Tokens.tsx` prints `$value` as written, so it changes the docs page; left as a follow-up. The embedded references, unit objects and modes cannot be fixed without leaving CSS semantics (below).

**Pros:** smallest source; no generated source files; comments stay; contributors edit plain CSS, which is also what the kit ships; one validator on the edited file.
**Cons:** DTCG is an output, so a design tool that writes DTCG cannot round-trip into the repo; `tokens.json` keeps CSS expressions as strings.

### Option B: DTCG JSON is the source (prototype)

`monoline.tokens.json` → `to-css.ts` → the three CSS files (then committed, generated) → the same parser and outputs as A.

The prototype file has 34 token sets, one per CSS block (`base`, `warm`, `dark`, `midnight`, `accent-<name>[-<theme>]` × 24, `font-*`, `radius-*`, `density-*`). Each set records its CSS selector in `$extensions.monoline`; aliases such as `{color.foreground}` resolve within the sets merged for a theme and accent. That is how the DTCG Resolver Module models sets and modifiers; the prototype does not implement a resolver document. Non-token CSS (`color-scheme` in the theme blocks, the 3 descendant rules in `options.css`) has to live in `$extensions` as CSS.

Measured against the real files (`node --test packages/tokens/test/prototype.test.ts`):

| | tokens.css | accents.css | options.css |
|---|---|---|---|
| Byte-identical | no | no | no |
| Lines, real → generated | 172 → 136 | 37 → 170 | 26 → 53 |
| Generated lines found verbatim in the real file | 54 | 25 | 21 |
| Tokens per block, selectors, every declaration | equal | equal | equal |
| Tokens in another position | 0 of 116 | 0 of 96 | 0 of 28 |
| Comment text kept | 33 of 33 (two merged onto one line) | 1 of 1 | 2 of 2 |
| `tokens.json` built through the one parser | identical | | |

The diff is layout only: alignment spaces go, one-line accent blocks become one declaration per line, multi-line comments become one line, a comment above a token becomes a comment after it, the `options.css` rules move after the token blocks (they style descendants, so the cascade is the same). Byte identity would need the JSON to store layout, which is storing the CSS.

| Dimension | Assessment |
|---|---|
| Source size | 1,338 lines of JSON for 232 lines of CSS (5.8×); a new colour is 12 lines (4 per theme) |
| Pipeline code | A's code, plus `to-css.ts` (46 lines) and a check that the committed CSS matches the JSON |
| Values | still CSS strings: 17 values embed references inside `color-mix()`, `calc()`, a gradient or a shorthand, and 5 are `clamp()`. DTCG has no expressions, so tools that only read DTCG cannot evaluate them; Style Dictionary passes them through as strings |
| Contributor workflow | edit JSON, run the generator, commit the regenerated CSS. AGENTS.md (shared files, the generated-files table, "add a token to `tokens.css`"), DESIGN.md §3 "All in `packages/css/src/tokens.css`" and "Adding a token", and `check.ts`'s raw-colour exemption all change; CI gains a diff step for `packages/css/src` |
| Comments and contrast notes | text kept as `$description`; position and line breaks lost |
| Validation | the same parser, on generated CSS; errors point at the generated file, not the JSON line. Alias checks on the JSON itself would be new code or a tool's |

**Pros:** a design tool that writes DTCG can be the editor; aliases are DTCG syntax in the source; `$description` travels with each token into tools.
**Cons:** a source 5.8 times longer that is still CSS strings in JSON; generated CSS committed in the package that ships it; contributors and agents edit two formats (JSON for tokens, CSS for everything else); layer semantics live in `$extensions`, which no tool reads.

### Interop (same in both, because both end in the one parser)

- Figma: `figma-variables.json` from the parser (24 colour modes, 3 spacing, 3 radius, 9 type). B adds nothing; Figma has no DTCG import of its own.
- React Native: `native.json` from the parser in both.
- Style Dictionary and Tokens Studio: A gives them `tokens.json` with CSS strings; B gives them the JSON source with layer-relative aliases and string expressions, which need the same remapping of sets to themes. Neither import was run here.

## Trade-off analysis

B moves the edit point from CSS to JSON but not the semantics: every derived token is still a CSS expression, and the cascade (base, theme, accent, option) is still CSS selectors stored as metadata. So B costs a source 5.8 times longer, a second format for contributors, and generated files in `packages/css/src`, and buys DTCG input, which no current workflow uses. The outputs people consume (CSS, Figma, TypeScript, React Native) are the same either way, because both go through the one parser. A wins until a DTCG-writing design tool is part of the workflow.

## Consequences

- One reader of the token CSS: a new output or check calls `parseSources()` and gets validated, resolvable values. Bad references, cycles, duplicates and fallbacks fail `npm run check`, `npm run build -w @monoline/css` and `npm run tokens`.
- `packages/css/scripts` imports `packages/tokens/scripts/lib.ts`. Only repo scripts do; neither package's published files change.
- Worker A's selector-list block is parsed as base, and its tokens stay in the public `tokens.json` (the old css parser would have dropped them).
- `@monoline/tokens` gains `./native.json` (additive). `ColorToken` loses `heading-1`/`heading-2` and `TypeToken` gains them (a fix; the package is private).
- If B is picked: run `from-css.ts` once more, switch `npm run tokens` to generate `packages/css/src/{tokens,accents,options}.css`, add them to the generated-files table and the CI diff, rewrite the AGENTS.md and DESIGN.md token sections, and supersede part 2 of this record. If A is picked: delete `packages/tokens/prototype/` and `test/prototype.test.ts` (the prototype test fails whenever the CSS changes and the JSON is not re-synced).

## Action items

1. [ ] User: pick A or B.
2. [ ] Remove the heading workaround in `apps/docs/src/site/Tokens.tsx:118-124` (docs owner).
3. [ ] Optional for A: write whole-value `var()` as DTCG aliases in `dist/tokens.json`, with the docs Tokens page updated to match.
4. [ ] Add the font, radius and density options to `native.json` when a React Native app needs them.
