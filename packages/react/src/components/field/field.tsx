'use client';
import {createContext, forwardRef, useContext, useId, type HTMLAttributes, type ReactNode} from 'react';
import {cx} from '../../utils/cx';
import {Label} from '../label';

interface FieldContextValue {
  id: string;
  invalid: boolean;
  required: boolean;
  describedBy: string | undefined;
  labelId: string;
}
const FieldContext = createContext<FieldContextValue | null>(null);

/** Errors by control name, provided by `Form` so a `Field` with a matching `name` can read its message. Internal. */
export const FormErrorsContext = createContext<Record<string, ReactNode> | null>(null);

/**
 * Props a form control should spread to join its surrounding Field: id, aria-describedby, aria-invalid, required.
 * Spread them **after** the caller's own props and pass those props in: inside a Field the Field's `id` wins (the label points at it)
 * and the caller's `aria-describedby` is joined to the Field's hint and error ids. Outside a Field it returns an empty object, so controls work alone too.
 */
export function useFieldControl(own: {'aria-describedby'?: string} = {}): {id?: string; 'aria-describedby'?: string; 'aria-invalid'?: true; 'data-invalid'?: ''; required?: true} {
  const ctx = useContext(FieldContext);
  if (!ctx) return {};
  const f: {id?: string; 'aria-describedby'?: string; 'aria-invalid'?: true; 'data-invalid'?: ''; required?: true} = {id: ctx.id};
  const d = [ctx.describedBy, own['aria-describedby']].filter(Boolean).join(' ');
  if (d) f['aria-describedby'] = d;
  if (ctx.invalid) { f['aria-invalid'] = true; f['data-invalid'] = ''; }
  if (ctx.required) f.required = true;
  return f;
}

/** Hidden inputs that submit a custom control's value(s) with a native form: one per value, none without a `name`. */
export function hiddenInputs(name: string | undefined, values: string | string[], disabled?: boolean): ReactNode {
  return name && ([] as string[]).concat(values).map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />);
}

/** The id of the surrounding Field's label, or undefined outside a Field. For popups that need a name (`aria-labelledby`). */
export function useFieldLabelId(): string | undefined {
  return useContext(FieldContext)?.labelId;
}

/** Attributes for a control marked invalid with its own `invalid` prop: `aria-invalid` for assistive tech, `data-invalid` for styling. */
export function invalidAttrs(invalid?: boolean): {'aria-invalid'?: true; 'data-invalid'?: ''} {
  return invalid ? {'aria-invalid': true, 'data-invalid': ''} : {};
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The visible label of the control. Required so every control has a name. */
  label: ReactNode;
  /** Help text shown under the control. */
  hint?: ReactNode;
  /** Error message. Its presence marks the control invalid and it is announced politely. Inside a `Form` with `errors`, leave it out and set `name` instead. */
  error?: ReactNode;
  /** The `name` of the control. Inside a `Form` that has `errors`, the Field shows the message for this name, so you pass each error once. */
  name?: string;
  /** Marks the control as required: adds a required marker to the label and sets `required` on the control. Default false. */
  required?: boolean;
  /** The control: Input, Textarea, Select trigger, etc. */
  children: ReactNode;
}

/**
 * Wires a label, a control, a hint and an error together with the right ids and ARIA, so you never do it by hand.
 * A Field has no outer spacing: put several in a `Form` (or a `Stack`) to get the gap between them.
 * Inside a `Form` with an `errors` list, give the Field the control's `name` and it picks up its own message, so each error is passed once;
 * the form's summary announces it, so the inline text is not announced a second time.
 * @example <Field label="Email" hint="We never share it." error={err}><Input type="email" /></Field>
 * @example <Form errors={errors}><Field label="Email" name="email"><Input name="email" /></Field></Form>
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field({label, hint, error: errorProp, name, required = false, className, children, ...rest}, ref) {
  const base = useId();
  const formErrors = useContext(FormErrorsContext);
  const fromForm = errorProp === undefined && name !== undefined ? formErrors?.[name] : undefined;
  const error = errorProp ?? fromForm;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <FieldContext.Provider value={{id: `${base}-control`, invalid: Boolean(error), required, describedBy, labelId: `${base}-label`}}>
      <div ref={ref} className={cx('field', className)} {...rest}>
        <Label id={`${base}-label`} htmlFor={`${base}-control`} required={required}>{label}</Label>
        {children}
        {hint && <span id={hintId} className="field-hint">{hint}</span>}
        {error && <span id={errorId} className="field-error" role={fromForm ? undefined : 'alert'}>{error}</span>}
      </div>
    </FieldContext.Provider>
  );
});
