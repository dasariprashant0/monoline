const QUERY = '(prefers-reduced-motion: reduce)';

/** For event-time checks (Confetti). In render, use the `useReducedMotion` hook. True when the user asked for less motion. Guarded: jsdom and old browsers have no matchMedia. Safe to call at event time. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(QUERY)?.matches;
}
