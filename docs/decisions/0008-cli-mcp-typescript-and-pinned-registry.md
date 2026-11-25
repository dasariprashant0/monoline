# 0008: CLI and MCP in strict TypeScript, reading the registry of their own version

Status: proposed (M1). Date: 2026-11-24.

## Context

`monoline` (CLI) and `@monoline/mcp` were zero-dependency `.mjs` files with no type checking. The M0 audit (`docs/audit/2026-current-state.md`, finding 2 and the CLI row) found:

- Both read the registry from GitHub `master`, so a 0.5.0 CLI copied whatever master held that day.
- `add` refused to write a file that was already there even when it had the same bytes, so `add button` then `add badge` failed on the shared `utils/cx.ts`.
- Names were not checked: `info ../package` read the repo's `package.json` and crashed.
- A malformed `monoline.json` threw an uncaught stack trace.
- `update` did not add components a component newly imports and said nothing about files the registry dropped.
- The MCP server silently preferred a `./registry` in the working folder over everything but the flag and env.

Constraints: no runtime dependencies; Node does not strip types for files under `node_modules`, so a published package cannot ship `.ts` and run it; each package's own `npm test` must keep working (root `test:cli` and `test:mcp` call it); the registry format is owned by `packages/react/scripts/gen-registry.ts`.

## Decision

1. **Source in TypeScript, shipped as tsc output.** `src/*.ts` compiles with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `verbatimModuleSyntax` to `dist/*.js` plus `.d.ts`. `typescript` and `@types/node` are devDependencies. `bin/*.mjs` stays a three-line shim that imports `../dist/...`, so the root `cli` script and every MCP config path keep working. `files` is `bin` and `dist` (plus `theming.md` for MCP, moved out of `src/` so `dist/` can read it); `exports` points at `dist`. `build` runs tsc, `prepack` runs `build`, and `test` builds and then runs the `.mjs` tests against `dist/`, so the tests exercise what ships.
2. **Default registry pinned to the package version**: `https://raw.githubusercontent.com/dasariprashant0/monoline/v<version>/registry`. The release workflow creates the `v<version>` tag (`gh release create "v$VERSION"`) for every published version, and `v0.3.0` and `v0.4.0` already exist with `registry/` in them.
3. **One registry type, one load-time guard**, in `src/schema.ts`: `RegistryIndex`, `IndexEntry` and `RegistryEntry` match the JSON `gen-registry.ts` writes, and `asIndex` / `asEntry` check the fields the code reads (strings, file lists, the name pattern) and throw `<file>: not a Monoline registry entry (...)`. The file is duplicated byte for byte in both packages and an MCP test fails if the copies differ.
4. **Behaviour fixes**, each with a test: `add` skips byte-identical files and refuses only on real differences (`--overwrite` unchanged); names must match `^[a-z0-9][a-z0-9-]*$`; a bad `monoline.json` is a `monoline: monoline.json ...` error; `diff`/`update` include components the project does not have yet that the component now imports, and report files the registry no longer lists without deleting them; the MCP server says on stderr when it uses `./registry/index.json` from the working directory. `engines.node` is `>=22` in both.

## Options considered

### Registry type sharing

| Option | Complexity | Runtime deps | Drift risk |
|---|---|---|---|
| A. Duplicate `schema.ts`, test that the copies match (chosen) | Low | none | caught by a test |
| B. A third package (`@monoline/registry-types`) both depend on | Medium: one more package to version and publish | one, or type-only with broken `.d.ts` for consumers | none |
| C. MCP imports the type from `monoline` as a type-only dev dependency | Low | none at runtime | none, but MCP's published `.d.ts` would reference a package its users do not have |

A third package is the clean answer once a third consumer appears; for two consumers it adds a publish step for about 100 lines.

### Running TypeScript

| Option | Complexity | Works from `node_modules` | Notes |
|---|---|---|---|
| A. tsc to `dist/` (chosen) | Low | yes | Needs a build before tests and pack; `prepack` covers publish |
| B. Ship `.ts`, rely on Node type stripping | Lowest | no: Node refuses to strip types under `node_modules` | Would break `npx monoline` |
| C. A bundler (esbuild, tsup) | Medium | yes | New tool for two small packages; tsc also writes `.d.ts` |

### Default registry

| Option | Reproducible | Works before the first tag | Notes |
|---|---|---|---|
| A. `v<version>` tag on GitHub (chosen) | yes | no: an unreleased version's tag 404s | Tag is made by the release workflow |
| B. `master` (old) | no | yes | A CLI copies components newer than itself |
| C. The docs site (`monoline.prashantdasari.com/registry/`) | no: always the latest deploy | yes | Same drift as master |
| D. Ship the registry inside the npm tarball | yes | yes | The registry is 2.3 MB on disk with sources; every CLI release would carry it |

## Trade-off analysis

Pinning trades "always newest" for "the components this CLI was tested with". People who want newer components update the CLI or pass `--registry`. The cost lands on unreleased versions: a CLI built from the repo at a version that has no tag yet gets a 404 from the default URL; the error says so and names `--registry`. In the repo, `--registry ./registry` is the way to run it, and the MCP server already finds the repo's `registry/` before falling back to GitHub. If a release ever publishes to npm and then fails before `gh release create`, the tag is missing until the release is re-run; the error names the URL.

Duplicating the schema keeps both packages dependency-free at the price of one equality test.

## Consequences

- Easier: type errors in the CLI and MCP fail `npm test`; a bad registry file is a one-line error, not `c.source is not iterable`; a CLI always copies the registry of its own release.
- Harder: running the packages from the repo needs a build first (`npm test` and `npm pack` do it; `npm run cli` does not). Root `npm run build` does not build them yet.
- The tag must exist for every published version: the release workflow is now part of what makes the CLI work.
- Revisit: a shared types package if a third consumer of the registry appears (docs site, VS Code extension); shipping the registry in the tarball if offline installs matter.

## Action items

1. [x] Port, fixes, tests, README updates in `packages/cli` and `packages/mcp`; fold `docs/mcp.md` into `packages/mcp/README.md`.
2. [ ] Root `package.json` (scripts-ci owner): build cli and mcp in `build`, so `npm run cli` works after a build.
3. [ ] `docs/decisions/README.md`: add the 0008 row.
