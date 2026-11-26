// The one behaviour implementation. Each approach provides only its class names (a `Styles` object) through
// <StylesProvider>, so the four builds differ in styling alone. Markup, ARIA, keyboard and data-* are identical.
import {
  type ComponentPropsWithRef,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type Variant = 'solid' | 'outline' | 'ghost';
export type Size = 'sm' | 'md' | 'lg';
export type Tone = 'info' | 'ok' | 'warning' | 'danger' | 'neutral';
type AlertParts = {root: string; icon: string; body: string; title: string; description: string};

/** What an approach provides: class names per part, computed from the variant props where there are any. */
export type Styles = {
  button(p: {variant: Variant; size: Size}): string;
  spinner: string;
  alert(p: {tone: Tone}): AlertParts;
  tabs: string;
  tabsList: string;
  tabsTrigger: string;
  tabsContent: string;
  dialog: string;
  dialogTitle: string;
  dialogDescription: string;
  dialogClose: string;
};

const StylesCtx = createContext<Styles | null>(null);
export const StylesProvider = StylesCtx.Provider;
const useStyles = () => useContext(StylesCtx)!;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** value / defaultValue / onChange, the house pattern for controlled and uncontrolled props. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value === undefined ? inner : value;
  const set = (v: T) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  return [current, set] as const;
}

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: Variant | undefined;
  size?: Size | undefined;
  loading?: boolean | undefined;
};
export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const s = useStyles();
  return (
    <button
      type="button"
      {...rest}
      className={cx(s.button({variant, size}), className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading && <span className={s.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

const AlertCtx = createContext<AlertParts | null>(null);
type AlertProps = ComponentPropsWithRef<'div'> & {tone?: Tone | undefined; icon?: ReactNode | undefined};
export function Alert({tone = 'info', icon, className, children, ...rest}: AlertProps) {
  const parts = useStyles().alert({tone});
  return (
    <div {...rest} className={cx(parts.root, className)} data-tone={tone}>
      {icon && (
        <span className={parts.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={parts.body}>
        <AlertCtx.Provider value={parts}>{children}</AlertCtx.Provider>
      </div>
    </div>
  );
}
export function AlertTitle({className, ...rest}: ComponentPropsWithRef<'p'>) {
  return <p {...rest} className={cx(useContext(AlertCtx)?.title, className)} />;
}
export function AlertDescription({className, ...rest}: ComponentPropsWithRef<'p'>) {
  return <p {...rest} className={cx(useContext(AlertCtx)?.description, className)} />;
}

const TabsCtx = createContext<{id: string; value: string; select(v: string): void} | null>(null);
const useTabs = () => useContext(TabsCtx)!;
type TabsProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> & {
  value?: string | undefined;
  defaultValue: string;
  onValueChange?: ((v: string) => void) | undefined;
};
export function Tabs({value, defaultValue, onValueChange, className, ...rest}: TabsProps) {
  const [current, select] = useControllable(value, defaultValue, onValueChange);
  return (
    <TabsCtx.Provider value={{id: useId(), value: current, select}}>
      <div {...rest} className={cx(useStyles().tabs, className)} />
    </TabsCtx.Provider>
  );
}
// Roving focus with automatic activation (the Radix default): arrows, Home and End move focus and select.
function onListKey(e: KeyboardEvent<HTMLDivElement>) {
  const tabs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];
  const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
  const next = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1}[e.key];
  if (next === undefined || i < 0) return;
  e.preventDefault();
  const tab = tabs[(next + tabs.length) % tabs.length]!;
  tab.focus();
  tab.click();
}
export function TabsList({className, ...rest}: ComponentPropsWithRef<'div'>) {
  return <div role="tablist" {...rest} className={cx(useStyles().tabsList, className)} onKeyDown={onListKey} />;
}
export function TabsTrigger({value, className, ...rest}: ComponentPropsWithRef<'button'> & {value: string}) {
  const t = useTabs();
  const active = t.value === value;
  return (
    <button
      type="button"
      role="tab"
      {...rest}
      id={`${t.id}-tab-${value}`}
      aria-controls={`${t.id}-panel-${value}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-state={active ? 'active' : 'inactive'}
      className={cx(useStyles().tabsTrigger, className)}
      onClick={() => t.select(value)}
    />
  );
}
export function TabsContent({value, className, ...rest}: ComponentPropsWithRef<'div'> & {value: string}) {
  const t = useTabs();
  const active = t.value === value;
  return (
    <div
      role="tabpanel"
      tabIndex={0}
      {...rest}
      id={`${t.id}-panel-${value}`}
      aria-labelledby={`${t.id}-tab-${value}`}
      hidden={!active}
      data-state={active ? 'active' : 'inactive'}
      className={cx(useStyles().tabsContent, className)}
    />
  );
}

const DialogCtx = createContext<{id: string; open: boolean; setOpen(o: boolean): void} | null>(null);
const useDialog = () => useContext(DialogCtx)!;
type DialogProps = {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  children: ReactNode;
};
export function Dialog({open, defaultOpen = false, onOpenChange, children}: DialogProps) {
  const [current, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  return <DialogCtx.Provider value={{id: useId(), open: current, setOpen}}>{children}</DialogCtx.Provider>;
}
/** Looks like an outline Button. */
export function DialogTrigger({className, ...rest}: ComponentPropsWithRef<'button'>) {
  const d = useDialog();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={d.open}
      {...rest}
      className={cx(useStyles().button({variant: 'outline', size: 'md'}), className)}
      data-state={d.open ? 'open' : 'closed'}
      onClick={() => d.setOpen(true)}
    />
  );
}
// Native <dialog> with showModal: the browser gives the top layer, inert background, Escape (cancel) and focus
// return to the element that had focus before it opened.
export function DialogContent({className, children, ...rest}: ComponentPropsWithRef<'dialog'>) {
  const d = useDialog();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (d.open && !el.open) el.showModal();
    if (!d.open && el.open) el.close();
  }, [d.open]);
  return (
    <dialog
      {...rest}
      ref={ref}
      aria-labelledby={`${d.id}-title`}
      aria-describedby={`${d.id}-desc`}
      data-state={d.open ? 'open' : 'closed'}
      className={cx(useStyles().dialog, className)}
      onClose={() => d.setOpen(false)}
    >
      {children}
    </dialog>
  );
}
export function DialogTitle({className, ...rest}: ComponentPropsWithRef<'h2'>) {
  return <h2 {...rest} id={`${useDialog().id}-title`} className={cx(useStyles().dialogTitle, className)} />;
}
export function DialogDescription({className, ...rest}: ComponentPropsWithRef<'p'>) {
  return <p {...rest} id={`${useDialog().id}-desc`} className={cx(useStyles().dialogDescription, className)} />;
}
export function DialogClose({className, children = 'Close', ...rest}: ComponentPropsWithRef<'button'>) {
  const d = useDialog();
  return (
    <button type="button" {...rest} className={cx(useStyles().dialogClose, className)} onClick={() => d.setOpen(false)}>
      {children}
    </button>
  );
}
