# 0001: Native dialog and one floating layer

Status: accepted (shipped in 0.4.0, see `CHANGELOG.md`)

## Context

Radix overlays pulled in floating-ui and react-remove-scroll. A Dialog cost 14.1 KB gzip and a Select 32.4 KB, against a target of a few KB.

## Decision

- Dialog, AlertDialog, Drawer and Command use `<dialog>` with `showModal()`. The browser gives the focus trap, inert page, Escape and top layer.
- Popover, Tooltip, HoverCard, Select, DropdownMenu, ContextMenu and Menubar share one floating layer, `packages/react/src/components/popover/float.tsx` (side, align, offsets, flip, shift). Menus and popovers are non-modal.
- Components with roving focus, collections or presence logic stay on Radix (list in `docs/bundle-report.md`).

## Consequences

- Dialog is 1.8 KB, Select 4.9 KB (0.4.0 changelog).
- Breaking: content refs are `HTMLDialogElement`; Radix `modal`, `forceMount` and `asChild` on overlay content are gone; `--radix-*` properties became `--anchor-width` and `--available-height`.
- We own the placement code and its edge cases. See [0004](0004-baseline-policy-with-js-fallback.md) for moving it to CSS later.
