'use client';
import {forwardRef, useRef, useState, type ChangeEvent, type ClipboardEvent, type HTMLAttributes, type KeyboardEvent} from 'react';
import {cx} from '../../utils/cx';
import {useIsRtl} from '../../utils/direction';

export interface OtpInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  /** Names the group, for example "Verification code". */
  'aria-label': string;
  /** Number of boxes, which is the length of the code. Default 6. */
  length?: number;
  /** The code typed so far when controlled. Pair with `onValueChange`. */
  value?: string;
  /** The code typed at first when uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called with the whole code (so far) every time a character is added or removed. */
  onValueChange?: (value: string) => void;
  /** Called once when every box is filled. */
  onComplete?: (value: string) => void;
  /** Allow letters as well as digits. */
  alphanumeric?: boolean;
  /** Disables every box. */
  disabled?: boolean;
  /** Form field name. A hidden input submits the whole code. */
  name?: string;
  /** Marks the boxes as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean;
}

/** A row of single-character boxes. Controlled with `value` + `onValueChange`, or uncontrolled. */
export const OtpInput = forwardRef<HTMLDivElement, OtpInputProps>(function OtpInput({length = 6, value, defaultValue = '', onValueChange, onComplete, alphanumeric, disabled, invalid, name, className, ...rest}, ref) {
  const [inner, setInner] = useState(defaultValue.slice(0, length));
  const isRtl = useIsRtl();
  const current = (value ?? inner).slice(0, length);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  const ok = (c: string) => (alphanumeric ? /^[a-z0-9]$/i.test(c) : /^\d$/.test(c));
  const commit = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
    if (next.length === length) onComplete?.(next);
  };
  const focus = (i: number) => boxes.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (current[i]) commit(current.slice(0, i) + current.slice(i + 1));
      else if (i > 0) { commit(current.slice(0, i - 1) + current.slice(i)); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(isRtl(e.currentTarget) ? i + 1 : i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(isRtl(e.currentTarget) ? i - 1 : i + 1); }
    else if (e.key?.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!ok(e.key)) return;
      put(i, e.key);
    }
  };
  // Characters always land at the first empty box at most, so the value never has gaps.
  const put = (i: number, text: string) => {
    const at = Math.min(i, current.length);
    commit((current.slice(0, at) + text + (text.length === 1 ? current.slice(at + 1) : '')).slice(0, length));
    focus(at + text.length);
  };
  // Soft keyboards report key "Unidentified" and one-time-code autofill sends no keys at all: both arrive here.
  const onInput = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (current[i] && v.startsWith(current[i]!)) v = v.slice(1);
    if (v === '' ) { if (current[i]) commit(current.slice(0, i) + current.slice(i + 1)); return; }
    const text = [...v].filter(ok).join('');
    if (text) put(i, text);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = [...e.clipboardData.getData('text')].filter(ok).join('').slice(0, length);
    if (!text) return;
    commit(text);
    focus(text.length);
  };
  return (
    <div ref={ref} role="group" className={cx('otp', className)} {...rest}>
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
      {Array.from({length}, (_, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el; }}
          className="input otp-box"
          inputMode={alphanumeric ? 'text' : 'numeric'}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={current[i] ?? ''}
          disabled={disabled}
          {...(invalid ? {'aria-invalid': true as const, 'data-invalid': ''} : {})}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={onInput(i)}
          onKeyDown={onKey(i)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  );
});
