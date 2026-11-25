import {useEffect, type RefObject} from 'react';

/** Page-shell demos (app shell, hero, login, ...) bring their own h1 and navs (and AppShell drops its own main when it sits inside another). Inside a docs page the h1s would be extra top-level headings and the navs unnamed duplicates, so they become headings of `level` (default 4: an example title is an h3) and named navs. */
export function useDemoLandmarks(ref: RefObject<HTMLElement | null>, level = 4, name = 'Example') {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fix = () => {
      root.querySelectorAll('h1, h2, h3').forEach((h) => {
        if (h.getAttribute('aria-level') !== String(level)) h.setAttribute('aria-level', String(level));
      });
      // Landmark names must be unique on the page: an example nav or region that repeats another landmark's name (a Navbar demo's "Main" next to the docs header's "Main"), or has none, is prefixed with the example's name.
      root.querySelectorAll('nav, [role="navigation"], [role="region"][aria-label]').forEach((n, i) => {
        if (n.hasAttribute('data-demo-nav')) return;
        const own = n.getAttribute('aria-label');
        const taken =
          own &&
          [
            ...document.querySelectorAll(
              'nav[aria-label], [role="navigation"][aria-label], [role="region"][aria-label]',
            ),
          ].some((o) => o !== n && o.getAttribute('aria-label') === own);
        if (own && !taken) return;
        n.setAttribute('aria-label', `${name}: ${own ?? 'navigation'}${i ? ` ${i + 1}` : ''}`);
        n.setAttribute('data-demo-nav', '');
      });
    };
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(root, {childList: true, subtree: true});
    return () => mo.disconnect();
  }, [ref, level, name]);
}
