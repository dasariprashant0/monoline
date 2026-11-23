# 0007: Closed panels stay mounted where until-found is supported

Status: accepted. A note on [0005](0005-find-in-page-for-closed-panels.md); it does not replace it.

## Context

0005 says the panel stays in the DOM while closed. It does not say what that means for behaviour. `useUntilFound` passes `forceMount` to the Radix content when the browser supports `hidden="until-found"` (`packages/react/src/utils/until-found.ts`).

## Decision

In Chromium and recent Safari, closed Accordion and Collapsible panels are always mounted, with `hidden="until-found"`. Elsewhere they unmount when closed, as before.

## Consequences

- Effects inside a closed panel run on mount, not on first open.
- Inputs inside a closed panel stay in their `<form>` and are submitted with it.
- Behaviour differs by browser: the same panel is mounted in Chromium and unmounted in Firefox. Keep panels light, do not rely on mount to fetch data, and do not rely on closed inputs being absent from a form.
