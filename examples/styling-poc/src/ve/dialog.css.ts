import {keyframes, style} from '@vanilla-extract/css';
import {inLayer, vars} from './theme.css';

const pop = keyframes({from: {opacity: 0, transform: 'translateY(8px)'}, to: {opacity: 1, transform: 'none'}});
export const root = style(
  inLayer({
    position: 'fixed',
    inset: 0,
    margin: 'auto',
    width: 'min(520px, 92vw)',
    height: 'fit-content',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: vars.space[6],
    background: vars.background,
    color: vars.foreground,
    border: `1px solid ${vars.foreground}`,
    borderRadius: vars.radius.md,
    selectors: {
      '&::backdrop': {background: `color-mix(in srgb, ${vars.surface} 45%, transparent)`},
      '&[data-state="open"]': {animation: `${pop} ${vars.motion.base} ${vars.motion.ease}`},
    },
  }),
);
export const title = style(
  inLayer({
    paddingInlineEnd: vars.space[9],
    fontFamily: vars.font.display,
    fontWeight: vars.weight.bold,
    fontSize: vars.text.lg,
    letterSpacing: '-0.02em',
    marginBottom: vars.space[3],
  }),
);
export const description = style(inLayer({color: vars.muted, fontSize: vars.text.sm, marginBottom: vars.space[5]}));
export const close = style(
  inLayer({
    position: 'absolute',
    top: vars.space[4],
    insetInlineEnd: vars.space[4],
    padding: `${vars.space[1]} ${vars.space[2]}`,
    fontSize: vars.text.sm,
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    textDecorationColor: vars.muted,
  }),
);
