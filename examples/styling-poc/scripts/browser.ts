// Real-browser checks for every approach page in dist/ (run `npm run build` first). Chrome is blocked by the agent
// sandbox: run outside it. Prints one table per page; exits 1 if a keyboard or theme check fails. The override rows
// are measurements for docs/audit/m2-styling-poc.md, so they are reported, not enforced.
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {launchChrome, serveDist} from '../../../scripts/lib/cdp.ts';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = ['plain', 'modules', 've', 'panda'].filter((p) => existsSync(`${dist}${p}.html`));
const {server, base} = await serveDist(dist);
const {cdp, evaluate, close} = await launchChrome({label: 'styling-poc'});
await cdp('Emulation.setDeviceMetricsOverride', {width: 1280, height: 900, deviceScaleFactor: 1, mobile: false});

const codes: Record<string, number> = {Enter: 13, Escape: 27, ArrowRight: 39, ArrowLeft: 37, Home: 36, End: 35};
async function press(key: string) {
  const k = {key, code: key, windowsVirtualKeyCode: codes[key], ...(key === 'Enter' ? {text: '\r'} : {})};
  await cdp('Input.dispatchKeyEvent', {type: 'keyDown', ...k});
  await cdp('Input.dispatchKeyEvent', {type: 'keyUp', ...k});
  await new Promise((r) => setTimeout(r, 50));
}

// In-page helpers: `$` finds a data-check element in the main demo (not the subtree copy), `resolve` turns a CSS
// value into the computed colour it gives inside an element, so token values can be compared without hardcoding.
const helpers = `
  var $ = (c, root = document) => root.querySelector('[data-check="' + c + '"]');
  var cs = (el) => getComputedStyle(el);
  var resolve = (el, v) => { const s = document.createElement('span'); s.style.color = v; el.append(s); const c = cs(s).color; s.remove(); return c; };
`;

let failed = false;
mkdirSync(`${dist}shots`, {recursive: true});
for (const page of pages) {
  await cdp('Page.navigate', {url: `${base}${page}.html`});
  for (let i = 0; i < 100 && !(await evaluate(`!!document.querySelector('[data-check="solid"]')`)); i++)
    await new Promise((r) => setTimeout(r, 50));
  await evaluate(helpers);
  // The client's class names, before any interaction, for scripts/ssr.ts to compare with the server render.
  const classes = await evaluate(
    `[...new Set([...document.querySelectorAll('section.demo, section.demo [class]')].flatMap((e) => [...e.classList]))]`,
  );
  writeFileSync(`${dist}shots/${page}.classes.json`, JSON.stringify(classes));
  const rows: [string, boolean, string][] = [];
  const check = async (name: string, expr: string, enforce = true) => {
    const [ok, detail] = await evaluate(`(async () => { ${expr} })()`);
    rows.push([name, ok, detail]);
    if (enforce && !ok) failed = true;
  };

  // Theme switching. The dark check waits out the button's background transition.
  await check(
    'theme: solid button = --foreground',
    `const b = $('solid'); return [cs(b).backgroundColor === resolve(document.body, 'var(--foreground)'), cs(b).backgroundColor];`,
  );
  await check(
    'theme: <html data-theme=dark> repaints',
    `document.documentElement.dataset.theme = 'dark'; await new Promise((r) => setTimeout(r, 400)); const b = $('solid'); const r = [cs(b).backgroundColor === resolve(document.body, 'var(--foreground)'), cs(b).backgroundColor]; document.documentElement.dataset.theme = 'warm'; await new Promise((r) => setTimeout(r, 400)); return r;`,
  );
  await check(
    'theme: subtree midnight solid = subtree --foreground',
    `const t = $('subtree'); const b = $('solid', t); return [cs(b).backgroundColor === resolve(t, 'var(--foreground)'), cs(b).backgroundColor];`,
  );
  await check(
    'theme: subtree info alert bar = subtree --accent',
    `const t = $('subtree'); const a = $('alert-info', t); return [cs(a).boxShadow.includes(resolve(t, 'var(--accent)')), cs(a).boxShadow];`,
  );
  await check(
    'theme: subtree alert --wash re-derived',
    `const t = $('subtree'); const a = $('alert-info', t); return [cs(a).backgroundColor === resolve(t, 'color-mix(in srgb, var(--foreground) 4%, transparent)'), cs(a).backgroundColor];`,
    false,
  );

  await check(
    'variant: neutral alert bar = --muted',
    `const a = $('alert-neutral'); return [cs(a).boxShadow.includes(resolve(document.body, 'var(--muted)')), cs(a).boxShadow];`,
  );

  // Consumer overrides (measured, not enforced).
  await check(
    'override: className on Button',
    `const c = cs($('override-class')).backgroundColor; return [c === 'rgb(0, 128, 0)', c];`,
    false,
  );
  await check(
    'override: className on tone-coloured AlertTitle',
    `const c = cs($('override-class-title')).color; return [c === 'rgb(0, 128, 0)', c];`,
    false,
  );
  await check(
    'override: --btn-bg on a wrapper',
    `const c = cs($('override-var')).backgroundColor; return [c === 'rgb(0, 0, 255)', c];`,
    false,
  );
  await check(
    'override: --accent on a wrapper',
    `const c = cs($('override-accent')).boxShadow; return [c.includes('rgb(255, 0, 255)'), c];`,
    false,
  );
  await check(
    'override: [data-variant="ghost"]',
    `const c = cs($('override-data')).color; return [c === 'rgb(255, 0, 0)', c];`,
    false,
  );
  await check(
    'override: [data-state="active"]',
    `const c = cs($('override-data-state')).borderBottomColor; return [c === 'rgb(255, 0, 0)', c];`,
    false,
  );

  // Keyboard: Tabs roving focus with automatic activation.
  const tab = `const a = document.activeElement; const p = document.getElementById(a.getAttribute('aria-controls'));`;
  await evaluate(`$('tabs').querySelector('[role="tab"]').focus()`);
  for (const [key, want] of [
    ['ArrowRight', 'Members'],
    ['End', 'Billing'],
    ['Home', 'Overview'],
    ['ArrowLeft', 'Billing'],
  ]) {
    await press(key!);
    await check(
      `keyboard: Tabs ${key} -> ${want}`,
      `${tab} return [a.textContent === '${want}' && a.getAttribute('aria-selected') === 'true' && a.dataset.state === 'active' && !p.hidden, a.textContent];`,
    );
  }
  // Keyboard: Dialog opens on Enter, Escape closes it, focus returns to the trigger.
  await evaluate(`$('dialog-trigger').focus()`);
  await press('Enter');
  await check(
    'keyboard: Dialog Enter opens, focus inside',
    `const d = document.querySelector('dialog[open]'); return [!!d && d.contains(document.activeElement) && d.dataset.state === 'open', document.activeElement.outerHTML.slice(0, 60)];`,
  );
  const shot = await cdp('Page.captureScreenshot', {format: 'png'});
  writeFileSync(`${dist}shots/${page}-dialog.png`, Buffer.from(shot.data, 'base64'));
  await press('Escape');
  await check(
    'keyboard: Dialog Escape closes, focus on trigger',
    `return [!document.querySelector('dialog[open]') && document.activeElement === $('dialog-trigger'), document.activeElement.textContent];`,
  );

  const full = await cdp('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true});
  writeFileSync(`${dist}shots/${page}.png`, Buffer.from(full.data, 'base64'));
  console.log(`\n${page}`);
  for (const [name, ok, detail] of rows) console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}  (${detail})`);
}

close();
server.close();
console.log(`\nscreenshots: ${dist}shots`);
process.exit(failed ? 1 : 0);
