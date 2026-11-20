#!/usr/bin/env node
// Facts, not pass/fail tests: re-checks the open items in docs/e2e-findings.md (written before the 0.4 native-dialog
// rewrite) and the forced-colors / prefers-contrast gap, and prints what the page does. Exit code is 1 when any probe
// shows a barrier, so it can be wired into CI once WP2 and WP4 have fixed them (it is NOT in the e2e suite yet).
//
//   npm run build && node scripts/e2e/probe.mjs
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchChrome, serveDist} from '../lib/cdp.mjs';
import {createPage} from './page.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const {server, base} = await serveDist(join(root, 'apps/docs/dist'));
const browser = await launchChrome({label: 'monoline-probe'});
const p = await createPage(browser, base);
const results = [];
const probe = async (id, what, fn) => {
  p.begin();
  try { const r = await fn(); results.push({id, what, ...r}); }
  catch (e) { results.push({id, what, barrier: true, detail: `probe crashed: ${e.message}`}); }
};

await probe('F7a', 'context-menu: the demo trigger can take keyboard focus', async () => {
  await p.open('components/context-menu'); const ex = await p.example('Right click the box');
  const info = await p.eval(`(() => { const ex = document.querySelector('[data-e2e]'); const t = ex.querySelector('.cdoc-stage > *'); const focusable = t && (t.tabIndex >= 0); return {tag: t && t.tagName.toLowerCase(), tabIndex: t && t.tabIndex, role: t && t.getAttribute('role'), focusable: !!focusable}; })()`);
  return {barrier: !info.focusable, detail: JSON.stringify(info)};
});

await probe('F7b', 'drawer: a visible close control exists inside the open drawer', async () => {
  await p.open('components/drawer'); const ex = await p.example('Right and left');
  await ex.click('button|Open right');
  await p.waitFor(`document.querySelector('[role=dialog][data-state=open]')`, 'drawer did not open');
  const info = await p.eval(`(() => { const d = document.querySelector('[role=dialog][data-state=open]'); const bs = [...d.querySelectorAll('button')].filter(__e2e.visible).map((b) => (b.getAttribute('aria-label') || b.textContent).trim()); return bs; })()`);
  const hasClose = info.some((t) => /close|dismiss|cancel|done/i.test(t));
  return {barrier: !hasClose, detail: `buttons inside the drawer: ${JSON.stringify(info)}`};
});

await probe('F7c', 'tooltip: still visible after real Tab brings a trigger below the fold into view', async () => {
  await p.open('components/tooltip', {height: 400});
  const info = await p.eval(`(() => { const ex = document.querySelector('.cdoc-example'); const t = [...ex.querySelectorAll('.cdoc-stage button')].find((b) => !b.closest('.pg-stage')); return {y: Math.round(t.getBoundingClientRect().y), text: t.textContent.trim()}; })()`);
  // Put a focus anchor just before the first example's trigger (scripted, setup only), then press the real Tab key.
  await p.eval(`(() => { const t = [...document.querySelectorAll('.cdoc-stage button')].find((b) => !b.closest('.pg-stage')); const a = document.createElement('span'); a.tabIndex = 0; t.before(a); a.focus({preventScroll: true}); })()`);
  await p.key('Tab');
  await p.sleep(500);
  const shown = await p.eval(`!!document.querySelector('[role=tooltip]')`);
  // Control: with the trigger already in view, does a keyboard focus show the tooltip at all? (separates "closed by scroll" from "never opened")
  let control = 'n/a';
  if (!shown) { await p.eval(`document.activeElement.blur()`); await p.key('Tab', 'shift'); await p.key('Tab'); await p.sleep(500); control = await p.eval(`!!document.querySelector('[role=tooltip]')`); }
  return {barrier: !shown, detail: `focus on ${await p.active()}; trigger started at y=${info.y}; tooltip in DOM: ${shown}; control (trigger already in view, Shift+Tab then Tab): ${control}`};
});

await probe('F7d', 'combobox: stays closed on focus, opens on typing or ArrowDown (APG)', async () => {
  await p.open('components/combobox'); const ex = await p.example('Search and pick');
  await ex.focus('input[role=combobox]'); await p.sleep(200);
  const expanded = await p.attr('input[role=combobox]', 'aria-expanded');
  return {barrier: expanded === 'true', detail: `aria-expanded after focus: ${expanded}`};
});

await probe('F5a', 'forced-colors: stylesheet has forced-colors or prefers-contrast rules', async () => {
  await p.open('components/button');
  const n = await p.eval(`(() => { let fc = 0, pc = 0; const walk = (rules) => { for (const r of rules) { if (r.media) { const t = r.media.mediaText; if (/forced-colors/.test(t)) fc++; if (/prefers-contrast/.test(t)) pc++; } if (r.cssRules) walk(r.cssRules); } }; for (const s of document.styleSheets) { try { walk(s.cssRules); } catch {} } return {forcedColors: fc, prefersContrast: pc}; })()`);
  return {barrier: n.forcedColors === 0 || n.prefersContrast === 0, detail: JSON.stringify(n)};
});

await probe('F5b', 'forced-colors: focus ring on button, checkbox and input is a visible outline (not box-shadow only)', async () => {
  await p.open('components/button');
  await p.eval(`(() => {})()`);
  await browser.cdp('Emulation.setEmulatedMedia', {features: [{name: 'forced-colors', value: 'active'}, {name: 'prefers-reduced-motion', value: 'reduce'}]});
  await p.sleep(200);
  const out = [];
  for (const [route, ex, sel] of [['components/button', null, 'button'], ['components/checkbox', null, 'input[type=checkbox], [role=checkbox]'], ['components/input', null, 'input']]) {
    await p.open(route); await browser.cdp('Emulation.setEmulatedMedia', {features: [{name: 'forced-colors', value: 'active'}]});
    await p.eval(`(() => { const e = document.querySelector('.cdoc-stage ${sel}'); e.focus({preventScroll: true}); })()`);
    await p.key('Shift'); await p.sleep(100);
    const r = await p.eval(`(() => { const a = document.activeElement; const s = getComputedStyle(a); return {tag: a.tagName.toLowerCase(), outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow === 'none' ? 'none' : 'set', focusVisible: a.matches(':focus-visible')}; })()`);
    out.push({route, ...r});
  }
  await browser.cdp('Emulation.setEmulatedMedia', {features: [{name: 'forced-colors', value: 'none'}]});
  const bad = out.filter((o) => o.outlineStyle === 'none' || parseFloat(o.outlineWidth) === 0);
  return {barrier: bad.length > 0, detail: JSON.stringify(out)};
});

for (const r of results) console.log(`${r.barrier ? 'BARRIER' : 'ok     '} ${r.id} ${r.what}\n        ${r.detail}`);
const bad = results.filter((r) => r.barrier).length;
console.log(`\n${bad} of ${results.length} probes show a barrier`);
browser.close(); server.close();
process.exit(bad ? 1 : 0);
