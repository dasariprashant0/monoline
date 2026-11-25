'use client';
import {useCallback, useEffect, useRef} from 'react';

/**
 * `const {start, clear} = useTimeout(fn, 500)`. Calling `start` again restarts it. Cleared on unmount. The latest `fn` always runs.
 *
 * @param callback Runs when the timer fires. The latest version is used.
 * @param delay Milliseconds to wait.
 * @returns `start` (re)starts the timer and `clear` cancels it.
 */
export function useTimeout(callback: () => void, delay: number) {
  const fn = useRef(callback);
  const id = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    fn.current = callback;
  });
  const clear = useCallback(() => {
    clearTimeout(id.current);
    id.current = undefined;
  }, []);
  const start = useCallback(() => {
    clear();
    id.current = setTimeout(() => fn.current(), delay);
  }, [clear, delay]);
  useEffect(() => clear, [clear]);
  return {start, clear};
}
