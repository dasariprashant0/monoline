# Styling PoC

The M2 comparison: Button, Alert, Tabs and Dialog styled four ways (plain CSS, CSS Modules, Vanilla Extract, Panda CSS) on one shared behaviour implementation. Findings: [docs/audit/m2-styling-poc.md](../../docs/audit/m2-styling-poc.md). Decision: [ADR 0015](../../docs/decisions/0015-styling-approach.md).

Not a workspace, not in CI, not in `npm run check` or `typecheck:examples`. It has its own `package.json` and lockfile because Vanilla Extract and Panda are installed only here.

## Layout

| Path | What |
|---|---|
| `src/kit.tsx` | The components. An approach supplies only class names (`Styles`) through `StylesProvider`. |
| `src/demo.tsx` | The page every approach renders: components, a `data-theme="midnight" data-accent="blue"` subtree, a `data-density="compact" data-radius="round"` subtree, consumer overrides. |
| `src/app.css` | App CSS, unlayered: layout and the overrides. |
| `src/plain`, `src/modules`, `src/ve`, `src/panda` | One styling layer each. Panda's config is `panda.config.ts`. |
| `plain.html`, `modules.html`, `ve.html`, `panda.html`, `index.html` | One page per approach, and all four side by side. |
| `scripts/browser.ts` | Chrome: theme switching, overrides, Tabs and Dialog keyboard, screenshots in `dist/shots/`. |
| `scripts/ssr.ts` | Vite SSR build, `renderToString` per approach, class names compared with the browser's. |
| `scripts/measure.ts` | Per-approach builds: gzip sizes, CSS rules and classes, added packages. |
| `scripts/variant-check.ts` | Prototype: every `Variant`, `Size` and `Tone` value has a selector in `src/plain/styles.css` (`npm run variant-check [file]`). |

## Run it

From the repo root, once: `npm install --cache "$TMPDIR/npm-cache"` and `npm run build -w @monoline/css` (the pages import `packages/css/dist/core.css`). Then:

```bash
cd examples/styling-poc
npm install --cache "$TMPDIR/npm-cache"
npm run typecheck
npm run build
npm run dev          # http://localhost:5173/ (all four), /plain.html, /panda.html ...
```

```bash
npm run browser      # needs Chrome; in the agent sandbox run it outside the sandbox
npm run ssr          # after build and browser
npm run measure
```

`build`, `typecheck`, `dev`, `ssr` and `measure` run `panda codegen` first; `styled-system/` is generated and gitignored.
