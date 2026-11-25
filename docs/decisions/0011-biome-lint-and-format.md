# 0011: Biome for lint and format

Status: accepted

## Context

- The repo had no linter or formatter (audit `docs/audit/2026-current-state.md`). Style was consistent by hand: single quotes, semicolons, `{a}` without bracket spacing, 2-space indent, arrow parens (1,286 to 83), and dense one-line blocks; 3,172 of 38,515 JS/TS lines are over 120 columns. Hand-wrapped comments break at 100 to 119 columns.
- Six `eslint-disable` comments existed, but nothing ran ESLint.
- Correctness and a11y are already checked by `tsc` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), axe in every component test, the ax accessibility-tree run and the keyboard e2e suite. A linter adds what those miss: dead code, hook dependency lists, ARIA misuse in JSX.

## Options

Both were prototyped against the whole repo (831 JS/TS files, darwin arm64, warm, 3 runs each).

| | Biome 2.6.9 | ESLint 9.39 + typescript-eslint 8 + react, react-hooks 7, jsx-a11y + Prettier 3.10 |
|---|---|---|
| Lint time | 0.33 to 0.39 s | 4.4 to 5.3 s (without type information; typed rules are slower still) |
| Format check | 0.55 to 0.58 s | 3.4 to 3.7 s |
| Format churn, same options, 120 cols | +25,487 / −6,079 lines | +25,497 / −6,084 lines (the same output, within 10 lines) |
| Dependencies | 1 package + 1 native binary per platform (2 installed) | 9 direct, 279 installed |
| Config | one `biome.jsonc` | `eslint.config.mjs` with 6 plugins + `.prettierrc` + `.prettierignore` |
| Findings, recommended rules | 336 errors, 534 warnings | 186 errors, 12 warnings |
| React hooks | `useExhaustiveDependencies` (33 sites; 13 after turning off "unnecessary dependency") | `exhaustive-deps` (11 sites, the same ones); React Compiler rules found 0 |
| a11y | 30+ jsx-a11y rules ported | jsx-a11y; its peer range stops at ESLint 9 (ESLint 10 would not install) |
| Not covered | type-aware rules, React Compiler rules | (covered) |

Format output is the same for both, so the choice rests on speed, weight and rule coverage. The rules only ESLint has (typed rules, React Compiler rules) found nothing here or duplicate `tsc`.

## Decision

- Biome 2.6.9, pinned exactly (formatting can change between versions), root dev dependency. Reason for the dependency (hard rule 8): no platform feature or existing dependency lints or formats; it is the lightest option measured.
- Scope: JS/TS only. CSS keeps its own checks; JSON (one-line `meta.json`), Markdown and YAML stay hand-written (formatting them would add 176 JSON and 45 Markdown files of noise). Generated files are excluded through `biome.jsonc` and `.gitignore`. Import sorting (assist) is off: CSS side-effect import order matters.
- Formatter options match the existing code; line width 120, where hand-wrapped comments already break.
- Rules: the recommended preset, minus a documented list in `biome.jsonc`: rules that `tsc` already covers, rules that clash with house style (`!` under `noUncheckedIndexedAccess`, `(m[k] ??= []).push(v)`), unsafe rewrites (`useOptionalChain`, `useMathMinMax` turns Dates into numbers), and a11y rules that flag the APG composite-widget patterns the components implement on purpose. Overrides: tests (bare buttons, components defined inside tests), and the ES5 `monoline.js`.
- `npm run lint` (`biome check --error-on-warnings .`) is the first step of `npm run check` and its own step in the CI `test` job. `npm run lint:fix` formats and applies safe fixes. A finding is silenced only with `// biome-ignore <rule>: <reason>`.
- Formatting is one commit, listed in `.git-blame-ignore-revs`.

## Consequences

- The format commit touched 561 source files (+25,497 / −6,087) and regenerated 155 files (registry, llms-full, snippets), because the registry embeds source.
- Lint found and fixed: unused imports, variables and parameters in 13 scripts and tests; three ARIA misuses (`aria-label` on role-less elements in the docs and a demo).
- 26 `biome-ignore` comments explain intended code, 13 of them hook dependency lists.
- `npm run check` gains about 0.5 s.
- No type-aware lint. Revisit if Biome's type inference or a bug class that typed rules catch shows up.
