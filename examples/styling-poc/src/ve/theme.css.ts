// Approach 3: Vanilla Extract. The contract only names Monoline's existing custom properties (vars.foreground is
// `var(--foreground)`); it declares no values, so tokens.css stays the source and data-theme / data-accent keep
// working on <html> and on any subtree.
import {createGlobalThemeContract, globalLayer, type StyleRule} from '@vanilla-extract/css';

export const vars = createGlobalThemeContract({
  background: 'background',
  foreground: 'foreground',
  muted: 'muted',
  surface: 'surface',
  accent: 'accent',
  ok: 'ok',
  warning: 'warning',
  danger: 'danger',
  rule: 'rule',
  wash: 'wash',
  ink2: 'ink-2',
  space: {1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5', 6: 's6', 9: 's9'},
  text: {xs: 'text-xs', sm: 'text-sm', base: 'text-base', lg: 'text-lg'},
  weight: {medium: 'weight-medium', bold: 'weight-bold'},
  control: {sm: 'control-sm', md: 'control-md', lg: 'control-lg'},
  radius: {none: 'radius', md: 'radius-md'},
  motion: {fast: 'fast', base: 'base', ease: 'ease'},
  font: {display: 'font-display'},
});

// Hooks a consumer may set. createVar() would hash the name, so they are a global contract too.
export const hooks = createGlobalThemeContract({btnBg: 'btn-bg', btnFg: 'btn-fg', btnBgHover: 'btn-bg-hover'});

// The same layer as Monoline's dist (ADR 0003), so unlayered app CSS wins. VE leaves styles unlayered by default.
const components = globalLayer('monoline.components');
export const inLayer = (rule: StyleRule): StyleRule => ({'@layer': {[components]: rule}});
