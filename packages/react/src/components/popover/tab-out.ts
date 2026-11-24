import {TABBABLE} from '../../utils/overlay';

/** Would this Tab press leave the panel? Roving lists (menu, listbox: any panel that is not a dialog) always; dialog panels from their last control (first, with Shift). Pass it to `useDismiss` as its fourth argument. */
export const leavesPanel = (panel: Element | null | undefined, back: boolean) => {
  const a = document.activeElement, t = [...(panel?.querySelectorAll<HTMLElement>(TABBABLE) ?? [])].filter((e) => e.tabIndex >= 0);
  return !!panel?.contains(a) && (panel.getAttribute('role') !== 'dialog' || !t.length || (back ? a === panel || a === t[0] : a === t[t.length - 1]));
};
