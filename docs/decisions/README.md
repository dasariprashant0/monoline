# Decisions

Short records of choices that shaped the code. One file each: context, decision, consequences. Add one when a choice would surprise a new contributor or is hard to undo. Do not edit an accepted record; write a new one that supersedes it.

| ADR | Decision |
|---|---|
| [0001](0001-native-dialog-and-own-floating-layer.md) | Native `<dialog>` for modals, one own floating layer for popovers and menus |
| [0002](0002-per-module-build-and-size-budgets.md) | One file per module, size budgets enforced in CI |
| [0003](0003-css-cascade-layers.md) | Cascade layers added at bundle time, app CSS wins |
| [0004](0004-baseline-policy-with-js-fallback.md) | Baseline widely available by default, newer features behind detection |
| [0005](0005-find-in-page-for-closed-panels.md) | `hidden="until-found"` for closed Accordion and Collapsible panels |
