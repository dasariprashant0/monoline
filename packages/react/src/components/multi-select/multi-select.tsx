'use client';
import {useEffect, forwardRef, useId, useState, type InputHTMLAttributes} from 'react';
import {cx} from '../../utils/cx';
import {nextEnabled} from '../../utils/overlay';
import {invalidAttrs, useFieldControl, useFieldLabelId, hiddenInputs} from '../field';
import {Tag} from '../tag';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface MultiSelectProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'role' | 'size'> {
  /** The choices, each with a `value`, a `label` and an optional `disabled`. The user filters them by typing part of the label. */
  options: MultiSelectOption[];
  /** The chosen option values when controlled. Pair with `onValueChange`. */
  value?: string[] | undefined;
  /** The initially chosen option values when uncontrolled. Default empty. */
  defaultValue?: string[] | undefined;
  /** Called with the full list of chosen values. */
  onValueChange?: ((value: string[]) => void) | undefined;
  /** Form field name. A hidden input submits one entry per chosen `value`; the visible text box is not submitted. */
  name?: string | undefined;
  /** Shown when nothing matches. */
  emptyText?: string | undefined;
  /** `md` (default), `sm` for dense layouts or `lg` for prominent forms. Heights match Button, Input and Select at each size. */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Marks the field as having an error: sets `aria-invalid` and shows the error border. */
  invalid?: boolean | undefined;
}

/**
 * A searchable multiple select. Modelled on `Combobox`; differences: the chosen values are
 * removable tags, the list stays open after a pick, Enter toggles the active option, and
 * Backspace in an empty field removes the last tag. The listbox has `aria-multiselectable`.
 */
export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  {
    options,
    value,
    defaultValue = [],
    onValueChange,
    emptyText = 'No matches',
    size = 'md',
    invalid,
    disabled,
    name,
    className,
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const labelId = useFieldLabelId();
  const f = useFieldControl(rest);
  const listId = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const query = text.trim().toLowerCase();
  const shown = options.filter((o) => o.label.toLowerCase().includes(query));
  const optId = (i: number) => `${listId}-${i}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the id helper only formats the stable listId; listing it would re-run on every render.
  useEffect(() => {
    if (open) document.getElementById(optId(active))?.scrollIntoView?.({block: 'nearest'});
  }, [open, active]);

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const toggle = (o: MultiSelectOption) => {
    if (o.disabled) return;
    commit(current.includes(o.value) ? current.filter((v) => v !== o.value) : [...current, o.value]);
    setText('');
  };
  const move = (dir: 1 | -1) => {
    if (shown.length) setActive(nextEnabled(shown, active, dir));
  };
  const keydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(-1);
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing && open && shown[active]) {
      e.preventDefault();
      toggle(shown[active]!);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Backspace' && !text && current.length) {
      commit(current.slice(0, -1));
    }
  };

  return (
    <div
      className={cx('multi-select', className)}
      data-size={size !== 'md' ? size : undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {hiddenInputs(name, current, disabled)}
      <div className="multi-select-box">
        {current.map((v) => {
          const label = options.find((o) => o.value === v)?.label ?? v;
          return (
            <Tag key={v} label={label} onRemove={disabled ? undefined : () => commit(current.filter((x) => x !== v))}>
              {label}
            </Tag>
          );
        })}
        <input
          ref={ref}
          type="text"
          role="combobox"
          autoComplete="off"
          className="multi-select-input"
          disabled={disabled}
          aria-expanded={open}
          data-state={open ? 'open' : 'closed'}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? optId(active) : undefined}
          {...invalidAttrs(invalid)}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            onFocus?.(e);
            setOpen(true);
          }}
          onClick={(e) => {
            onClick?.(e);
            setOpen(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            setOpen(false);
            setText('');
          }}
          onKeyDown={keydown}
          {...rest}
          {...f}
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="multi-select-list"
          aria-label={rest['aria-label']}
          aria-labelledby={rest['aria-label'] ? undefined : (rest['aria-labelledby'] ?? labelId)}
        >
          {shown.length === 0 && (
            <li className="multi-select-empty" role="presentation">
              {emptyText}
            </li>
          )}
          {shown.map((o, i) => (
            <li
              key={o.value}
              id={optId(i)}
              role="option"
              aria-selected={current.includes(o.value)}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              className="multi-select-option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => toggle(o)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
