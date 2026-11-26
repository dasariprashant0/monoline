import './styles.css';
import type {Styles} from '../kit';

export const styles: Styles = {
  button: ({variant, size}) => `btn btn-${variant} btn-${size}`,
  spinner: 'btn-spinner',
  alert: () => ({
    root: 'alert',
    icon: 'alert-icon',
    body: 'alert-body',
    title: 'alert-title',
    description: 'alert-description',
  }),
  tabs: 'tabs',
  tabsList: 'tabs-list',
  tabsTrigger: 'tabs-trigger',
  tabsContent: 'tabs-content',
  dialog: 'dialog',
  dialogTitle: 'dialog-title',
  dialogDescription: 'dialog-description',
  dialogClose: 'dialog-close',
};
