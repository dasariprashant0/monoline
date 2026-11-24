# Monoline

[![npm](https://img.shields.io/npm/v/@monoline/react?label=%40monoline%2Freact)](https://www.npmjs.com/package/@monoline/react)
[![CI](https://github.com/dasariprashant0/monoline/actions/workflows/ci.yml/badge.svg)](https://github.com/dasariprashant0/monoline/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

**[Docs and live demos](https://monoline.prashantdasari.com)** · [Getting started](https://monoline.prashantdasari.com/docs/getting-started/) · [Components](https://monoline.prashantdasari.com/docs/components/) · [Next.js](https://monoline.prashantdasari.com/docs/frameworks/nextjs/) · [Recipes](https://monoline.prashantdasari.com/docs/guides/recipes/) · [Is Monoline for you?](https://monoline.prashantdasari.com/docs/guides/choosing/) · [Playground](https://monoline.prashantdasari.com/playground/) · [Changelog](CHANGELOG.md)

An open-source UI kit with a plain CSS core and accessible React components. Thin rules, one accent, monospace by default, and every part of the look can be changed: eight accents, three themes, three font families, three corner styles and three densities.

Status: 0.x. Minor releases can rename classes or props, each change is in [CHANGELOG.md](CHANGELOG.md). Pin an exact version in production.

- **136 components and 23 hooks**: buttons, forms (combobox, calendar, date picker, OTP, file upload), overlays (dialog, drawer, menus, toast), data display (data table, tree, timeline), navigation, effects and page blocks.
- **Accessible by default**: built on native elements (`<dialog>`, a small floating layer) or Radix, with keyboard and axe tests for every component.
- **Plain CSS tokens**: no Tailwind, no runtime CSS-in-JS. Restyle by changing variables.
- **Two ways to use it**: install the packages, or copy a component into your project with the CLI.
- **AI-readable**: every component has a `meta.json`; `llms.txt`, `llms-full.txt` and `registry/` list and describe them all. See [AGENTS.md](AGENTS.md).

## Quick start (Vite, about ten minutes)

You need Node 20.19 or newer.

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install @monoline/react @monoline/css
rm src/App.tsx src/App.css src/index.css
```

Replace `src/main.tsx` (the Vite template's own CSS fights with Monoline, hence the `rm`):

```tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@monoline/css/core.css';
import '@monoline/css/components/button.css';
import {Button} from '@monoline/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Button variant="solid">Save</Button>
  </StrictMode>,
);
```

```bash
npm run dev
```

`core.css` (tokens, themes, base) is always needed; each component has one small CSS file next to it. A component that looks unstyled is missing its CSS file. To load everything while exploring, use `import '@monoline/css'` (about 21 KB gzip).

The [full guide](https://monoline.prashantdasari.com/docs/getting-started/) continues with theme, dark mode and a dialog. Using Next.js? Read the [Next.js guide](https://monoline.prashantdasari.com/docs/frameworks/nextjs/): `themeScript()` cannot be called from a Server Component, and the guide shows the fix.

## Change the look

Set attributes on `<html>`:

```html
<html data-theme="dark" data-accent="teal" data-font="sans" data-radius="soft" data-density="compact">
```

| Attribute | Values |
|---|---|
| `data-theme` | `warm` (default), `dark`, `midnight` |
| `data-accent` | `orange` (default), `green`, `blue`, `violet`, `rose`, `teal`, `amber`, `slate` |
| `data-font` | `mono` (default), `sans`, `serif` |
| `data-radius` | `square` (default), `soft`, `round` |
| `data-density` | `compact`, `comfortable` (default), `spacious` |

Every accent passes the contrast rules in every theme; `npm run check` enforces it.

## Copy components instead (shadcn style)

```bash
npx monoline init
npx monoline add combobox date-picker data-table
```

The CLI copies the source and CSS into your project and lists any dependencies. Shared helpers (`utils/cx`, `utils/slot`, `utils/overlay`) are copied with the component. Details: [packages/cli/README.md](packages/cli/README.md) and [docs/ADOPTION.md](docs/ADOPTION.md).

## Repository

| Path | What |
|---|---|
| `packages/css` | `@monoline/css`: tokens, themes, accents, options, one stylesheet per component |
| `packages/react` | `@monoline/react`: one folder per component or hook (source, test, demo, `meta.json`) |
| `packages/cli` | the `monoline` CLI |
| `apps/docs` | the documentation site; discovers components automatically |
| `registry/`, `llms.txt`, `llms-full.txt` | generated machine-readable list and source |
| `docs/research` | the library comparison this kit is based on, and the roadmap in `docs/ROADMAP.md` |
| `DESIGN.md` | the look, tokens and rules |

```bash
npm install
npm run dev        # docs site on http://localhost:5180
npm run check      # contrast + raw-colour lint, typecheck, tests
npm run build      # css, react and docs
npm run registry   # regenerate registry/ and llms files
```

## Contributing

Read [AGENTS.md](AGENTS.md) (conventions and the component recipe, for people and AI tools) and [CONTRIBUTING.md](CONTRIBUTING.md). New components need a test with an axe check, a demo and a `meta.json`.

## License

MIT. Fonts (DM Mono, Space Mono) are under the SIL Open Font License; see `packages/css/src/fonts/OFL.txt`.
