'use client';
import {useEffect, forwardRef, useId, useState, type InputHTMLAttributes} from 'react';
import {cx} from '../../utils/cx';
import {invalidAttrs, useFieldControl, useFieldLabelId} from '../field';

export interface AutocompleteProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'role' | 'size'> {
  /** Suggestions shown while typing; matched by substring, case-insensitive. */
  suggestions: string[];
  /** The text in the field. */
  value?: string;
  /** Initial text when the field is uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called with the text on every change, and with the suggestion when one is picked. */
  onValueChange?: (value: string) => void;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the field as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean;
}

/**
 * A text field with suggestions. Modelled on `Combobox`; differences: the value IS the text,
 * so anything typed is accepted, not only list items. No option is active until you press
 * ArrowDown, so Enter keeps your own text. The list only opens once there is something to
 * match, and has no empty state.
 */
export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(function Autocomplete({suggestions, value, defaultValue = '', onValueChange, size = 'md', invalid, disabled, className, onBlur, onKeyDown, ...rest}, ref) {
  const labelId = useFieldLabelId();
  const f = useFieldControl(rest);
  const listId = useId();
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const q = text.trim().toLowerCase();
  const shown = q ? suggestions.filter((s) => s.toLowerCase().includes(q) && s !== text) : [];
  const isOpen = open && shown.length > 0;
  const optId = (i: number) => `${listId}-${i}`;
  useEffect(() => { if (isOpen && active >= 0) document.getElementById(optId(active))?.scrollIntoView?.({block: 'nearest'}); }, [isOpen, active]);

  const set = (v: string) => { if (value === undefined) setInner(v); onValueChange?.(v); };
  const pick = (s: string) => { set(s); setOpen(false); setActive(-1); };

  return (
    <div className={cx('autocomplete', className)}>
      <input
        ref={ref}
        type="text"
        role="combobox"
        autoComplete="off"
        className={cx('input', size !== 'md' && `input-${size}`)}
        disabled={disabled}
        data-disabled={disabled ? '' : undefined}
        aria-expanded={isOpen}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && active >= 0 ? optId(active) : undefined}
       
        {...invalidAttrs(invalid)}
        value={text}
        onChange={(e) => { set(e.target.value); setActive(-1); setOpen(true); }}
        onBlur={(e) => { onBlur?.(e); setOpen(false); setActive(-1); }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); if (shown.length) setActive((active + 1) % shown.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); if (shown.length) setActive((active <= 0 ? shown.length : active) - 1); }
          else if (e.key === 'Enter' && !e.nativeEvent.isComposing && isOpen && shown[active]) { e.preventDefault(); pick(shown[active]!); }
          else if (e.key === 'Escape' && isOpen) { e.preventDefault(); setOpen(false); setActive(-1); }
        }}
        {...rest} {...f}
      />
      {isOpen && (
        <ul id={listId} role="listbox" className="autocomplete-list" aria-label={rest['aria-label']} aria-labelledby={rest['aria-label'] ? undefined : rest['aria-labelledby'] ?? labelId}>
          {shown.map((s, i) => (
            <li
              key={s}
              id={optId(i)}
              role="option"
              aria-selected={i === active}
              data-active={i === active || undefined}
              className="autocomplete-option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
            >{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
});
