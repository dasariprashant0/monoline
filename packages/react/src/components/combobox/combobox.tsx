'use client';
import {useEffect, forwardRef, useId, useRef, useState, type InputHTMLAttributes} from 'react';
import {cx} from '../../utils/cx';
import {invalidAttrs, useFieldControl, useFieldLabelId} from '../field';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'role' | 'size'> {
  /** The choices, each with a `value`, a `label` and an optional `disabled`. The user filters them by typing part of the label. */
  options: ComboboxOption[];
  /** The selected option's `value` when controlled; `''` means none. Pair with `onValueChange`. */
  value?: string;
  /** The initially selected option's `value` when uncontrolled. Default none. */
  defaultValue?: string;
  /** Called with the chosen option's value, or '' when cleared. */
  onValueChange?: (value: string) => void;
  /** Form field name. A hidden input submits the chosen option `value` (not its label); the visible text box is not submitted. */
  name?: string;
  /** Shown when nothing matches. */
  emptyText?: string;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the field as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean;
}

/** A searchable single select. The list opens on typing, ArrowDown/ArrowUp or a click, not on focus alone (WAI-ARIA editable combobox). Controlled with `value` + `onValueChange`, or uncontrolled with `defaultValue`. */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox({options, value, defaultValue = '', onValueChange, emptyText = 'No matches', size = 'md', invalid, disabled, name, className, onBlur, onClick, onKeyDown, ...rest}, ref) {
  const f = useFieldControl();
  const labelId = useFieldLabelId();
  const listId = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const [text, setText] = useState<string | null>(null); // null = show the selected label
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const query = (text ?? '').trim().toLowerCase();
  const shown = text === null ? options : options.filter((o) => o.label.toLowerCase().includes(query));
  const optId = (i: number) => `${listId}-${i}`;
  // Arrow keys move through a list taller than its popup: keep the active option in view.
  useEffect(() => { if (open) document.getElementById(optId(active))?.scrollIntoView?.({block: 'nearest'}); }, [open, active]);

  const pick = (o: ComboboxOption) => {
    if (o.disabled) return;
    if (value === undefined) setInner(o.value);
    onValueChange?.(o.value);
    setText(null); setOpen(false);
  };
  const move = (dir: 1 | -1) => {
    if (!shown.length) return;
    let i = active;
    for (let n = 0; n < shown.length; n++) { i = (i + dir + shown.length) % shown.length; if (!shown[i]!.disabled) break; }
    setActive(i);
  };
  const keydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); } else move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!open) setOpen(true); else move(-1); }
    else if (e.key === 'Enter' && open && shown[active]) { e.preventDefault(); pick(shown[active]!); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else if (text !== null) { setText(null); } }
    else if (e.key === 'Home' && open) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && open) { e.preventDefault(); setActive(Math.max(0, shown.length - 1)); }
  };

  return (
    <div ref={root} className={cx('combobox', className)}>
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
      <input
        ref={ref}
        type="text"
        role="combobox"
        autoComplete="off"
        className={cx('input', size !== 'md' && `input-${size}`)}
        disabled={disabled}
        data-disabled={disabled ? '' : undefined}
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? optId(active) : undefined}
        {...f}
        {...invalidAttrs(invalid)}
        value={text ?? selected?.label ?? ''}
        onChange={(e) => { setText(e.target.value); setActive(0); setOpen(true); if (!e.target.value && current !== '') { if (value === undefined) setInner(''); onValueChange?.(''); } }}
        onClick={(e) => { onClick?.(e); setOpen(true); }}
        onBlur={(e) => { onBlur?.(e); setOpen(false); setText(null); }}
        onKeyDown={keydown}
        {...rest}
      />
      {open && (
        <ul id={listId} role="listbox" className="combobox-list" aria-label={rest['aria-label']} aria-labelledby={rest['aria-label'] ? undefined : rest['aria-labelledby'] ?? labelId}>
          {shown.length === 0 && <li className="combobox-empty" role="presentation">{emptyText}</li>}
          {shown.map((o, i) => (
            <li
              key={o.value}
              id={optId(i)}
              role="option"
              aria-selected={o.value === current}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              className="combobox-option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
            >{o.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
});
