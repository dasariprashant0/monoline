// Writes src/page/thumbs.generated.json: for every component, the static HTML of one real demo (see src/page/thumbs-ssr.tsx).
// The Components overview shows it scaled down and inert, so a card is what the component really looks like, in every
// theme, accent and direction, with no JavaScript. Ids and other attributes that would clash across 130 copies are dropped.
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {createServer} from 'vite';
import {docsRoot} from './lib/load.ts';

/** Static markup, safe to paste 130 times into one page: no ids or references to them, nothing focusable or navigable. */
export const clean = (html) => html
  .replace(/<(\/?)a(?=[\s>])/g, '<$1span') // the card is itself a link, and the HTML parser cannot nest one <a> in another
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
  .replace(/\s(?:id|for|name|form|href|tabindex|autofocus|accesskey|aria-(?:labelledby|describedby|controls|owns|activedescendant|details|errormessage|flowto)|popovertarget|list)="[^"]*"/g, '')
  .replace(/\s(?:autofocus|autoplay)(?=[\s>])/g, '')
  .replace(/<(img|video|iframe|source)\b[^>]*>/g, (m) => (/<img\b/.test(m) ? m.replace(/\s(?:srcset|sizes)="[^"]*"/g, '').replace(/\sloading="[^"]*"/g, '') : ''));

const server = await createServer({root: docsRoot, configFile: join(docsRoot, 'vite.config.ts'), server: {middlewareMode: true, hmr: false, watch: null}, appType: 'custom', logLevel: 'error'});
try {
  const {renderThumbs} = await server.ssrLoadModule('/src/page/thumbs-ssr.tsx');
  const html = renderThumbs();
  const out = {};
  for (const [name, h] of Object.entries(html)) out[name] = clean(h);
  const file = join(docsRoot, 'src/page/thumbs.generated.json');
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, JSON.stringify(out) + '\n');
  const bytes = Object.values(out).reduce((n, h) => n + h.length, 0);
  console.log(`thumbs: ${Object.keys(out).length} components, ${(bytes / 1024).toFixed(0)} KB of markup`);
} finally { await server.close(); process.exit(0); } // the CSS plugin's watcher would keep the process alive
