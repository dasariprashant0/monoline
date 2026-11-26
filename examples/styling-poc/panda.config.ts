// Approach 4: Panda CSS. Tokens point at Monoline's custom properties, so tokens.css stays the source; recipes hold
// the component styles. Monoline's core.css supplies the reset and base, so Panda's preflight is off.
import {defineConfig} from '@pandacss/dev';
import {alert, button, dialog, spinner, tabs} from './src/panda/recipes';

const v = (names: string[], prefix = '') => Object.fromEntries(names.map((n) => [n, {value: `var(--${prefix}${n})`}]));

export default defineConfig({
  // Panda 2 loads no preset unless asked: preset-base brings the conditions (_hover) and shorthands (px, bg).
  // preset-panda (its own colour and spacing scales) is left out: Monoline's tokens replace it.
  presets: ['@pandacss/preset-base'],
  preflight: false,
  // Panda tokens are copies (--colors-accent: var(--accent)) resolved where they are declared, by default only on
  // :root. Redeclaring them on every data-theme / data-accent element makes subtree themes work; a consumer who sets
  // --accent on any other element still has to set --colors-accent too.
  cssVarRoot: ':where(:root, :host, [data-theme], [data-accent])',
  // Variants are chosen at run time (button({variant})), which Panda's static extractor cannot see: without this
  // the variant CSS is silently missing. A component library must ship every variant.
  staticCss: {recipes: '*'},
  include: ['./src/panda/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: v([
        'background',
        'foreground',
        'muted',
        'surface',
        'accent',
        'ok',
        'warning',
        'danger',
        'rule',
        'wash',
        'ink-2',
      ]),
      spacing: v(['s1', 's2', 's3', 's4', 's5', 's6', 's9']),
      sizes: {control: v(['sm', 'md', 'lg'], 'control-')},
      fontSizes: v(['xs', 'sm', 'base', 'lg'], 'text-'),
      fontWeights: v(['medium', 'bold'], 'weight-'),
      fonts: {display: {value: 'var(--font-display)'}},
      radii: {none: {value: 'var(--radius)'}, md: {value: 'var(--radius-md)'}},
      durations: v(['fast', 'base']),
      easings: {default: {value: 'var(--ease)'}},
    },
    keyframes: {
      spin: {to: {transform: 'rotate(360deg)'}},
      pop: {from: {opacity: 0, transform: 'translateY(8px)'}, to: {opacity: 1, transform: 'none'}},
    },
    recipes: {button, spinner},
    slotRecipes: {alert, tabs, dialog},
  },
});
