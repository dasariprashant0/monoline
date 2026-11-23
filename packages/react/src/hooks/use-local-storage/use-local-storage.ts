'use client';
import {useCallback, useEffect, useRef, useState} from 'react';

export type SetLocalStorageValue<T> = (next: T | ((prev: T) => T)) => void;

const LOCAL_EVENT = 'monoline:local-storage';

function parse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * A JSON value in `localStorage`, shaped like `useState`.
 * - Server and first client render use `initialValue`; the stored value loads after mount (no hydration mismatch).
 * - Changes in other tabs arrive through the `storage` event; other hooks on the same key in this tab through a window event.
 * - `set(prev => next)` reads the latest value, so two calls in one handler both apply.
 * - Storage can throw (private mode, quota, blocked): reads fall back to `initialValue`, writes still update state.
 *
 * @param key The `localStorage` key.
 * @param initialValue Used on the server, on first render and when nothing is stored.
 * @returns The value and a setter that accepts a value or an updater function.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetLocalStorageValue<T>] {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const latest = useRef(value);
  latest.current = value;
  const me = useRef({});

  // Load the stored value after mount.
  useEffect(() => {
    let next = initialRef.current;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) next = parse(raw, initialRef.current);
    } catch {
      // Storage unavailable: keep the initial value.
    }
    setValue(next);
  }, [key]);

  // Keep other tabs in sync. A null key means localStorage.clear() ran elsewhere.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key) return;
      if (event.key === null || event.newValue === null) {
        setValue(initialRef.current);
        return;
      }
      setValue(parse(event.newValue, initialRef.current));
    };
    // The `storage` event never fires in the tab that wrote: tell the other hooks on this key through our own event.
    const onLocal = (event: Event) => {
      const d = (event as CustomEvent<{key: string; raw: string; source: object}>).detail;
      if (d.key !== key || d.source === me.current) return;
      latest.current = parse(d.raw, initialRef.current);
      setValue(latest.current);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_EVENT, onLocal);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(LOCAL_EVENT, onLocal); };
  }, [key]);

  const set = useCallback<SetLocalStorageValue<T>>(
    (next) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(latest.current) : next;
      latest.current = resolved;
      setValue(resolved);
      let raw: string | undefined;
      try {
        raw = JSON.stringify(resolved);
        window.localStorage.setItem(key, raw);
      } catch {
        // Quota or blocked storage: the in-memory value still updates.
      }
      if (raw !== undefined) window.dispatchEvent(new CustomEvent(LOCAL_EVENT, {detail: {key, raw, source: me.current}}));
    },
    [key],
  );

  return [value, set];
}
