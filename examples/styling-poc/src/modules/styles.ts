import type {Styles} from '../kit';
import alert from './alert.module.css';
import button from './button.module.css';
import dialog from './dialog.module.css';
import tabs from './tabs.module.css';

// Vite types a module as {[key: string]: string}, so under noUncheckedIndexedAccess every name is string | undefined
// and a typo is not caught: `!` asserts names that exist in the .module.css files.
export const styles: Styles = {
  button: ({variant, size}) => [button.root, button[variant], button[size]].filter(Boolean).join(' '),
  spinner: button.spinner!,
  alert: () => ({
    root: alert.root!,
    icon: alert.icon!,
    body: alert.body!,
    title: alert.title!,
    description: alert.description!,
  }),
  tabs: tabs.root!,
  tabsList: tabs.list!,
  tabsTrigger: tabs.trigger!,
  tabsContent: tabs.content!,
  dialog: dialog.root!,
  dialogTitle: dialog.title!,
  dialogDescription: dialog.description!,
  dialogClose: dialog.close!,
};
