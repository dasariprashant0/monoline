# Decisions

Short records of choices that shaped the code. One file each: context, decision, consequences. Add one when a choice would surprise a new contributor or is hard to undo. Do not edit an accepted record; write a new one that supersedes it.

| ADR | Decision |
|---|---|
| [0001](0001-native-dialog-and-own-floating-layer.md) | Native `<dialog>` for modals, one own floating layer for popovers and menus |
| [0002](0002-per-module-build-and-size-budgets.md) | One file per module, size budgets enforced in CI |
| [0003](0003-css-cascade-layers.md) | Cascade layers added at bundle time, app CSS wins |
| [0004](0004-baseline-policy-with-js-fallback.md) | Baseline widely available by default, newer features behind detection |
| [0005](0005-find-in-page-for-closed-panels.md) | `hidden="until-found"` for closed Accordion and Collapsible panels |
| [0006](0006-native-anchor-positioning-status.md) | Native anchor positioning: padding and flipped side applied, still opt-in (supersedes part of 0004) |
| [0007](0007-until-found-panels-stay-mounted.md) | Closed Accordion and Collapsible panels stay mounted where `until-found` is supported (note on 0005) |
| [0008](0008-cli-mcp-typescript-and-pinned-registry.md) | CLI and MCP in strict TypeScript built with tsc; default registry pinned to the package's own version tag |
| [0009](0009-exact-optional-property-types.md) | `exactOptionalPropertyTypes` on; every optional prop accepts `undefined` |
| [0010](0010-typescript-scripts-and-one-build-ci.md) | Scripts are TypeScript run by Node's type stripping; CI builds once per push; stay on npm workspaces |
| [0011](0011-biome-lint-and-format.md) | Biome lints and formats JS/TS; formatting matches the existing style |
| [0012](0012-scoped-derived-tokens.md) | Derived tokens are declared again on `data-theme`, `data-accent` and `data-density` wrappers, so scoped options apply in full |
| [0013](0013-ssr-theme-init.md) | `themeScript()` sets the saved and app look on `<html>` before first paint; options allowlisted and escaped |
| [0014](0014-token-source-of-truth.md) | Tokens are written in `packages/tokens/src/tokens.ts`; one model generates the token CSS, JSON, types, Figma and React Native values and validates references |
| [0015](0015-styling-approach.md) | Keep plain CSS and custom properties; CSS Modules, Vanilla Extract and Panda compared in `examples/styling-poc` |
