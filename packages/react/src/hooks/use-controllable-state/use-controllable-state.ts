'use client';
import {useCallback, useRef, useState} from 'react';

export interface UseControllableStateOptions<T> {
  /** When defined, the hook is controlled and `value` wins. */
  value?: T | undefined;
  /** Starting value when uncontrolled. */
  defaultValue: T;
  /** Called with the new value when it differs from the current one. */
  onChange?: ((value: T) => void) | undefined;
}

/**
 * The `value` / `defaultValue` / `onValueChange` pattern for custom components.
 * Pass `value` to control it from outside; leave it out and the hook keeps its own state.
 * Monoline components use this so every controlled/uncontrolled pair behaves the same.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  // The setter reads the latest value and callback from refs, so it keeps one identity, never acts on a stale render,
  // and two calls in one event handler (`set(1); set(0)`) each compare against what the first one committed.
  const latest = useRef({current, isControlled, onChange});
  latest.current = {current, isControlled, onChange};

  const setValue = useCallback((next: T) => {
    const {current: now, isControlled: controlled, onChange: notify} = latest.current;
    if (Object.is(next, now)) return;
    if (!controlled) { latest.current = {...latest.current, current: next}; setInternal(next); }
    notify?.(next);
  }, []);

  return [current, setValue];
}
