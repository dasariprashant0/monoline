import {style} from '@vanilla-extract/css';
import {inLayer, vars} from './theme.css';

export const root = style(inLayer({display: 'grid', gap: vars.space[4], minWidth: 0}));
export const list = style(
  inLayer({
    display: 'flex',
    gap: vars.space[5],
    borderBottom: `1px solid ${vars.rule}`,
    maxWidth: '100%',
    overflowX: 'auto',
  }),
);
export const trigger = style(
  inLayer({
    padding: `${vars.space[3]} 0`,
    marginBottom: '-1px',
    fontWeight: vars.weight.medium,
    color: vars.muted,
    borderBottom: '2px solid transparent',
    selectors: {
      '&:hover': {color: vars.foreground},
      '&[data-state="active"]': {color: vars.foreground, borderColor: vars.foreground},
    },
  }),
);
export const content = style(inLayer({selectors: {'&:focus-visible': {outlineOffset: '4px'}}}));
