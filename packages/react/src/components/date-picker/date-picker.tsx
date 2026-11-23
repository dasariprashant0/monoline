'use client';
import {forwardRef, useState} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '../popover';
import {Calendar, type CalendarProps} from '../calendar';
import {cx} from '../../utils/cx';
import {invalidAttrs, useFieldControl} from '../field';
import {useControllableState} from '../../hooks/use-controllable-state';

export interface DatePickerProps extends Omit<CalendarProps, 'className' | 'aria-label'> {
  /** Text shown on the button while no date is chosen. Default "Pick a date". */
  placeholder?: string;
  /** Intl options for the text on the button. Default: medium date. */
  format?: Intl.DateTimeFormatOptions;
  /** Controlled open state of the calendar popover. */
  open?: boolean;
  /** Whether the popover starts open. Default false. */
  defaultOpen?: boolean;
  /** Called with the next open state when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Stops the user opening the calendar. */
  disabled?: boolean;
  /** Form field name. A hidden input submits the date as `YYYY-MM-DD` (empty when none is chosen). */
  name?: string;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the field as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean;
  /** Extra class name for the trigger button. */
  className?: string;
  /** Names the control when it is not inside a Field. */
  'aria-label'?: string;
}

/** On open, move focus to the day that can be tabbed to (the chosen date, else today), not the month arrows, as in the ARIA date-picker pattern. */
const focusDay = (e: Event) => {
  const day = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[role="grid"] button[tabindex="0"]');
  if (day) { e.preventDefault(); day.focus(); }
};

/** Keeps the popover inside short viewports: it takes the side with more room and scrolls inside when even that is too small. */
const FIT = {maxHeight: 'var(--available-height)', overflowY: 'auto'} as const;

/**
 * Pick a date from a popover calendar. Same `value` / `defaultValue` / `onValueChange` as Calendar.
 * Add `clearable` to put a "Clear date" button in the popover; it calls `onValueChange(null)` and closes.
 * @example <DatePicker clearable value={date} onValueChange={setDate} aria-label="Due" />
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker({value, defaultValue = null, onValueChange, placeholder = 'Pick a date', format = {dateStyle: 'medium'}, locale, size = 'md', open: openProp, defaultOpen = false, onOpenChange, disabled, name, invalid, className, 'aria-label': label, ...cal}, ref) {
  const f = useFieldControl();
  const [inner, setInner] = useState<Date | null>(defaultValue);
  const [open, setOpen] = useControllableState({value: openProp, defaultValue: defaultOpen, onChange: onOpenChange});
  const current = value === undefined ? inner : value;
  const text = current ? new Intl.DateTimeFormat(locale, format).format(current) : '';
  const iso = current ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}` : '';
  return (
    <>
    {name && <input type="hidden" name={name} value={iso} disabled={disabled} />}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={ref} type="button" disabled={disabled} className={cx('input date-trigger', size !== 'md' && `input-${size}`, className)} {...f} aria-label={label ? `${label}: ${text || placeholder}` : undefined} {...invalidAttrs(invalid)} data-disabled={disabled ? '' : undefined} data-empty={!current || undefined}>
          {text || placeholder}
        </button>
      </PopoverTrigger>
              <PopoverContent className="date-popover" sideOffset={6} align="start" aria-label="Choose a date" onOpenAutoFocus={focusDay} collisionPadding={8} style={FIT}>
          <Calendar value={current} locale={locale} {...cal} onValueChange={(d) => { if (value === undefined) setInner(d); onValueChange?.(d); setOpen(false); }} />
        </PopoverContent>
          </Popover>
    </>
  );
});
