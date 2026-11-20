# 0002: Per-module build and size budgets

Status: accepted

## Context

The first build was a single file, so one Button cost 103 KB gzip (every component and all of Radix).

## Decision

- `@monoline/react` builds one file per module and sets `sideEffects: false`, so a bundler drops what an app does not import.
- `npm run size` (`scripts/size.mjs`) bundles small apps from the built package with esbuild and fails CI when a case passes its budget. Each case budget is the measured size plus about 10 percent. "Everything" keeps 100 KB. The all-CSS budget is 21 KB (raised from 20 by the owner, commit 225bb65). Tooltip, Popover and DropdownMenu budgets were raised 0.2 KB each for the anchor-positioning path (dde5ece).
- CSS ships as `core.css` plus one file per component; `monoline.css` holds everything.

## Consequences

- Adding a component can trip a budget. Raising one is an explicit edit to `scripts/size.mjs` with a reason in the commit.
- Budgets are the policy, not the targets in `docs/ROADMAP.md`; those are the goal.
