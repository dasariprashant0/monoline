import {defineRecipe, defineSlotRecipe} from '@pandacss/dev';

export const button = defineRecipe({
  className: 'button',
  base: {
    height: 'control.md',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 's3',
    px: 's5',
    fontSize: 'sm',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    borderRadius: 'none',
    transition: 'background token(durations.fast), color token(durations.fast)',
    _disabled: {opacity: 0.55, cursor: 'not-allowed'},
  },
  variants: {
    variant: {
      solid: {
        bg: 'var(--btn-bg, token(colors.foreground))',
        color: 'var(--btn-fg, token(colors.background))',
        '&:hover:not(:disabled)': {bg: 'var(--btn-bg-hover, token(colors.ink-2))'},
      },
      outline: {
        boxShadow: 'inset 0 0 0 1px token(colors.foreground)',
        '&:hover:not(:disabled)': {bg: 'foreground', color: 'background'},
      },
      ghost: {
        px: 0,
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
        textDecorationColor: 'muted',
        '&:hover:not(:disabled)': {textDecorationColor: 'currentColor'},
      },
    },
    size: {
      sm: {height: 'control.sm', px: 's3', fontSize: 'xs'},
      md: {},
      lg: {height: 'control.lg', px: 's6', fontSize: 'base'},
    },
  },
  defaultVariants: {variant: 'solid', size: 'md'},
});

export const spinner = defineRecipe({
  className: 'spinner',
  base: {
    w: '1em',
    h: '1em',
    border: '2px solid currentColor',
    borderBottomColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
});

const bar = (token: string) => ({root: {boxShadow: `inset 3px 0 0 token(colors.${token})`}});
export const alert = defineSlotRecipe({
  className: 'alert',
  slots: ['root', 'icon', 'body', 'title', 'description'],
  base: {
    root: {
      display: 'flex',
      gap: 's3',
      px: 's4',
      py: 's3',
      bg: 'wash',
      boxShadow: 'inset 3px 0 0 token(colors.foreground)',
      fontSize: 'sm',
      borderRadius: 'md',
    },
    icon: {display: 'flex', paddingBlock: 's1'},
    body: {display: 'grid', gap: 's1', minWidth: 0},
    title: {overflowWrap: 'anywhere', fontWeight: 'medium'},
    description: {overflowWrap: 'anywhere', color: 'color-mix(in srgb, token(colors.foreground) 78%, transparent)'},
  },
  variants: {
    tone: {
      info: bar('accent'),
      ok: {...bar('ok'), title: {color: 'ok'}},
      warning: {...bar('warning'), title: {color: 'warning'}},
      danger: {...bar('danger'), title: {color: 'danger'}},
      neutral: bar('muted'),
    },
  },
  defaultVariants: {tone: 'info'},
});

export const tabs = defineSlotRecipe({
  className: 'tabs',
  slots: ['root', 'list', 'trigger', 'content'],
  base: {
    root: {display: 'grid', gap: 's4', minWidth: 0},
    list: {
      display: 'flex',
      gap: 's5',
      borderBottom: '1px solid token(colors.rule)',
      maxWidth: '100%',
      overflowX: 'auto',
    },
    trigger: {
      py: 's3',
      px: 0,
      mb: '-1px',
      fontWeight: 'medium',
      color: 'muted',
      borderBottom: '2px solid transparent',
      _hover: {color: 'foreground'},
      '&[data-state="active"]': {color: 'foreground', borderColor: 'foreground'},
    },
    content: {_focusVisible: {outlineOffset: '4px'}},
  },
});

export const dialog = defineSlotRecipe({
  className: 'dialog',
  slots: ['root', 'title', 'description', 'close'],
  base: {
    root: {
      position: 'fixed',
      inset: 0,
      margin: 'auto',
      width: 'min(520px, 92vw)',
      height: 'fit-content',
      maxHeight: '90vh',
      overflowY: 'auto',
      p: 's6',
      bg: 'background',
      color: 'foreground',
      border: '1px solid token(colors.foreground)',
      borderRadius: 'md',
      '&::backdrop': {bg: 'color-mix(in srgb, token(colors.surface) 45%, transparent)'},
      '&[data-state="open"]': {animation: 'pop token(durations.base) token(easings.default)'},
    },
    title: {
      paddingInlineEnd: 's9',
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: 'lg',
      letterSpacing: '-0.02em',
      mb: 's3',
    },
    description: {color: 'muted', fontSize: 'sm', mb: 's5'},
    close: {
      position: 'absolute',
      top: 's4',
      insetInlineEnd: 's4',
      px: 's2',
      py: 's1',
      fontSize: 'sm',
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      textDecorationColor: 'muted',
    },
  },
});
