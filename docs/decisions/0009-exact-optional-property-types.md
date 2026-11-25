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
- That cleared 66 of the 69 errors. The other 3 were boundaries:
  - `useIntersection` passes options to the DOM's `IntersectionObserverInit`, which rejects `undefined`: it now passes the spec defaults (`root ?? null`, `rootMargin ?? '0px'`, `threshold ?? 0`), which is what the browser does with a missing member.
  - `SidebarToggle` spread `...rest` after `aria-label={label}`, so an explicit `aria-label={undefined}` from the caller removed the button's name. It now reads `aria-label={ariaLabel ?? label}`. This is the one place a runtime result changes: a nameless button becomes a named one.
  - A `data-grid` test helper typed its overrides as `Partial<DataGridProps>`, which makes both halves of the required accessible-name union optional; it now omits `aria-label` and `aria-labelledby`.
- No `as` casts and no `@ts-expect-error` were added to silence an error.
- Radix-backed components (Accordion, Tabs, Slider and the rest) needed no change: their prop types already accept `undefined`.

### Where `undefined` is still rejected, on purpose

Where the runtime spreads an object over defaults (`{...DEFAULTS, ...labels}`), an explicit `undefined` replaces the default. Those types keep rejecting `undefined`, so EOPT users are told the truth:

- `ThemeProvider`'s look props (`theme`, `accent`, `font`, `radius`, `density`, `dir`), via `Partial<Look>` and `{...DEFAULTS, ...initial}`.
- The `messages` of `BlockLogin` and `BlockSignup` and the `labels` of `BlockPricing` (inner keys only; the object itself accepts `undefined`).

Consumers without EOPT can already pass `undefined` there and get the broken result; fixing the runtime to skip `undefined` is a follow-up, after which these types can take `| undefined` too.

### Consumer check

`examples/consumer-types/optional-props.ts` compiles against the built `packages/react/dist/*.d.ts` with EOPT and `skipLibCheck: false`. For every PascalCase export that is a component, it lists the optional props whose type does not accept `undefined`; the file fails to compile if that list is not empty, and the error names the component and prop. `ThemeProvider` is exempt for the reason above. Run it after `npm run build`:

```bash
npx tsc --noEmit -p examples/consumer-types
```

The three example apps (`dashboard`, `auth-settings`, `landing`) also build with EOPT now; their only error was their own `Item` type in `toasts.tsx`.

## Consequences

- New optional props must be written `foo?: T | undefined`. The consumer check fails the build of that check (not the library) when one is missed; it is not in `npm run check` until a root script runs it after `build`.
- Props tables in the docs and `registry/` are unchanged at the top level (the extractor already strips a trailing `| undefined`). Nested label objects of 7 components (Calendar, RangeCalendar, FileUpload, NumberInput, Pagination, PasswordInput, Slider) now show `| undefined` on their inner keys, which is what they accept.
- `registry/` and `llms*.txt` embed component source, so they were regenerated (`npm run registry`).
- Bundle size: unchanged except the two runtime lines above; `npm run size` budgets were not touched.
- The starters in `examples/starters/` keep their own settings: they are templates people copy, and the flag is the consumer's choice.
