# 0006: Native anchor positioning, status after the prototype

Status: accepted. Supersedes the anchor-positioning bullet in the Consequences of [0004](0004-baseline-policy-with-js-fallback.md); the rest of 0004 stands.

## Context

0004 described the first prototype (e2eb539): collision padding was not applied natively and `data-side` reported the preferred side. Commit 6d8ea26 fixed both, and b905232 made the native path opt-in. The text in 0004 no longer matches `placeNative()` in `packages/react/src/components/popover/float.tsx`.

## Decision

- `placeNative()` applies `collisionPadding` as margins on the viewport edges and reads the side the browser ended up on, so `data-side` reports the flipped side, as `place()` does.
- The native path is opt-in with `data-anchor="native"` on `<html>`, and only where the browser supports anchor positioning. `place()` is the default.
- The reason for opt-in is unchanged: in the Chrome e2e a Select near the bottom of the viewport shrank instead of flipping.

## Consequences

- Both paths report the same `data-side` and honour `collisionPadding`; tests cover both.
- Making native the default needs the Select shrink case fixed and a new record. Rework of this area is in progress on another branch; this record describes master at 5a4ffa8.
