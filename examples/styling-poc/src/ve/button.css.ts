import {fallbackVar, keyframes, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {hooks, inLayer, vars} from './theme.css';

const spin = keyframes({to: {transform: 'rotate(360deg)'}});
export const spinner = style(
  inLayer({
    width: '1em',
    height: '1em',
    border: '2px solid currentColor',
    borderBottomColor: 'transparent',
    borderRadius: '50%',
    animation: `${spin} 0.8s linear infinite`,
  }),
);

export const button = recipe({
  base: inLayer({
    height: vars.control.md,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space[3],
    padding: `0 ${vars.space[5]}`,
    fontSize: vars.text.sm,
    fontWeight: vars.weight.medium,
    whiteSpace: 'nowrap',
    borderRadius: vars.radius.none,
    transition: `background ${vars.motion.fast}, color ${vars.motion.fast}`,
    selectors: {'&:disabled': {opacity: 0.55, cursor: 'not-allowed'}},
  }),
  variants: {
    variant: {
      solid: inLayer({
        background: fallbackVar(hooks.btnBg, vars.foreground),
        color: fallbackVar(hooks.btnFg, vars.background),
        selectors: {'&:hover:not(:disabled)': {background: fallbackVar(hooks.btnBgHover, vars.ink2)}},
      }),
      outline: inLayer({
        boxShadow: `inset 0 0 0 1px ${vars.foreground}`,
        selectors: {'&:hover:not(:disabled)': {background: vars.foreground, color: vars.background}},
      }),
      ghost: inLayer({
        paddingInline: 0,
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
        textDecorationColor: vars.muted,
        selectors: {'&:hover:not(:disabled)': {textDecorationColor: 'currentColor'}},
      }),
    },
    size: {
      sm: inLayer({height: vars.control.sm, padding: `0 ${vars.space[3]}`, fontSize: vars.text.xs}),
      md: {},
      lg: inLayer({height: vars.control.lg, padding: `0 ${vars.space[6]}`, fontSize: vars.text.base}),
    },
  },
});
