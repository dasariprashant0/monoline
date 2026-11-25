import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {Slot} from '../../utils/slot';
import {cx} from '../../utils/cx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default `solid`: the one main action per view. `line` for the rest, `ghost` for inline links, `danger` for destructive. */
  variant?: 'solid' | 'line' | 'ghost' | 'danger' | undefined;
  /** `md` (default), `sm` for dense toolbars and table rows, or `lg` for prominent calls to action. Same heights as Input and Select. */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Shows a spinner, sets `aria-busy` and ignores clicks. The label stays so the width does not jump. */
  loading?: boolean | undefined;
  /** Render the child element (a link, a router link) with the button styles instead of a `<button>`. With `disabled` the link gets `aria-disabled`, leaves the tab order and ignores clicks. */
  asChild?: boolean | undefined;
}

/**
 * A native `<button>` with Monoline styles. One `solid` button per view.
 * @example <Button variant="line" onClick={save}>Save</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    children,
    disabled,
    type,
    onClick,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  // A link (asChild) has no `disabled`: block it by hand, like `loading`.
  const blocked = loading || (asChild && !!disabled);
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cx('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, className)}
      disabled={asChild ? undefined : disabled}
      tabIndex={asChild && disabled ? -1 : undefined}
      aria-busy={loading || undefined}
      aria-disabled={blocked || undefined}
      data-loading={loading || undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={blocked ? (e: React.MouseEvent) => e.preventDefault() : onClick}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <span className="spinner" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  );
});
