// Route-level code splitting that also works for the prerender. A loader returns one cached promise that carries its
// own `status` and `value`, so React's `use()` reads it synchronously once it has resolved. The prerender awaits
// every loader first (entry-server.tsx); the browser awaits the current route's loader before it hydrates (main.tsx).
// Typed as a plain Promise: the status fields are set below and read by React, not by our code.
export type Tracked<T> = Promise<T>;
type Fields<T> = {status?: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown};

export function track<T>(p: Promise<T>): Tracked<T> {
  const t = p as Promise<T> & Fields<T>;
  t.status = 'pending';
  p.then((v) => { t.status = 'fulfilled'; t.value = v; }, (e) => { t.status = 'rejected'; t.reason = e; });
  return p;
}

/** A loader that runs `load` once and hands back the same tracked promise every time. */
export function loader<T>(load: () => Promise<T>): () => Tracked<T> {
  let t: Tracked<T> | undefined;
  return () => (t ??= track(load()));
}
