'use client';
import {forwardRef, type ComponentPropsWithoutRef, type ElementRef} from 'react';
import {Collapsible as Radix} from 'radix-ui';
import {cx} from '../../utils/cx';
import {setRefs} from '../../utils/overlay';
import {useUntilFound} from '../../utils/until-found';

/** Props of Collapsible: `open`, `defaultOpen`, `onOpenChange`, `disabled`. */
export type CollapsibleProps = ComponentPropsWithoutRef<typeof Radix.Root>;

/** A single open-and-close region. Holds the open state (`open`, `defaultOpen`, `onOpenChange`); put a `CollapsibleTrigger` and `CollapsibleContent` inside. */
export const Collapsible = Radix.Root;
/** The button that toggles the region; use `asChild` to render your own element. */
export const CollapsibleTrigger = Radix.Trigger;

/** The region that is shown or hidden. Closed content is found by the browser's Find in page where `hidden="until-found"` is supported. */
export const CollapsibleContent = forwardRef<
  ElementRef<typeof Radix.Content>,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(function CollapsibleContent({className, ...rest}, ref) {
  const found = useUntilFound();
  return (
    <Radix.Content
      ref={(n) => setRefs(n, found.ref, ref)}
      forceMount={found.forceMount}
      className={cx('collapsible-content', className)}
      {...rest}
    />
  );
});
