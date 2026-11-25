import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  version,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {setRefs} from './overlay';

/** The child's ref: `props.ref` in React 19, `element.ref` before. In React 18 development builds an element that has a ref also has a `props.ref` warning getter that returns undefined, so `'ref' in props` is no test. */
const refOf = (el: ReactElement<{ref?: Ref<unknown> | undefined}>): Ref<unknown> | undefined =>
  Number(version.split('.')[0]) < 19 ? (el as unknown as {ref?: Ref<unknown> | undefined}).ref : el.props.ref;

/** `asChild` without the weight: renders its only child element with the Slot's props merged in. The child's props win,
 *  except `aria-*` and `data-state`, which describe the Slot's own widget and so come from the Slot. Event handlers of
 *  both run (the child's first; the Slot's is skipped when the child called `preventDefault()`); `className` joins;
 *  `style` merges; refs compose. */
type AnyProps = Record<string, unknown> & {style?: CSSProperties | undefined; className?: string | undefined};
export const Slot = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & {children?: ReactNode | undefined}>(
  function Slot({children, ...slot}, ref) {
    const valid = isValidElement(children);
    const childRef = valid ? refOf(children as ReactElement<{ref?: Ref<unknown> | undefined}>) : undefined;
    // One stable callback while the two refs stay the same, so the child's ref is not detached and re-attached on every render.
    const merged = useCallback(
      (n: HTMLElement | null) => setRefs(n, ref, childRef as Ref<HTMLElement> | undefined),
      [ref, childRef],
    );
    if (!valid) {
      if (children != null)
        console.warn('Monoline: `asChild` needs exactly one React element as its child; nothing was rendered.');
      return null;
    }
    const child = children as ReactElement<AnyProps>,
      own = child.props,
      from = slot as AnyProps;
    const props: AnyProps = {...from, ...own};
    for (const k in own) {
      const a = from[k],
        b = own[k];
      if (/^on[A-Z]/.test(k) && typeof a === 'function' && typeof b === 'function') {
        props[k] = (e: {defaultPrevented?: boolean | undefined}, ...x: unknown[]) => {
          (b as (...a: unknown[]) => void)(e, ...x);
          if (!e?.defaultPrevented) (a as (...a: unknown[]) => void)(e, ...x);
        };
      }
    }
    for (const k in from) if (k === 'data-state' || k.startsWith('aria-')) props[k] = from[k];
    if (from.style || own.style) props.style = {...from.style, ...own.style};
    if (from.className || own.className) props.className = [from.className, own.className].filter(Boolean).join(' ');
    props.ref = merged;
    return cloneElement(child, props);
  },
);
