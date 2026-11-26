import type {Styles} from '../kit';
import * as alert from './alert.css';
import {button, spinner} from './button.css';
import * as dialog from './dialog.css';
import * as tabs from './tabs.css';

export const styles: Styles = {
  button,
  spinner,
  alert: ({tone}) => ({
    root: alert.alert({tone}),
    icon: alert.icon,
    body: alert.body,
    title: `${alert.title} ${alert.titleTone[tone]}`,
    description: alert.description,
  }),
  tabs: tabs.root,
  tabsList: tabs.list,
  tabsTrigger: tabs.trigger,
  tabsContent: tabs.content,
  dialog: dialog.root,
  dialogTitle: dialog.title,
  dialogDescription: dialog.description,
  dialogClose: dialog.close,
};
