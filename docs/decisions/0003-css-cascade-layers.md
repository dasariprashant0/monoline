# 0003: Cascade layers added at bundle time

Status: accepted

## Context

App styles lost specificity fights with component CSS (`docs/dogfood-log.md`, A1 to A3). The roadmap promised that app styles always win.

## Decision

`packages/css/scripts/bundle.mjs` wraps each source file in a layer when it builds `dist/`. One declaration at the top of `core.css` and `monoline.css` fixes the order:

```css
@layer monoline.base, monoline.tokens, monoline.components, monoline.options, monoline.utilities;
```

Later layers win. Options sit after components because `data-radius="round"` restyles `.btn`. Utilities come last and hold the `forced-colors` and `prefers-contrast` adjustments. CSS an app writes outside a layer beats all of them.

## Consequences

- Source files in `packages/css/src` stay unlayered, so the CLI and `registry/` copy plain CSS. Only the built files are layered.
- An app that uses its own `@layer` must declare it after importing Monoline's CSS. A layer declared earlier loses to a later one.
- `@layer` needs a 2022-era browser, inside the Baseline policy in [0004](0004-baseline-policy-with-js-fallback.md).
