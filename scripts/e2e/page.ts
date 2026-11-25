// A browser page for tests: navigation, real keyboard and pointer input (Input.dispatch*Event) and queries.
//
// Selector specs: a CSS selector, optionally followed by `|text` to keep the first visible match whose text or
// aria-label (or enclosing <label>) contains `text`; `|=text` needs an exact match:  'button|Open'  '[role=option]|Banana'. Plain specs match the first visible element.
// p.example('Title') returns the same API scoped to one live example on a component page (the demo's title).
const KEYS: Record<string, [number, string, string?]> = {
  Enter: [13, 'Enter', '\r'],
  Escape: [27, 'Escape'],
  Tab: [9, 'Tab'],
  ' ': [32, 'Space', ' '],
  Space: [32, 'Space', ' '],
  ArrowLeft: [37, 'ArrowLeft'],
  ArrowUp: [38, 'ArrowUp'],
  ArrowRight: [39, 'ArrowRight'],
  ArrowDown: [40, 'ArrowDown'],
  Shift: [16, 'ShiftLeft'],
  Control: [17, 'ControlLeft'],
  Alt: [18, 'AltLeft'],
  F8: [119, 'F8'],
  F10: [121, 'F10'],
  Home: [36, 'Home'],
  End: [35, 'End'],
  PageUp: [33, 'PageUp'],
  PageDown: [34, 'PageDown'],
  Backspace: [8, 'Backspace'],
  Delete: [46, 'Delete'],
};
const MOD = {alt: 1, ctrl: 2, meta: 4, shift: 8};

// Installed in every document before page scripts run.
const PRELOAD = `(() => {
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const label = (e) => ((e.getAttribute('aria-label') || '') + ' ' + (e.textContent || '') + ' ' + ((e.closest('label') || {}).textContent || '')).replace(/\\s+/g, ' ');
  window.__e2e = {
    visible,
    all(spec, scope) {
      const [sel, ...rest] = spec.split('|'); const text = rest.join('|');
      const root = scope ? document.querySelector(scope) : document;
      if (!root) return [];
      // The props playground (added to every component page) renders a second live copy of the component above the examples: page-level lookups must not match it.
      return [...root.querySelectorAll(sel)].filter((e) => scope || !e.closest('.pg-stage, .pg-controls')).filter((e) => !text || (text[0] === '=' ? ((e.closest('label') || e).textContent.trim() === text.slice(1) || (e.getAttribute('aria-label') || '') === text.slice(1)) : label(e).includes(text)));
    },
    find(spec, scope) { return this.all(spec, scope).find(visible) || null; },
    describe(e) {
      if (!e) return 'nothing';
      const a = e === document.body ? 'body' : e.tagName.toLowerCase();
      const role = e.getAttribute('role');
      const name = (e.getAttribute('aria-label') || e.value || e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40);
      return a + (role ? '[' + role + ']' : '') + (name ? ' "' + name + '"' : '') + (e.id ? '#' + e.id : '');
    },
  };
})()`;

import {eq} from './test.ts';
import type {Browser, CdpMessage, Evaluate} from '../lib/cdp.ts';

type Modifier = keyof typeof MOD;
export type Rect = {x: number; y: number; w: number; h: number; right: number; bottom: number};
/** The page API, or the same API scoped to one live example (p.example()). Values read from the page are as the page returns them. */
export interface Scope {
  base: string;
  errors: string[];
  eval: Evaluate;
  sleep(ms: number): Promise<void>;
  open(
    path: string,
    opts?: {width?: number; height?: number; dir?: string; mobile?: boolean; motion?: boolean},
  ): Promise<Scope>;
  example(title: string): Promise<Scope>;
  settle(): Promise<unknown>;
  waitFor(expr: string, msg: string, ms?: number): Promise<void>;
  has(spec: string): Promise<boolean>;
  count(spec: string): Promise<number>;
  need(spec: string): Promise<void>;
  text(spec?: string): Promise<string | null>;
  attr(spec: string, name: string): Promise<string | null | undefined>;
  prop(spec: string, expr: string): Promise<CdpMessage>;
  rect(spec: string): Promise<Rect | null>;
  active(): Promise<string>;
  activeAttr(name: string): Promise<string | null>;
  activeIs(spec: string): Promise<boolean>;
  focus(spec: string): Promise<true>;
  expectActive(spec: string, msg?: string): Promise<void>;
  expectAttr(spec: string, name: string, value: string | null | undefined, msg?: string): Promise<void>;
  scrollTo(spec: string): Promise<void>;
  key(name: string, ...modifiers: Modifier[]): Promise<void>;
  keys(...names: string[]): Promise<void>;
  type(str: string): Promise<void>;
  tab(n?: number, back?: boolean): Promise<void>;
  mouse(type: string, x: number, y: number, button?: string, held?: boolean): Promise<void>;
  drag(x: number, y: number, to: [number, number][]): Promise<void>;
  point(spec: string): Promise<{x: number; y: number}>;
  click(spec: string, button?: string): Promise<void>;
  clickAt(x: number, y: number): Promise<void>;
  hover(spec: string): Promise<void>;
  wheel(spec: string, deltaY: number, deltaX?: number): Promise<void>;
}
/** What createPage resolves to: the page-wide Scope plus the runner's hooks. */
export interface Page extends Scope {
  begin(): void;
  abort(): void;
  lastCall(): string;
}

export async function createPage(browser: Browser, base: string): Promise<Page> {
  const {cdp, evaluate, listeners, sessionId} = browser;
  const errors: string[] = [];
  listeners.push((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown')
      errors.push((m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300));
  });
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Emulation.setFocusEmulationEnabled', {enabled: true});
  await cdp('Page.addScriptToEvaluateOnNewDocument', {source: PRELOAD});
  let aborted = false;
  let lastCall = '';
  // sleep throws once a test has timed out, so an orphaned test cannot keep driving the page during the next one
  const sleep = (ms: number) =>
    new Promise<void>((r, j) => setTimeout(() => (aborted ? j(new Error('test aborted')) : r()), ms));
  const J = JSON.stringify;

  const make = (scope: string | null) => {
    const S = scope ? J(scope) : 'null';
    const api: Scope = {
      base,
      errors,
      eval: evaluate,
      sleep,
      /** Navigate to a route and wait for the docs page heading. Options: width, height, dir, mobile, motion. */
      async open(path, {width = 1280, height = 800, dir = 'ltr', mobile = false, motion = false} = {}) {
        errors.length = 0;
        await cdp('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile});
        await cdp('Emulation.setEmulatedMedia', {
          features: [{name: 'prefers-reduced-motion', value: motion ? 'no-preference' : 'reduce'}],
        });
        // direction is a docs preference (saved in localStorage): set it before the app boots, every time, so no test inherits another's
        const {identifier} = await cdp('Page.addScriptToEvaluateOnNewDocument', {
          source: `try { localStorage.setItem('monoline-prefs', JSON.stringify({dir: ${J(dir)}})); } catch {}`,
        });
        await cdp('Page.navigate', {url: base + path.replace(/^\//, '')});
        await api.waitFor(
          `!!document.querySelector('.docs-main h1') && document.fonts.status === 'loaded' && document.documentElement.dir === ${J(dir)}`,
          `page ${path} did not render`,
          20000,
        );
        await cdp('Page.removeScriptToEvaluateOnNewDocument', {identifier});
        eq(await evaluate('document.documentElement.dir'), dir, 'document direction');
        await evaluate(`document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)`);
        await sleep(250); // the docs router scrolls and focuses after render; let it settle before the test acts
        return api;
      },
      /** Scope to one live example on a component page, by its title. Waits for the example to render (a cold first page can lag the heading). */
      example(title) {
        const tag = `e2e-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return api
          .waitFor(
            `(() => { const h = [...document.querySelectorAll('.cdoc-example > h3')].find((x) => x.textContent.trim().replace(/#$/, '') === ${J(title)}); if (!h) return false; h.parentElement.setAttribute('data-e2e', ${J(tag)}); return true; })()`,
            `no example titled "${title}" on this page`,
            10000,
          )
          .then(() => make(`[data-e2e="${tag}"]`));
      },
      /** Two animation frames: React has committed and rAF-based focus moves have run. */
      settle: () =>
        evaluate(`new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 10))))`),
      async waitFor(expr, msg, ms = 2500) {
        const end = Date.now() + ms;
        let last;
        while (Date.now() < end) {
          try {
            last = await evaluate(`Boolean(${expr})`);
            if (last) return;
          } catch (e) {
            last = (e as Error).message;
          }
          await sleep(40);
        }
        throw new Error(`timed out: ${msg}${typeof last === 'string' ? ` (${last})` : ''}`);
      },
      /** True if a visible element matches. */
      has: (spec) => evaluate(`!!__e2e.find(${J(spec)}, ${S})`),
      count: (spec) => evaluate(`__e2e.all(${J(spec)}, ${S}).filter(__e2e.visible).length`),
      async need(spec) {
        if (!(await api.has(spec)))
          throw new Error(`expected a visible "${spec}"${scope ? ' in the example' : ''}, found none`);
      },
      text: (spec) =>
        evaluate(
          `(() => { const e = ${spec ? `__e2e.find(${J(spec)}, ${S})` : 'document.body'}; return e ? e.innerText : null; })()`,
        ),
      attr: (spec, name) =>
        evaluate(
          `(() => { const e = __e2e.find(${J(spec)}, ${S}); return e ? e.getAttribute(${J(name)}) : undefined; })()`,
        ),
      /** Computed property or DOM property of the first visible match. */
      prop: (spec, expr) =>
        evaluate(
          `(() => { const e = __e2e.find(${J(spec)}, ${S}); if (!e) return undefined; return (${expr})(e); })()`,
        ),
      rect: (spec) =>
        evaluate(
          `(() => { const e = __e2e.find(${J(spec)}, ${S}); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom}; })()`,
        ),
      /** Describes document.activeElement, e.g. `button "Open"`; pierces nothing (shadow DOM is not used here). */
      active: () => evaluate(`__e2e.describe(document.activeElement)`),
      activeAttr: (name) => evaluate(`document.activeElement && document.activeElement.getAttribute(${J(name)})`),
      /** Does the active element match this spec? */
      activeIs: (spec) =>
        evaluate(
          `(() => { const a = document.activeElement; if (!a) return false; return __e2e.all(${J(spec)}, null).includes(a); })()`,
        ),
      /** Focus by script: setup only. Use Tab or clicks for the behaviour under test. */
      focus: async (spec) => {
        await api.scrollTo(spec);
        await sleep(120);
        return evaluate(
          `(() => { const e = __e2e.find(${J(spec)}, ${S}); if (!e) throw new Error('nothing to focus: ${spec.replace(/'/g, '')}'); e.focus({preventScroll: true}); return true; })()`,
        );
      },
      async expectActive(spec, msg) {
        // Focus return after an overlay closes can land a tick later, so poll briefly.
        for (let i = 0; i < 20; i++) {
          if (await api.activeIs(spec)) return;
          await sleep(50);
        }
        throw new Error(`${msg ?? 'focus'}: expected focus on "${spec}", it is on ${await api.active()}`);
      },
      async expectAttr(spec, name, value, msg) {
        const got = await api.attr(spec, name);
        if (got !== value) throw new Error(`${msg ?? spec}: expected ${name}=${J(value)}, got ${J(got)}`);
      },
      async scrollTo(spec) {
        await evaluate(
          `(() => { const e = __e2e.find(${J(spec)}, ${S}); if (e) e.scrollIntoView({block: 'center', inline: 'center'}); })()`,
        );
      },

      // --- real input
      async key(name, ...modifiers) {
        const m = modifiers.reduce((a, k) => a | MOD[k], 0);
        const def = KEYS[name];
        const printable = !def && name.length === 1;
        const [vk, code, text] = def ?? [
          name.toUpperCase().charCodeAt(0),
          /[a-z]/i.test(name) ? `Key${name.toUpperCase()}` : `Digit${name}`,
          name.length === 1 ? name : undefined,
        ];
        const common = {
          modifiers: m,
          key: name === 'Space' ? ' ' : name,
          code,
          windowsVirtualKeyCode: vk,
          nativeVirtualKeyCode: vk,
        };
        const withText = (printable || text) && !(m & ~8);
        await cdp('Input.dispatchKeyEvent', {
          type: withText ? 'keyDown' : 'rawKeyDown',
          ...common,
          ...(withText ? {text: text ?? name, unmodifiedText: text ?? name} : {}),
        });
        await sleep(40); // a held key: Radix reads "arrow key is down" in a timeout after keydown, so keyup must not be instant
        await cdp('Input.dispatchKeyEvent', {type: 'keyUp', ...common});
        await api.settle();
      },
      /** Several keys in a row: p.keys('ArrowDown', 'Enter'). */
      async keys(...names) {
        for (const n of names) await api.key(n);
      },
      async type(str) {
        for (const ch of str) await api.key(ch === ' ' ? ' ' : ch);
      },
      async tab(n = 1, back = false) {
        for (let i = 0; i < n; i++) await (back ? api.key('Tab', 'shift') : api.key('Tab'));
      },
      async mouse(type, x, y, button = 'left', held = false) {
        await cdp('Input.dispatchMouseEvent', {
          type,
          x,
          y,
          button: type === 'mouseMoved' && !held ? 'none' : button,
          buttons: type === 'mousePressed' || held ? (button === 'right' ? 2 : 1) : 0,
          clickCount: type === 'mouseMoved' ? 0 : 1,
        });
      },
      /** Press at (x, y), move through `to` points with the button held, release at the last one. */
      async drag(x, y, to) {
        await api.mouse('mouseMoved', x, y);
        await api.mouse('mousePressed', x, y);
        for (const [tx, ty] of to) {
          await api.mouse('mouseMoved', tx, ty, 'left', true);
          await sleep(20);
        }
        const [lx, ly] = to.at(-1)!;
        await api.mouse('mouseReleased', lx, ly);
        await sleep(80);
      },
      async point(spec) {
        await api.scrollTo(spec);
        const r = await api.rect(spec);
        if (!r) throw new Error(`nothing to point at: "${spec}"`);
        return {x: r.x + r.w / 2, y: r.y + r.h / 2};
      },
      async click(spec, button = 'left') {
        const {x, y} = await api.point(spec);
        await api.mouse('mouseMoved', x, y);
        await api.mouse('mousePressed', x, y, button);
        await api.mouse('mouseReleased', x, y, button);
        await api.settle();
        await sleep(40);
      },
      async clickAt(x, y) {
        await api.mouse('mouseMoved', x, y);
        await api.mouse('mousePressed', x, y);
        await api.mouse('mouseReleased', x, y);
        await sleep(60);
      },
      async hover(spec) {
        const {x, y} = await api.point(spec);
        await api.mouse('mouseMoved', x, y);
        await sleep(60);
      },
      async wheel(spec, deltaY, deltaX = 0) {
        const {x, y} = await api.point(spec);
        await cdp('Input.dispatchMouseEvent', {type: 'mouseWheel', x, y, deltaX, deltaY});
        await sleep(120);
      },
    };
    // remember the last call so a timeout can say where it was stuck
    const fns = api as unknown as Record<string, unknown>;
    for (const k of Object.keys(api))
      if (typeof fns[k] === 'function' && k !== 'sleep') {
        const f = fns[k] as (...a: unknown[]) => unknown;
        fns[k] = (...a: unknown[]) => {
          lastCall = `${k}(${a
            .map((x) => JSON.stringify(x))
            .join(', ')
            .slice(0, 120)})`;
          return f(...a);
        };
      }
    return api;
  };
  const root = make(null) as Page;
  root.begin = () => {
    aborted = false;
    lastCall = '';
  };
  root.abort = () => {
    aborted = true;
  };
  root.lastCall = () => lastCall;
  return root;
}
