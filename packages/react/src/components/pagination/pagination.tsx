'use client';
import {forwardRef, type HTMLAttributes} from 'react';
import {useControllableState} from '../../hooks/use-controllable-state';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page, 1-based, when controlled. Pair with `onPageChange`. */
  page?: number;
  /** The starting page when uncontrolled. Default 1. */
  defaultPage?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the new 1-based page number when the user picks a page or presses Prev or Next. */
  onPageChange?: (page: number) => void;
  /** How many numbers to show on each side of the current page. */
  siblings?: number;
}

/** Page numbers with the first and last always visible and "…" for gaps. Pure function exported for testing. */
export function pageWindow(page: number, count: number, siblings = 1): Array<number | 'gap'> {
  const out: Array<number | 'gap'> = [];
  const left = Math.max(2, page - siblings), right = Math.min(count - 1, page + siblings);
  out.push(1);
  if (left > 2) out.push('gap');
  for (let p = left; p <= right; p++) out.push(p);
  if (right < count - 1) out.push('gap');
  if (count > 1) out.push(count);
  return out;
}

/** Previous, numbered pages and next, as buttons. The current page has aria-current. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination({page: pageProp, defaultPage = 1, pageCount, onPageChange, siblings = 1, ...rest}, ref) {
  const count = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const [page, setPage] = useControllableState({value: pageProp, defaultValue: defaultPage, onChange: onPageChange});
  // Only a real change is reported: pressing the current page again does nothing.
  const go = (p: number) => setPage(Math.min(count, Math.max(1, p)));
  return (
    <nav ref={ref} aria-label="Pagination" {...rest}>
      <div className="pager">
        <button type="button" disabled={page <= 1} onClick={() => go(page - 1)}>Prev</button>
        {pageWindow(page, count, siblings).map((p, i) =>
          p === 'gap' ? <span key={`g${i}`} className="muted" aria-hidden="true">…</span> : (
            <button key={p} type="button" aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => go(p)}>{p}</button>
          ))}
        <button type="button" disabled={page >= count} onClick={() => go(page + 1)}>Next</button>
      </div>
    </nav>
  );
});
