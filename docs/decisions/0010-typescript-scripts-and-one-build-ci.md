# 0010: Scripts in TypeScript run by Node, and CI that builds once

Status: accepted

## Context

- About 6,000 lines of build, check, test and browser scripts (`scripts/`, `packages/*/scripts`, `apps/docs/scripts`, `packages/vscode`) were untyped `.mjs`. Type errors surfaced only when a script ran, often only in CI.
- The scripts imported `esbuild` and `typescript` without declaring them; they resolved only because other workspaces pulled them in.
- CI ran `npm run build` 16 times per push (the `check` job, 3 e2e jobs, `ax`, 8 accent audits, `css-computed`, `overlays`, `examples`), plus a partial css and react build for `install-smoke`. Four suites never ran in CI: `test:tokens`, `test:docs`, the vscode snippet test and `check:package-types`. Jobs had no `timeout-minutes`, and only `release.yml` set `permissions`.
- `test:tokens` and `test:docs` passed a directory to `node --test`. That works on Node 24 but fails on Node 22, which CI runs ("Cannot find module .../test").
- The `probe` job failed now and then: its first probe opens the context-menu page cold and looked up an example once, before the example had rendered.

## Options

**How the scripts run as TypeScript**

| Option | For | Against |
|---|---|---|
| Node's built-in type stripping, `node x.ts` | No dependency, no build step, no loader flag. On by default from Node 22.18 (checked on 22.23.5 and 26.10: no flag, no warning) | Only erasable syntax (no `enum`, `namespace`, parameter properties). Relative imports must name `.ts`. Node will not strip files under `node_modules` |
| `tsx` or `ts-node` loader | Full TS syntax | A new dev dependency and a loader on every command; one more tool that can drift from Node |
| Compile to `dist/` with `tsc` | Plain JS at run time | A build before every script, and generated JS to keep out of git. Worth it for the published CLI and MCP (ADR 0008), not for repo tooling |
| `// @ts-check` with JSDoc in `.mjs` | No rename | Types in comments are verbose, and the task asked for TS |

**How CI avoids rebuilding**

| Option | For | Against |
|---|---|---|
| One workflow: a `build` job uploads `dist` as an artifact, browser jobs download it | Plain Actions, one build per push, `needs:` makes the order visible | One big file. A failed build skips every browser job (which is what we want) |
| Keep four workflows, chain them with `workflow_run` | Files stay small | Cross-workflow artifacts need run IDs and extra permissions, and PR checks get harder to read |
| Cache `dist` with `actions/cache` keyed on the source hash | Separate files stay | Cache keys must list every input; a stale key silently tests old output |

**turbo or nx**

Measured locally (darwin arm64, warm cache): css 1.3 s, react 17.6 s, docs gen 16.3 s, docs Vite build 23.2 s, prerender 2.3 s. A full `npm run build` took 24 to 61 s over four runs. The chain is sequential (the root script builds css, then react, then docs, and docs consumes both `dist` folders), so a task runner has nothing to run in parallel. Its other gain is caching unchanged packages, which saves at most about 20 s (css plus react) on a push that touches only docs, and in CI only with a remote cache (Vercel or self-hosted) or a hand-keyed `actions/cache`. With the build already down to one run per push, that does not pay for a new dependency, its config and a cache service.

## Decision

- Scripts are `.ts`, run with `node path/to/script.ts`. `tsconfig.scripts.json` type-checks them (`strict`, `noEmit`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`), and `npm run check` runs it as `typecheck:scripts`. `.nvmrc` is 22 and the root `engines` is `>=22.18`.
- `node --test` takes quoted globs (`'test/*.test.ts'`), which work on Node 22 and 24.
- `esbuild`, `typescript` and `@types/node` are root dev dependencies; `esbuild` is also a dev dependency of `@monoline/css` (`check-layers`).
- Two files stay JavaScript on purpose: `apps/docs/scripts/lib/a11y.mjs` (the docs app imports it) and `scripts/e2e/cross-browser/smoke.mjs` (its own package with Playwright, installed only in CI). `apps/docs/vite.config.ts` spawns `packages/css/scripts/build.ts` directly; note that it ignores a missing file, so a rename there must update it.
- CI is one workflow, `ci.yml`. `build` runs `npm run build` once, plus size, `check:package-types`, the registry diff and the release dry run, and uploads `dist`. `test` runs the fast suites (check, cli, mcp, release, tokens, docs scripts, vscode, tokens diff) on Node 22 and 24. Browser jobs download `dist`. `check` and `a11y` are aggregate jobs, so the check names that branch protection may wait on keep working. Every job has `timeout-minutes`, and the workflow sets `permissions: contents: read`.
- `page.example()` in the e2e helper waits up to 10 s for the example to render. That fixes the probe and every test that calls it.
- No turbo or nx. Revisit if the build stops being a single chain, or a remote cache is available for free.

## Consequences

- `npm run build` runs once per push instead of 16 full times plus one partial. Browser jobs start after the build (about a minute later) rather than all building at once.
- A script written with `enum`, `namespace` or a parameter property fails at once in Node and in `typecheck:scripts`. Use string unions and plain objects.
- Moving a script means updating its relative imports, which must include the `.ts`.
- Generated text that names a script (the tokens `dist/` headers, `docs/a11y-report.md`) was regenerated with the `.ts` paths. So does the CSS `dist/` banner, now that the `build.mjs` shim is gone.
- Node older than 22.18 cannot run the scripts.
