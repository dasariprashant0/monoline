'use client';
import {forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes, type RefObject} from 'react';
import {cx} from '../../utils/cx';

export interface TocItem {
  /** The id of the heading this entry points to. */
  id: string;
  /** Link text. */
  text: string;
  /** Heading level (2 for h2). Deeper levels are indented. Default 2. */
  level?: number;
}

export interface TocProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The entries, in page order. Use this or `container`. */
  items?: TocItem[];
  /** Build the entries from the headings (that have an id) inside this element; rescanned when it changes. Used when `items` is not set. */
  container?: RefObject<HTMLElement | null>;
  /** Heading levels to pick up from `container`. Default [2, 3]. */
  levels?: number[];
  /** Visible title above the list. Pass `null` to hide it. Default "On this page". */
  heading?: string | null;
  /** Name of the navigation landmark. Default is the heading, or "On this page". */
  'aria-label'?: string;
  /** Pixels from the top of the viewport where a heading becomes the current one; match your sticky header. Default 96. */
  offset?: number;
}

function scan(el: HTMLElement, levels: number[]): TocItem[] {
  // Skip headings inside a [data-no-toc] element that is within the container.
  const included = (h: Element) => { const skip = h.closest('[data-no-toc]'); return !skip || !el.contains(skip); };
  const sel = levels.map((l) => `h${l}[id]`).join(',');
  return [...el.querySelectorAll<HTMLElement>(sel)].filter(included).flatMap((h) => {
    const text = h.textContent?.replace(/\s+/g, ' ').trim();
    return text ? [{id: h.id, text, level: Number(h.tagName[1])}] : [];
  });
}

const sameItems = (a: TocItem[], b: TocItem[]) => a.length === b.length && a.every((x, i) => x.id === b[i]!.id && x.text === b[i]!.text && x.level === b[i]!.level);

/**
 * "On this page" navigation: links to the headings of the current page and marks the one being read with `aria-current="location"`; an accent bar follows the active link along a thin rule, with diagonal bends at level changes.
 * Entries come from `items`, or are read from the headings inside `container`. The current heading is tracked with an IntersectionObserver.
 * Links are plain anchors (the browser scrolls and sets the hash). Sticky positioning is plain CSS (`--toc-top`). @example <Toc container={mainRef} />
 */
export const Toc = forwardRef<HTMLElement, TocProps>(function Toc({items, container, levels = [2, 3], heading = 'On this page', 'aria-label': label, offset = 96, className, ...rest}, ref) {
  const [found, setFound] = useState<TocItem[]>([]);
  const levelKey = levels.join(',');
  useEffect(() => {
    const el = container?.current;
    if (items || !el) return;
    const ls = levelKey.split(',').map(Number);
    const update = () => setFound((p) => { const n = scan(el, ls); return sameItems(p, n) ? p : n; });
    update();
    // ponytail: rescans on every DOM mutation under container; debounce if a page animates its children.
    const mo = new MutationObserver(update);
    mo.observe(el, {childList: true, subtree: true, characterData: true});
    return () => mo.disconnect();
  }, [items, container, levelKey]);
  const list = items ?? found;

  const [active, setActive] = useState<string | null>(null);
  const ids = useMemo(() => list.map((i) => i.id).join('|'), [list]);
  const [vh, setVh] = useState(0);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => {
    if (!ids || !vh || typeof IntersectionObserver === 'undefined') return;
    const order = ids.split('|');
    // The current heading is the last one whose top has passed `offset`. A 1px band at that line wakes the observer each time a heading crosses it.
    const update = () => {
      let cur: string | null = null;
      for (const id of order) if ((document.getElementById(id)?.getBoundingClientRect().top ?? 1) - offset <= 0) cur = id;
      setActive(cur);
    };
    update();
    const io = new IntersectionObserver(update, {rootMargin: `-${offset}px 0px -${Math.max(0, vh - offset - 1)}px 0px`});
    order.forEach((id) => { const h = document.getElementById(id); if (h) io.observe(h); });
    // A jump (hash link, Home/End, restored scroll) can skip the band entirely; `scrollend` fires once when scrolling stops, so resync then.
    window.addEventListener('scrollend', update);
    return () => { io.disconnect(); window.removeEventListener('scrollend', update); };
  }, [ids, offset, vh]);

  const at = list.findIndex((i) => i.id === active);
  // The accent "thumb" sits on the active link's rule. It is a block masked by an SVG path that follows every rule and bend, measured from the layout.
  const body = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{w: number; h: number; path: string; top: number; len: number} | null>(null);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      const pts: Array<[number, number]> = [];
      let top = 0, len = 0, w = 1;
      el.querySelectorAll<HTMLElement>('.toc-rule').forEach((r) => {
        const q = r.getBoundingClientRect();
        const x = Math.round(q.left - b.left) + 0.5, y1 = q.top - b.top, y2 = q.bottom - b.top;
        pts.push([x, y1], [x, y2]);
        w = Math.max(w, x + 1);
        if (r.closest('a')?.hasAttribute('aria-current')) { top = y1; len = y2 - y1; }
      });
      const next = {w: Math.ceil(w), h: Math.ceil(el.scrollHeight), path: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '), top, len};
      setGeo((p) => (p && p.w === next.w && p.h === next.h && p.path === next.path && p.top === next.top && p.len === next.len ? p : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [list, active]);
  const mask = geo && geo.path ? `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geo.w} ${geo.h}"><path d="${geo.path}" stroke="black" stroke-width="1" fill="none"/></svg>`)}")` : undefined;

  if (!list.length) return null;
  return (
    <nav ref={ref} aria-label={label ?? heading ?? 'On this page'} className={cx('toc', className)} {...rest}>
      {heading && (
        <p className="toc-heading">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M15 18H3M17 6H3M21 12H3" /></svg>
          {heading}
        </p>
      )}
      <div className="toc-body" ref={body}>
        {geo && mask && (
          <div className="toc-thumb" aria-hidden="true" style={{width: geo.w, height: geo.h, maskImage: mask, WebkitMaskImage: mask}}>
            <div style={{marginTop: geo.top, height: geo.len}} />
          </div>
        )}
        <ul className="toc-list">
          {list.map((i, n) => {
            const level = i.level ?? 2;
            const prev = list[n - 1]?.level ?? level;
            const next = list[n + 1]?.level ?? level;
            return (
              <li key={i.id} data-level={level}>
                <a className="toc-link" href={`#${i.id}`} aria-current={n === at ? 'location' : undefined} data-bend-start={level !== prev || undefined} data-bend-end={level !== next || undefined}>
                  {level !== prev && (
                    <svg className="toc-bend" viewBox="0 0 10 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={level > prev ? 'M0 0L10 12' : 'M10 0L0 12'} vectorEffect="non-scaling-stroke" /></svg>
                  )}
                  <span className="toc-rule" aria-hidden="true" />
                  {i.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
});
