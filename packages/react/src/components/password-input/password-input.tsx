'use client';
import {forwardRef, useState} from 'react';
import {Input, type InputProps} from '../input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Button text, for other languages. Defaults "Show", "Hide" and "password" (the last is read by screen readers only). */
  labels?: {show?: string | undefined; hide?: string | undefined; password?: string | undefined} | undefined;
}

/** An Input that can reveal its text. Set `autoComplete="current-password"` or `"new-password"`. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({labels, ...props}, ref) {
  const [shown, setShown] = useState(false);
  return (
    <div className="input-wrap">
      <Input ref={ref} type={shown ? 'text' : 'password'} {...props} />
      <button type="button" className="input-end" aria-pressed={shown} disabled={props.disabled} onClick={() => setShown((s) => !s)}>
        {shown ? labels?.hide ?? 'Hide' : labels?.show ?? 'Show'}<span className="sr-only"> {labels?.password ?? 'password'}</span>
      </button>
    </div>
  );
});
