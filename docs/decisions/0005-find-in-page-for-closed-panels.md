# 0005: Find in page for closed panels

Status: accepted (commit 43f5096)

## Context

Radix unmounts closed Accordion and Collapsible content, so Ctrl+F cannot find text inside it.

## Decision

`useUntilFound` (`packages/react/src/utils/until-found.ts`) keeps closed panels mounted with `hidden="until-found"` where the browser supports it. When the browser finds text there it fires `beforematch`, and the hook opens the panel by clicking its own trigger, so Radix state stays the single source of truth. Elsewhere the panel unmounts as before.

We did not switch Accordion to native `<details name>` with `interpolate-size` (the other option in plan M2). It would replace the Radix component and its API; revisit if Baseline coverage grows.

## Consequences

- Support is Chromium and recent Safari, not Baseline, so it follows [0004](0004-baseline-policy-with-js-fallback.md): detected, false on the server and while hydrating.
- Panel content is in the DOM while closed. Heavy content stays mounted; keep panels light or lazy-render inside them.
