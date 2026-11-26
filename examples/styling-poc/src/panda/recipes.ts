// Values are Monoline's custom properties, read live (see panda.config.ts for why not Panda tokens).
import {defineRecipe, defineSlotRecipe} from '@pandacss/dev';

export const button = defineRecipe({
  className: 'button',
  base: {
    height: 'var(--control-md)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--s3)',
    px: 'var(--s5)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    whiteSpace: 'nowrap',
    borderRadius: 'var(--radius)',
    transition: 'background var(--fast), color var(--fast)',
    _disabled: {opacity: 0.55, cursor: 'not-allowed'},
  },
  variants: {
    variant: {
      solid: {
        bg: 'var(--btn-bg, var(--foreground))',
        color: 'var(--btn-fg, var(--background))',
        '&:hover:not(:disabled)': {bg: 'var(--btn-bg-hover, var(--ink-2))'},
      },
      outline: {
        boxShadow: 'inset 0 0 0 1px var(--foreground)',
        '&:hover:not(:disabled)': {bg: 'var(--foreground)', color: 'var(--background)'},
      },
      ghost: {
        px: 0,
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
        textDecorationColor: 'var(--muted)',
        '&:hover:not(:disabled)': {textDecorationColor: 'currentColor'},
      },
    },
    size: {
      sm: {height: 'var(--control-sm)', px: 'var(--s3)', fontSize: 'var(--text-xs)'},
      md: {},
      lg: {height: 'var(--control-lg)', px: 'var(--s6)', fontSize: 'var(--text-base)'},
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

const bar = (token: string) => ({root: {boxShadow: `inset 3px 0 0 var(--${token})`}});
export const alert = defineSlotRecipe({
  className: 'alert',
  slots: ['root', 'icon', 'body', 'title', 'description'],
  base: {
    root: {
      display: 'flex',
      gap: 'var(--s3)',
      px: 'var(--s4)',
      py: 'var(--s3)',
      bg: 'var(--wash)',
      boxShadow: 'inset 3px 0 0 var(--foreground)',
      fontSize: 'var(--text-sm)',
      borderRadius: 'var(--radius-md)',
    },
    icon: {display: 'flex', paddingBlock: 'var(--s1)'},
    body: {display: 'grid', gap: 'var(--s1)', minWidth: 0},
    title: {overflowWrap: 'anywhere', fontWeight: 'var(--weight-medium)'},
    description: {overflowWrap: 'anywhere', color: 'color-mix(in srgb, var(--foreground) 78%, transparent)'},
  },
  variants: {
    tone: {
      info: bar('accent'),
      ok: {...bar('ok'), title: {color: 'var(--ok)'}},
      warning: {...bar('warning'), title: {color: 'var(--warning)'}},
      danger: {...bar('danger'), title: {color: 'var(--danger)'}},
      neutral: bar('muted'),
    },
  },
  defaultVariants: {tone: 'info'},
});

export const tabs = defineSlotRecipe({
  className: 'tabs',
  slots: ['root', 'list', 'trigger', 'content'],
  base: {
    root: {display: 'grid', gap: 'var(--s4)', minWidth: 0},
    list: {
      display: 'flex',
      gap: 'var(--s5)',
      borderBottom: '1px solid var(--rule)',
      maxWidth: '100%',
      overflowX: 'auto',
    },
    trigger: {
      py: 'var(--s3)',
      px: 0,
      mb: '-1px',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--muted)',
      borderBottom: '2px solid transparent',
      _hover: {color: 'var(--foreground)'},
      '&[data-state="active"]': {color: 'var(--foreground)', borderColor: 'var(--foreground)'},
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
      p: 'var(--s6)',
      bg: 'var(--background)',
      color: 'var(--foreground)',
      border: '1px solid var(--foreground)',
      borderRadius: 'var(--radius-md)',
      '&::backdrop': {bg: 'color-mix(in srgb, var(--surface) 45%, transparent)'},
      '&[data-state="open"]': {animation: 'pop var(--base) var(--ease)'},
    },
    title: {
      paddingInlineEnd: 'var(--s9)',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-lg)',
      letterSpacing: '-0.02em',
      mb: 'var(--s3)',
    },
    description: {color: 'var(--muted)', fontSize: 'var(--text-sm)', mb: 'var(--s5)'},
    close: {
      position: 'absolute',
      top: 'var(--s4)',
      insetInlineEnd: 'var(--s4)',
      px: 'var(--s2)',
      py: 'var(--s1)',
      fontSize: 'var(--text-sm)',
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      textDecorationColor: 'var(--muted)',
    },
  },
});
