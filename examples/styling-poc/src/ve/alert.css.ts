import {style, styleVariants} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {inLayer, vars} from './theme.css';

const bar = (c: string) => inLayer({boxShadow: `inset 3px 0 0 ${c}`});
export const alert = recipe({
  base: inLayer({
    display: 'flex',
    gap: vars.space[3],
    padding: `${vars.space[3]} ${vars.space[4]}`,
    background: vars.wash,
    boxShadow: `inset 3px 0 0 ${vars.foreground}`,
    fontSize: vars.text.sm,
    borderRadius: vars.radius.md,
  }),
  variants: {tone: {info: bar(vars.accent), ok: bar(vars.ok), warning: bar(vars.warning), danger: bar(vars.danger)}},
});
export const icon = style(inLayer({display: 'flex', paddingBlock: vars.space[1]}));
export const body = style(inLayer({display: 'grid', gap: vars.space[1], minWidth: 0}));
export const title = style(inLayer({overflowWrap: 'anywhere', fontWeight: vars.weight.medium}));
// The title colour per tone: a class on the title itself, not a descendant selector from the root.
export const titleTone = styleVariants({
  info: {},
  ok: inLayer({color: vars.ok}),
  warning: inLayer({color: vars.warning}),
  danger: inLayer({color: vars.danger}),
});
export const description = style(
  inLayer({overflowWrap: 'anywhere', color: `color-mix(in srgb, ${vars.foreground} 78%, transparent)`}),
);
