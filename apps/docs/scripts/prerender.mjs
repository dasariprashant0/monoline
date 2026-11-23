// After `vite build`: writes dist/<route>/index.html for every docs route (real HTML, status 200 on any static host),
// plus dist/sitemap.xml and dist/robots.txt. Each page is the built index.html with its own title, description,
// canonical URL, Open Graph and Twitter tags, and the server-rendered page inside #root (the client hydrates it).
// Env: DOCS_ORIGIN (default https://monoline.prashantdasari.com), DOCS_BASE (same value the build used).
import {mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'vite';
import {docsRoot} from './lib/load.mjs';

const origin = (process.env.DOCS_ORIGIN ?? 'https://monoline.prashantdasari.com').replace(/\/+$/, '');
const base = `/${(process.env.DOCS_BASE ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const dist = join(docsRoot, 'dist');
const ssrOut = join(docsRoot, 'node_modules/.prerender');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

rmSync(ssrOut, {recursive: true, force: true});
await build({root: docsRoot, logLevel: 'warn', build: {ssr: 'src/entry-server.tsx', outDir: ssrOut, emptyOutDir: true, copyPublicDir: false}});
const {render, routes} = await import(pathToFileURL(join(ssrOut, 'entry-server.js')).href);

const template = readFileSync(join(dist, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('prerender: dist/index.html has no empty #root');
// The home page's stylesheet is its own lazy chunk. Link it (and preload the body fonts) in the prerendered HTML so the
// first paint is already styled and nothing moves when the script arrives (layout shift on the home page was 0.2 to 0.4).
const assets = readdirSync(join(dist, 'assets'));
const homeCss = assets.find((f) => /^Home-.*\.css$/.test(f));
const fonts = ['dm-mono-400', 'dm-mono-500'].map((n) => assets.find((f) => f.startsWith(`${n}-`) && f.endsWith('.woff2'))).filter(Boolean);
const fontTags = fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${base}assets/${f}" />`);
const url = (path) => `${origin}${base}${path ? `${path}/` : ''}`;

for (const r of routes) {
  const {path, title, description} = r;
  const tags = [
    `<link rel="canonical" href="${url(path)}" />`,
    ...fontTags,
    ...(path === '' && homeCss ? [`<link rel="stylesheet" crossorigin href="${base}assets/${homeCss}" />`] : []),
    `<meta property="og:type" content="website" />`, `<meta property="og:site_name" content="Monoline" />`,
    `<meta property="og:title" content="${esc(title)}" />`, `<meta property="og:description" content="${esc(description)}" />`, `<meta property="og:url" content="${url(path)}" />`,
    `<meta property="og:image" content="${origin}${base}og.png" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`, `<meta name="twitter:card" content="summary_large_image" />`, `<meta name="twitter:image" content="${origin}${base}og.png" />`, `<meta name="twitter:title" content="${esc(title)}" />`, `<meta name="twitter:description" content="${esc(description)}" />`,
  ].join('\n  ');
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace('</head>', `  ${tags}\n</head>`)
    .replace('<div id="root"></div>', () => `<div id="root" data-path="${path}">${render(path)}</div>`);
  const dir = join(dist, path);
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'index.html'), html);
}

writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${url(r.path)}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}sitemap.xml\n# Machine-readable docs for AI tools: ${origin}${base}llms.txt\n`);
rmSync(ssrOut, {recursive: true, force: true});
console.log(`prerender: ${routes.length} pages, sitemap.xml, robots.txt (${origin}${base})`);
