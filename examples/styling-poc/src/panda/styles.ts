import type {AlertVariant, ButtonVariant} from '../../styled-system/recipes';
import type {Styles} from '../kit';

// Class strings written from Panda's naming scheme instead of calling the generated recipe functions, so no Panda
// runtime ships. The generated variant types keep the check: a Tone or Variant Panda has no CSS for fails tsc.
// The CSS for every variant comes from staticCss in panda.config.ts.
const button = (v: Required<ButtonVariant>) => `button button--variant_${v.variant} button--size_${v.size}`;
const alert = ({tone}: Required<AlertVariant>) => ({
  root: `alert__root alert__root--tone_${tone}`,
  icon: 'alert__icon',
  body: 'alert__body',
  title: `alert__title alert__title--tone_${tone}`,
  description: 'alert__description',
});

export const styles: Styles = {
  button,
  spinner: 'spinner',
  alert,
  tabs: 'tabs__root',
  tabsList: 'tabs__list',
  tabsTrigger: 'tabs__trigger',
  tabsContent: 'tabs__content',
  dialog: 'dialog__root',
  dialogTitle: 'dialog__title',
  dialogDescription: 'dialog__description',
  dialogClose: 'dialog__close',
};
