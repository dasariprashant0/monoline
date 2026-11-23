'use client';
import {useEffect, useRef} from 'react';

/**
 * `useWindowEvent('resize', () => ...)`. The latest handler is used without re-subscribing.
 *
 * @param type A `window` event name, for example `resize`.
 * @param listener Handler for the event. The latest version is used.
 * @param options Passed to `addEventListener`.
 */
export function useWindowEvent<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void {
  const fn = useRef(listener);
  useEffect(() => { fn.current = listener; });
  // An inline `{passive: true}` is a new object every render: re-subscribe only when its flags change.
  const opts = useRef(options);
  opts.current = options;
  const flags = typeof options === 'object' ? `${options.capture}|${options.passive}|${options.once}` : String(options);
  useEffect(() => {
    const on = (e: WindowEventMap[K]) => fn.current(e);
    window.addEventListener(type, on, opts.current);
    return () => window.removeEventListener(type, on, opts.current);
  }, [type, flags]);
}
