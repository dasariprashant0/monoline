import {useRef, useSyncExternalStore} from 'react';
import {useIsoLayoutEffect} from './use-iso-layout-effect';

const noop = () => () => {};
/** `hidden="until-found"` is Chromium (and recent Safari) only, not Baseline: feature-detected, false on the server and while hydrating. */
const supported = () => typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

/** Find-in-page for closed Collapsible and Accordion panels. Where the browser supports `hidden="until-found"` the closed
 *  panel stays in the DOM with that attribute, so Ctrl+F finds its text; the browser then fires `beforematch` and the
 *  panel is opened through its own trigger (found through `aria-labelledby`, or as the Collapsible's own trigger). Elsewhere `forceMount` stays unset and Radix
 *  unmounts the closed panel as before. Spread `forceMount` into the Radix content and attach `ref` to it.
 *
 *  Where this is supported a closed panel is always mounted (only hidden), so its children run effects on mount and any inputs inside stay in the form and are submitted; closing does not unmount them.
 *  If the browser reveals a panel but the trigger click is refused (disabled item, a controlled parent that keeps it closed), the panel is hidden again so the DOM follows `data-state`. */
export function useUntilFound() {
  const on = useSyncExternalStore(noop, supported, () => false);
  const ref = useRef<HTMLDivElement | null>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const sync = () => { if (el.dataset.state === 'open') el.hidden = false; else el.setAttribute('hidden', 'until-found'); };
    // Accordion panels name their trigger (aria-labelledby); a Collapsible trigger only carries aria-controls while open, so
    // take the first expandable control in the panel's parent that is not inside the panel
    const found = () => {
      (document.getElementById(el.getAttribute('aria-labelledby') ?? '') ?? [...(el.parentElement?.querySelectorAll<HTMLElement>('[aria-expanded]') ?? [])].find((t) => !el.contains(t)))?.click();
      // The browser removes `hidden` itself once this event has been handled. If the click was refused (disabled item, a controlled parent that keeps it closed)
      // `data-state` never changes, so the observer below stays silent and the panel would stay visible while the trigger says closed: re-sync after the reveal.
      requestAnimationFrame(sync);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, {attributes: true, attributeFilter: ['data-state']});
    el.addEventListener('beforematch', found);
    return () => { mo.disconnect(); el.removeEventListener('beforematch', found); };
  }, [on]);
  return {ref, forceMount: on ? true as const : undefined};
}
