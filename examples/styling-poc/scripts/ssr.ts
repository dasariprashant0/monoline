// SSR check: builds src/entries/ssr.tsx with Vite's SSR build (the same plugins as the client), renders every
// approach with renderToString in Node, and compares the class names in that HTML with the ones the client build put
// in the DOM (dist/shots/<page>.classes.json, written by scripts/browser.ts). Equal sets mean hydration sees the
// same classes. Run `npm run build && npm run browser` first. Exits 1 on a mismatch or an empty render.
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'dist-ssr');
await build({
  root,
  logLevel: 'warn',
  build: {ssr: true, outDir, emptyOutDir: true, rollupOptions: {input: join(root, 'src/entries/ssr.tsx')}},
});
const {render} = (await import(join(outDir, 'ssr.js'))) as {render: () => Record<string, string>};
const html = render();

let failed = false;
for (const [page, markup] of Object.entries(html)) {
  const ssr = new Set([...markup.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(/\s+/)).filter(Boolean));
  const file = join(root, 'dist/shots', `${page}.classes.json`);
  const client = existsSync(file) ? new Set<string>(JSON.parse(readFileSync(file, 'utf8'))) : undefined;
  const onlySsr = client ? [...ssr].filter((c) => !client.has(c)) : [];
  const onlyClient = client ? [...client].filter((c) => !ssr.has(c)) : [];
  const ok = markup.length > 0 && !!client && onlySsr.length === 0 && onlyClient.length === 0;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'pass' : 'FAIL'}  ${page}: ${markup.length} chars, ${ssr.size} classes` +
      (client ? `, client DOM ${client.size}` : ', no client class list (run npm run browser)') +
      (onlySsr.length ? `, only in SSR: ${onlySsr.join(' ')}` : '') +
      (onlyClient.length ? `, only in client: ${onlyClient.join(' ')}` : ''),
  );
}
process.exit(failed ? 1 : 0);
