'use client';
import {forwardRef, useImperativeHandle, useRef, type InputHTMLAttributes} from 'react';
import {cx} from '../../utils/cx';
import {invalidAttrs, useFieldControl, fieldOwn} from '../field';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Accessible names of the step buttons, for other languages. Defaults "Decrease" and "Increase". */
  labels?: {decrease?: string; increase?: string};
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the control invalid (`aria-invalid`). A surrounding Field sets this from its `error`. */
  invalid?: boolean;
}

/** Native number input with step buttons. Use `min`, `max`, `step` like on any input. Works controlled or not. */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput({size = 'md', labels, invalid, className, disabled, readOnly, ...rest}, ref) {
  const f = useFieldControl();
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current!);
  const bump = (dir: 1 | -1) => {
    const el = inner.current;
    if (!el) return;
    try {
      if (dir === 1) el.stepUp(); else el.stepDown();
    } catch {
      // `step="any"` has no step to take (stepUp throws): add or subtract 1, within min and max.
      const start = Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : 0;
      const lo = el.min === '' ? -Infinity : Number(el.min), hi = el.max === '' ? Infinity : Number(el.max);
      const next = String(Math.min(hi, Math.max(lo, start + dir)));
      // The native setter, so React sees the change when the input event fires.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, next);
    }
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.focus();
  };
  const off = disabled || readOnly;
  return (
    <div className="number-input">
      <button type="button" className="number-step" aria-label={labels?.decrease ?? 'Decrease'} tabIndex={-1} disabled={off} onClick={() => bump(-1)}>−</button>
      <input ref={inner} type="number" className={cx('input number-field', size !== 'md' && `input-${size}`, className)} disabled={disabled} readOnly={readOnly} data-disabled={disabled ? '' : undefined} {...f} {...invalidAttrs(invalid)} {...rest} {...fieldOwn(f, rest)} />
      <button type="button" className="number-step" aria-label={labels?.increase ?? 'Increase'} tabIndex={-1} disabled={off} onClick={() => bump(1)}>+</button>
    </div>
  );
});
