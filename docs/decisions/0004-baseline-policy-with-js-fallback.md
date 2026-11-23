# 0004: Baseline widely available, newer features behind detection

Status: accepted as implemented. The owner question (plan E9) recommended this; no separate sign-off is recorded.

## Context

The platform now covers things we built in JS: anchor positioning, `popover`, scroll-driven animation, `until-found`. Some are not in every supported browser yet.

## Decision

- Default to features that are Baseline widely available.
- A newer feature may be used only as an enhancement: feature-detected, with the existing JS or markup as the fallback, same props, same tests.
- Detection is by capability (`CSS.supports`, `'onbeforematch' in HTMLElement.prototype`), never by user agent, and returns false on the server so hydration matches.

## Consequences

- Two code paths per enhancement, both tested. Examples: `nativeAnchor()` in `float.tsx` with `place()` as fallback (e2eb539), `useUntilFound` in `utils/until-found.ts` (43f5096, see [0005](0005-find-in-page-for-closed-panels.md)).
- The anchor-positioning path is a prototype: collision padding is not applied natively and `data-side` reports the preferred side. It is opt-in (`data-anchor="native"` on `<html>`), not the default: with it on, a Select near the bottom of the viewport shrank instead of flipping and failed the Chrome e2e. `place()` is the default path.
- Baseline status was not re-checked per feature in this record. Check it when you add or widen an enhancement.
