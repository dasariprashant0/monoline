import {css} from '../../styled-system/css';
import {alert, button, dialog, tabs} from '../../styled-system/recipes';
import type {Styles} from '../kit';

const t = tabs();
const d = dialog();

export const styles: Styles = {
  button,
  // An atomic css() call, for comparison with the recipes: one class per declaration.
  spinner: css({
    w: '1em',
    h: '1em',
    border: '2px solid currentColor',
    borderBottomColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }),
  alert,
  tabs: t.root,
  tabsList: t.list,
  tabsTrigger: t.trigger,
  tabsContent: t.content,
  dialog: d.root,
  dialogTitle: d.title,
  dialogDescription: d.description,
  dialogClose: d.close,
};
