#!/usr/bin/env node
// Firefox and WebKit smoke tests for the built docs site (apps/docs/dist), driven with Playwright and real key and
// pointer input. Five flows: dialog, dropdown menu, select, combobox, tabs. Chromium runs the same flows as a control,
// so a failure that also happens there is a test bug, not a browser difference.
//
//   cd scripts/e2e/cross-browser && npm ci && npx playwright install firefox webkit chromium
//   npm run build                                   (repo root, once)
//   node scripts/e2e/cross-browser/smoke.mjs [--browsers firefox,webkit,chromium] [--grep dialog]
//
// Exit code 1 when any flow fails. Every failure prints what was expected and what the page did.
import {createServer} from 'node:http';
import {existsSync, readFileSync} from 'node:fs';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, firefox, webkit} from 'playwright';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const dist = join(root, 'apps/docs/dist');
if (!existsSync(join(dist, 'index.html'))) { console.error('Build the docs first: npm run build'); process.exit(2); }
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const wanted = opt('browsers', 'firefox,webkit,chromium').split(',');
const grep = opt('grep', '');
const engines = {firefox, webkit, chromium};

const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml'};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(dist, path === '/' ? 'index.html' : path);
  const target = existsSync(file) && extname(file) ? file : (extname(file) ? null : (existsSync(join(file, 'index.html')) ? join(file, 'index.html') : join(dist, 'index.html')));
  if (!target || !target.startsWith(dist) || !existsSync(target)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, {'content-type': mime[extname(target)] ?? 'application/octet-stream'});
  res.end(readFileSync(target));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const T = {timeout: 4000};
// Safari (and Playwright's WebKit on macOS) skips buttons and links on Tab by default; Option+Tab reaches every control.
// Other platforms use plain Tab. The dialog trap check uses this.
const TAB = process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
const BACK = process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab';

/** Open a component page and return a locator for one live example, by its title. */
async function example(page, route, title) {
  await page.goto(base + route);
  await page.locator('.docs-main h1').waitFor(T);
  await page.evaluate(() => document.fonts.ready);
  const ex = page.locator('.cdoc-example', {has: page.locator('h3', {hasText: new RegExp(`^\\s*${title}\\s*#?\\s*$`)})}).first();
  await ex.waitFor(T);
  return ex;
}
const focused = (page) => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.getAttribute('role') ? `[${a.getAttribute('role')}]` : ''} "${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30)}"` : 'nothing'; });

let current = '';
const flows = [
  ['dialog: opens, traps Tab, Escape closes and focus returns to the trigger', async (page) => {
    const ex = await example(page, 'components/dialog', 'Confirm');
    const trigger = ex.getByRole('button', {name: 'Overwrite copy'});
    await trigger.focus(); await page.keyboard.press('Enter', {delay: 40});
    const dlg = page.getByRole('dialog');
    await dlg.waitFor(T);
    must(await dlg.evaluate((d) => d.contains(document.activeElement)), `focus did not move into the dialog, it is on ${await focused(page)}`);
    must(await dlg.getAttribute('aria-labelledby'), 'dialog has no aria-labelledby');
    for (let i = 0; i < 6; i++) { await page.keyboard.press(current === 'webkit' ? TAB : 'Tab', {delay: 40}); must(await dlg.evaluate((d) => d.contains(document.activeElement)), `Tab #${i + 1} left the dialog, focus is on ${await focused(page)}`); }
    for (let i = 0; i < 6; i++) { await page.keyboard.press(current === 'webkit' ? BACK : 'Shift+Tab', {delay: 40}); must(await dlg.evaluate((d) => d.contains(document.activeElement)), `Shift+Tab #${i + 1} left the dialog, focus is on ${await focused(page)}`); }
    await page.keyboard.press('Escape', {delay: 40});
    await dlg.waitFor({state: 'detached', ...T});
    await page.waitForFunction(() => document.activeElement && document.activeElement.textContent.includes('Overwrite copy'), null, T).catch(async () => { throw new Error(`focus did not return to the trigger, it is on ${await focused(page)}`); });
  }],
  ['dropdown-menu: Enter opens, arrows move, Escape closes and focus returns', async (page) => {
    const ex = await example(page, 'components/dropdown-menu', 'Actions');
    const trigger = ex.getByRole('button', {name: 'Actions'}).first();
    await trigger.focus(); await page.keyboard.press('Enter', {delay: 40});
    const menu = page.getByRole('menu');
    await menu.waitFor(T);
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem', null, T).catch(async () => { throw new Error(`focus did not land on a menu item, it is on ${await focused(page)}`); });
    const first = await focused(page);
    await page.keyboard.press('ArrowDown', {delay: 40});
    must((await focused(page)) !== first, 'ArrowDown did not move focus to the next item');
    await page.keyboard.press('Escape', {delay: 40});
    await menu.waitFor({state: 'detached', ...T});
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-haspopup') === 'menu' || document.activeElement?.textContent.includes('Actions'), null, T).catch(async () => { throw new Error(`focus did not return to the trigger, it is on ${await focused(page)}`); });
  }],
  ['select: Enter opens, ArrowDown and Enter choose, focus stays on the trigger', async (page) => {
    const ex = await example(page, 'components/select', 'In a field');
    const trigger = ex.getByRole('combobox').first();
    await trigger.focus(); await page.keyboard.press('Enter', {delay: 40});
    await page.getByRole('listbox').waitFor(T);
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option', null, T).catch(async () => { throw new Error(`focus did not move into the list, it is on ${await focused(page)}`); });
    const before = (await trigger.textContent()).trim();
    await page.keyboard.press('ArrowDown', {delay: 40}); await page.keyboard.press('Enter', {delay: 40});
    await page.getByRole('listbox').waitFor({state: 'detached', ...T});
    must((await trigger.textContent()).trim() !== before, `the value did not change from "${before}"`);
    must(await trigger.evaluate((e) => e === document.activeElement), `focus did not return to the select, it is on ${await focused(page)}`);
  }],
  ['combobox: typing opens and filters, ArrowDown moves aria-activedescendant, Enter picks', async (page) => {
    const ex = await example(page, 'components/combobox', 'Search and pick');
    const input = ex.locator('input[role=combobox]').first();
    await input.focus(); await page.keyboard.type('a');
    await page.waitForFunction(() => document.querySelector('input[role=combobox]')?.getAttribute('aria-expanded') === 'true', null, T).catch(() => { throw new Error('typing did not open the list'); });
    await page.keyboard.press('ArrowDown', {delay: 40});
    const id = await input.getAttribute('aria-activedescendant');
    must(id, 'ArrowDown set no aria-activedescendant');
    const picked = (await page.locator(`[id="${id}"]`).textContent()).trim();
    must(await input.evaluate((e) => e === document.activeElement), 'DOM focus left the input');
    await page.keyboard.press('Enter', {delay: 40});
    await page.waitForFunction(() => document.querySelector('input[role=combobox]')?.getAttribute('aria-expanded') === 'false', null, T).catch(() => { throw new Error('the list stayed open after Enter'); });
    must((await input.inputValue()) === picked, `input value "${await input.inputValue()}" is not the picked option "${picked}"`);
  }],
  ['tabs: ArrowRight moves focus and selects, End jumps, ArrowRight wraps', async (page) => {
    const ex = await example(page, 'components/tabs', 'Horizontal');
    const tab = (n) => ex.getByRole('tab', {name: n});
    await tab('Overview').focus();
    must((await tab('Overview').getAttribute('aria-selected')) === 'true', 'Overview should start selected');
    await page.keyboard.press('ArrowRight', {delay: 40});
    must((await tab('Activity').getAttribute('aria-selected')) === 'true', `ArrowRight did not select Activity, focus is on ${await focused(page)}`);
    must(await tab('Activity').evaluate((e) => e === document.activeElement), 'focus did not follow selection');
    await page.keyboard.press('End', {delay: 40});
    must((await tab('Settings').getAttribute('aria-selected')) === 'true', 'End did not select the last tab');
    await page.keyboard.press('ArrowRight', {delay: 40});
    must((await tab('Overview').getAttribute('aria-selected')) === 'true', 'ArrowRight did not wrap to the first tab');
  }],
];

let failed = 0;
for (const name of wanted) {
  const engine = engines[name];
  if (!engine) { console.error(`unknown browser ${name}`); failed++; continue; }
  let browser;
  // The chromium control uses the machine's Chrome (CHROME_CHANNEL=chrome, the default) so it needs no download.
  try { browser = await engine.launch(name === 'chromium' ? {channel: process.env.CHROME_CHANNEL ?? 'chrome'} : {}); } catch (e) { console.log(`  SKIP ${name}: cannot launch (${e.message.split('\n')[0]}). Run: npx playwright install ${name}`); failed++; continue; }
  current = name;
  console.log(`${name} ${browser.version()}`);
  for (const [title, fn] of flows) {
    if (!title.includes(grep)) continue;
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, reducedMotion: 'reduce'});
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
    const t0 = Date.now();
    try { await fn(page); must(!errors.length, `uncaught page error: ${errors[0]}`); console.log(`  ok   ${title} (${Date.now() - t0}ms)`); }
    catch (e) { failed++; console.log(`  FAIL ${title}\n       ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  await browser.close();
}
server.close();
console.log(failed ? `\n${failed} problem(s)` : '\nall flows passed');
process.exit(failed ? 1 : 0);
