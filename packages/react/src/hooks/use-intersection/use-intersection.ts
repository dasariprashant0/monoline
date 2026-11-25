'use client';
import {useCallback, useEffect, useRef, useState, type RefCallback} from 'react';

export interface UseIntersectionOptions extends IntersectionObserverInit {
  /** Stop observing after the first time it is visible. */
  once?: boolean | undefined;
}

/** Returns `[ref, entry]`; `entry?.isIntersecting` says if it is in view. */
export function useIntersection<T extends Element = Element>({once, root, rootMargin, threshold}: UseIntersectionOptions = {}): [RefCallback<T>, IntersectionObserverEntry | null] {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  // An inline `threshold: [0, .5]` is a new array every render. Key it by value, so the observer is only rebuilt when it really changes.
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold);
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const ref = useCallback<RefCallback<T>>((el) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    observer.current = new IntersectionObserver(([e]) => {
      if (!e) return;
      setEntry(e);
      if (once && e.isIntersecting) observer.current?.disconnect();
    }, {root: root ?? null, rootMargin: rootMargin ?? '0px', threshold: thresholdRef.current ?? 0});
    observer.current.observe(el);
  }, [once, root, rootMargin, thresholdKey]);
  useEffect(() => () => observer.current?.disconnect(), []);
  return [ref, entry];
}
