# 0009: exactOptionalPropertyTypes, and every optional prop accepts `undefined`

Status: accepted

## Context

All tsconfigs had `strict`. `exactOptionalPropertyTypes` (EOPT) was off everywhere, and `apps/docs`, which type-checks every `*.demo.tsx`, had only `strict` while `packages/react` also had `noUncheckedIndexedAccess`, `noUnused*`, `noFallthroughCasesInSwitch` and `verbatimModuleSyntax` (M0 audit, `docs/audit/2026-current-state.md`).

With EOPT on, `foo?: string` means "absent or a string", not "absent, a string or `undefined`". Monoline wrote its props as `foo?: T`, so a consumer who turns the flag on cannot forward their own optional prop (`<Button size={props.size} />` where `props.size` may be `undefined`). Monoline had the same problem internally: turning the flag on in `packages/react` gave 69 errors (31 TS2375, 33 TS2379, 4 TS2322, 1 TS2345), nearly all of them a component passing its own optional prop on to another Monoline component or hook.

## Options

1. **Leave the flag off.** No work. Consumers with EOPT keep hitting errors on prop forwarding, and the `.d.ts` does not say whether `undefined` is accepted.
2. **Turn the flag on and fix only the 69 call sites** (conditional spreads, `?? default` at each call). Small diff, but the published types stay `foo?: T`, so consumers with the flag are no better off, and each new forward needs the same dance.
3. **Turn the flag on and write `foo?: T | undefined` on every optional prop.** The convention of `@types/react` (every DOM attribute is `?: T | undefined`). Large but mechanical diff; the `.d.ts` states what the runtime already does, since destructuring defaults (`{size = 'md'}`) treat `undefined` as absent.

## Decision

Option 3.

- `exactOptionalPropertyTypes: true` in `packages/react/tsconfig.json`, `apps/docs/tsconfig.json` and `examples/tsconfig.base.json`.
- `apps/docs` now has the same flag set as `packages/react`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`. It cost 6 errors, all EOPT, fixed by adding `| undefined` to its own types.
- 698 optional property signatures under `packages/react/src` (tests and demos excluded) gained `| undefined`, by a one-off TypeScript-AST codemod (function and conditional types are wrapped in parentheses first). Calendar's method-style `onValueChange?(date)` became a property so it could take `| undefined`.
- That cleared 66 of the 69 errors. The other 3 were boundaries, plus one merge the new types exposed:
  - `useIntersection` passes options to the DOM's `IntersectionObserverInit`, which rejects `undefined`: it now passes the spec defaults (`root ?? null`, `rootMargin ?? '0px'`, `threshold ?? 0`), which is what the browser does with a missing member.
  - `SidebarToggle` spread `...rest` after `aria-label={label}`, so an explicit `aria-label={undefined}` from the caller removed the button's name. It now reads `aria-label={ariaLabel ?? label}`. A nameless button becomes a named one.
  - `ThemeProvider` built its state as `{...DEFAULTS, ...initial}`, so `accent={undefined}` set the accent to `undefined` (already possible for every consumer without the flag). It now takes its look props with destructuring defaults, so `undefined` keeps the default, and its props accept `| undefined` like the rest. A test covers it (it fails against the old merge).
  - A `data-grid` test helper typed its overrides as `Partial<DataGridProps>`, which makes both halves of the required accessible-name union optional; it now omits `aria-label` and `aria-labelledby`.
- No `as` casts and no `@ts-expect-error` were added to silence an error.
- Radix-backed components (Accordion, Tabs, Slider and the rest) needed no change: their prop types already accept `undefined`.

These are the only runtime changes: `SidebarToggle` and `ThemeProvider` now treat an explicit `undefined` as absent, as every other prop already did.

### Where `undefined` is still rejected, on purpose

The inner keys of `BlockLogin` and `BlockSignup` `messages` and `BlockPricing` `labels` are merged with `{...defaults, ...messages}`, so an explicit `undefined` would replace a default text. Those keys keep rejecting `undefined` (the object itself accepts it), so EOPT users are told the truth. Consumers without EOPT can already hit this; making those merges skip `undefined` is a follow-up, after which the keys can take `| undefined` too. The consumer check does not look inside nested objects, so it does not flag them.

### Consumer check

`examples/consumer-types/optional-props.ts` compiles against the built `packages/react/dist/*.d.ts` with EOPT and `skipLibCheck: false`. For every PascalCase export that is a component, it lists the optional props whose type does not accept `undefined`; the file fails to compile if that list is not empty, and the error names the component and prop. Removing `| undefined` from Button's `variant` in the built `.d.ts` makes it fail with Button, CopyButton, IconButton and ShimmerButton.

The three example apps (`dashboard`, `auth-settings`, `landing`) also type-check with EOPT now; their only error was their own `Item` type in `toasts.tsx`. `npm run typecheck:examples` runs all four after `npm run build`, and CI runs it after `npm run size`.

## Consequences

- New optional props must be written `foo?: T | undefined` (AGENTS.md says so). A missed one fails `npm run typecheck:examples` in CI, not `npm run check`, because the check needs the built `.d.ts`.
- Props tables in the docs and `registry/` are unchanged at the top level (the extractor already strips a trailing `| undefined`). Nested label objects of 7 components (Calendar, RangeCalendar, FileUpload, NumberInput, Pagination, PasswordInput, Slider) now show `| undefined` on their inner keys, which is what they accept.
- `registry/` and `llms*.txt` embed component source, so they were regenerated (`npm run registry`).
- Bundle size: only the runtime changes above touch JavaScript; `npm run size` budgets were not touched. ThemeProvider's props table now shows its defaults, since the extractor reads destructuring defaults.
- The starters in `examples/starters/` keep their own settings: they are templates people copy, and the flag is the consumer's choice.
