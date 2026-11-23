'use client';
import {forwardRef, useEffect, useId, useState} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '../popover';
import {RangeCalendar, type RangeCalendarProps, type DateRange} from '../range-calendar';
import {cx} from '../../utils/cx';
import {useFieldControl} from '../field';
import {useControllableState} from '../../hooks/use-controllable-state';

export interface DateRangePickerProps extends Omit<RangeCalendarProps, 'className' | 'aria-label'> {
  /** Text shown on the button while no range is chosen. Default "Pick dates". */
  placeholder?: string;
  /** Intl options for the dates on the button. Default: medium date. */
  format?: Intl.DateTimeFormatOptions;
  /** Controlled open state of the calendar popover. */
  open?: boolean;
  /** Whether the popover starts open. Default false. */
  defaultOpen?: boolean;
  /** Called with the next open state when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Stops the user opening the calendar. */
  disabled?: boolean;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the field as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean;
  /** Form field name. Two hidden inputs submit `YYYY-MM-DD` dates as `<name>-start` and `<name>-end` (empty when not chosen). */
  name?: string;
  /** Extra class name for the trigger button. */
  className?: string;
  /** Names the control when it is not inside a Field. */
  'aria-label'?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toText = (d: Date | null) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '');
/** Parses YYYY-MM-DD strictly; returns null for anything that is not a real date. */
const parse = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  // `new Date(24, ...)` means 1924: set the year separately, and check the year survived.
  const d = new Date(2000, 0, 1);
  d.setFullYear(+m[1]!, +m[2]! - 1, +m[3]!);
  return d.getFullYear() === +m[1]! && d.getMonth() === +m[2]! - 1 && d.getDate() === +m[3]! ? d : null;
};

/** Pick a date range from a popover. It holds two typed fields (YYYY-MM-DD) and a range calendar that stay in sync. Value is `{start, end}`. Same `value` / `defaultValue` / `onValueChange` as RangeCalendar. */
export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(function DateRangePicker({value, defaultValue, onValueChange, placeholder = 'Pick dates', format = {dateStyle: 'medium'}, locale, size = 'md', open: openProp, defaultOpen = false, onOpenChange, disabled, name, invalid, className, 'aria-label': label, min, max, isDateDisabled, ...cal}, ref) {
  const f = useFieldControl();
  const errId = useId();
  const [inner, setInner] = useState<DateRange>(defaultValue ?? {start: null, end: null});
  const [open, setOpen] = useControllableState({value: openProp, defaultValue: defaultOpen, onChange: onOpenChange});
  const current = value ?? inner;
  const fmt = (d: Date) => new Intl.DateTimeFormat(locale, format).format(d);
  const text = current.start ? `${fmt(current.start)}${current.end ? ` – ${fmt(current.end)}` : ' –'}` : '';
  const [typed, setTyped] = useState({start: toText(current.start), end: toText(current.end)});
  useEffect(() => setTyped({start: toText(current.start), end: toText(current.end)}), [current.start, current.end]);
  const [bad, setBad] = useState<'start' | 'end' | null>(null);

  const commit = (r: DateRange) => { if (value === undefined) setInner(r); onValueChange?.(r); };
  const allowed = (d: Date) => !((min && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())) || (max && d > max) || isDateDisabled?.(d));
  const apply = (which: 'start' | 'end') => {
    const raw = typed[which];
    if (raw.trim() === '') { setBad(null); commit({...current, [which]: null}); return; }
    const d = parse(raw);
    if (!d || !allowed(d)) { setBad(which); return; }
    setBad(null);
    const next = {...current, [which]: d};
    commit(next.start && next.end && next.start > next.end ? {start: next.end, end: next.start} : next);
  };
  const field = (which: 'start' | 'end', name: string) => (
    <label className="date-range-field">
      <span>{name}</span>
      <input
        type="text"
        inputMode="numeric"
        className="input"
        placeholder="YYYY-MM-DD"
        autoComplete="off"
        value={typed[which]}
        aria-invalid={bad === which || undefined}
        aria-describedby={bad === which ? errId : undefined}
        onChange={(e) => setTyped({...typed, [which]: e.target.value})}
        onBlur={() => apply(which)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); apply(which); } }}
      />
    </label>
  );

  return (
    <>
    {name && <><input type="hidden" name={`${name}-start`} value={toText(current.start)} disabled={disabled} /><input type="hidden" name={`${name}-end`} value={toText(current.end)} disabled={disabled} /></>}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={ref} type="button" disabled={disabled} className={cx('input date-trigger', size !== 'md' && `input-${size}`, className)} {...f} aria-label={label ? `${label}: ${text || placeholder}` : undefined} aria-invalid={invalid || f['aria-invalid']} data-empty={!current.start || undefined}>
          {text || placeholder}
        </button>
      </PopoverTrigger>
              <PopoverContent className="date-popover date-range-popover" sideOffset={6} align="start" aria-label="Choose a date range">
          <div className="date-range-fields">
            {field('start', 'Start')}
            {field('end', 'End')}
          </div>
          <p id={errId} className="date-range-error" role="alert">{bad ? 'Enter a date as YYYY-MM-DD that can be picked.' : ''}</p>
          <RangeCalendar value={current} locale={locale} min={min} max={max} isDateDisabled={isDateDisabled} {...cal} onValueChange={(r) => { commit(r); setBad(null); if (r.start && r.end) setOpen(false); }} />
        </PopoverContent>
          </Popover>
    </>
  );
});
