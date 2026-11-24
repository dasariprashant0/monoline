'use client';
import {forwardRef, useEffect, useRef, type ComponentPropsWithoutRef, type ElementRef} from 'react';
import {NavigationMenu as Radix} from 'radix-ui';
import {cx} from '../../utils/cx';
import {TABBABLE, setRefs} from '../../utils/overlay';

/** Props of NavigationMenu: `value`, `defaultValue`, `onValueChange`, `orientation`, delays. */
export type NavigationMenuProps = ComponentPropsWithoutRef<typeof Radix.Root>;

/** A site navigation bar whose items can open rich panels of links. Put a `NavigationMenuList` inside; the panels share one viewport. */
export const NavigationMenu = forwardRef<ElementRef<typeof Radix.Root>, ComponentPropsWithoutRef<typeof Radix.Root>>(function NavigationMenu({className, children, ...rest}, ref) {
  const root = useRef<HTMLElement | null>(null);
  // Radix puts an aria-hidden <span tabindex="0"> focus proxy next to an open trigger to carry Tab into the portaled panel. A focusable element
  // must not be aria-hidden (WCAG 4.1.2), so take the proxies out of the tab order and do the Tab hand-over here: Tab from an open trigger goes to
  // the first link in its panel, Shift+Tab from that first link goes back to the trigger.
  useEffect(() => {
    const el = root.current; if (!el) return;
    const fix = () => el.querySelectorAll('span[aria-hidden="true"][tabindex="0"]').forEach((n) => n.setAttribute('tabindex', '-1'));
    fix();
    const mo = new MutationObserver(fix); mo.observe(el, {subtree: true, childList: true, attributes: true, attributeFilter: ['tabindex']});
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
      const a = document.activeElement as HTMLElement | null, panel = el.querySelector<HTMLElement>('.navmenu-content[data-state=open]');
      if (!a || !panel) return;
      const links = [...panel.querySelectorAll<HTMLElement>(TABBABLE)];
      if (!e.shiftKey && a.matches('.navmenu-trigger[aria-expanded=true]') && links[0]) { e.preventDefault(); links[0].focus(); }
      else if (e.shiftKey && a === links[0]) { e.preventDefault(); el.querySelector<HTMLElement>('.navmenu-trigger[aria-expanded=true]')?.focus(); }
    };
    el.addEventListener('keydown', key, true);
    return () => { mo.disconnect(); el.removeEventListener('keydown', key, true); };
  }, []);
  return (
    <Radix.Root ref={(n) => setRefs(n, root, ref)} className={cx('navmenu', className)} {...rest}>
      {children}
      <div className="navmenu-viewport-wrap"><Radix.Viewport className="navmenu-viewport" /></div>
    </Radix.Root>
  );
});
/** The row that holds the `NavigationMenuItem`s. */
export const NavigationMenuList = forwardRef<ElementRef<typeof Radix.List>, ComponentPropsWithoutRef<typeof Radix.List>>(function NavigationMenuList({className, ...rest}, ref) {
  return <Radix.List ref={ref} className={cx('navmenu-list', className)} {...rest} />;
});
/** One entry in the list: either a `NavigationMenuLink`, or a `NavigationMenuTrigger` with its `NavigationMenuContent`. */
export const NavigationMenuItem = Radix.Item;
/** The button that opens its item's panel; shows a small arrow. */
export const NavigationMenuTrigger = forwardRef<ElementRef<typeof Radix.Trigger>, ComponentPropsWithoutRef<typeof Radix.Trigger>>(function NavigationMenuTrigger({className, children, ...rest}, ref) {
  return <Radix.Trigger ref={ref} className={cx('navmenu-link navmenu-trigger', className)} {...rest}>{children}<span aria-hidden="true"> ▾</span></Radix.Trigger>;
});
/** The panel of links shown under the trigger when it is open. */
export const NavigationMenuContent = forwardRef<ElementRef<typeof Radix.Content>, ComponentPropsWithoutRef<typeof Radix.Content>>(function NavigationMenuContent({className, ...rest}, ref) {
  return <Radix.Content ref={ref} className={cx('navmenu-content', className)} {...rest} />;
});
/** A link in the bar or inside a panel; use `asChild` for a router link and `active` to mark the current page. */
export const NavigationMenuLink = forwardRef<ElementRef<typeof Radix.Link>, ComponentPropsWithoutRef<typeof Radix.Link>>(function NavigationMenuLink({className, ...rest}, ref) {
  return <Radix.Link ref={ref} className={cx('navmenu-link', className)} {...rest} />;
});
