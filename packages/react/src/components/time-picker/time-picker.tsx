'use client';
import {forwardRef, useState, type InputHTMLAttributes} from 'react';
import {cx} from '../../utils/cx';
import {invalidAttrs, useFieldControl} from '../field';

export interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'size'> {
  /** 24-hour "HH:mm" (or "HH:mm:ss" when `step` is under 60), or '' for no time. */
  value?: string | undefined;
  /** The initial time as 24-hour "HH:mm" when uncontrolled. Default empty. */
  defaultValue?: string | undefined;
  /** Called with the new time as 24-hour "HH:mm" (or '' when cleared). */
  onValueChange?: ((value: string) => void) | undefined;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Marks the control invalid (`aria-invalid`). A surrounding Field sets this from its `error`. */
  invalid?: boolean | undefined;
}

/**
 * A time field built on the native `<input type="time">`: the browser supplies the hour,
 * minute and AM/PM segments (spinbuttons), the picker and the keyboard handling. Whether
 * AM/PM is shown follows the user's locale, as the platform decides. The value is always 24-hour.
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker({value, defaultValue = '', onValueChange, size = 'md', invalid, disabled, className, ...rest}, ref) {
  const f = useFieldControl(rest);
  const [inner, setInner] = useState(defaultValue);
  return (
    <input
      ref={ref}
      type="time"
      className={cx('input time-picker', size !== 'md' && `input-${size}`, className)}
      disabled={disabled}
      data-disabled={disabled ? '' : undefined}
     
      {...invalidAttrs(invalid)}
      value={value ?? inner}
      onChange={(e) => { if (value === undefined) setInner(e.target.value); onValueChange?.(e.target.value); }}
      {...rest} {...f}
    />
  );
});
