// Approach 4: Panda CSS. Recipes hold the component styles and read Monoline's custom properties directly
// (var(--accent)). No Panda tokens: they would be copies (--colors-accent: var(--accent)) resolved where Panda declares
// them, so a data-theme, data-density or data-radius subtree, or a consumer's --accent on a wrapper, would not reach
// the components (measured: docs/audit/m2-styling-poc.md). Monoline's core.css supplies the reset and base.
import {defineConfig} from '@pandacss/dev';
import {alert, button, dialog, spinner, tabs} from './src/panda/recipes';

export default defineConfig({
  // Panda 2 loads no preset unless asked: preset-base brings the conditions (_hover) and shorthands (px, bg).
  // preset-panda (its own colour and spacing scales) is left out: Monoline's tokens replace it.
  presets: ['@pandacss/preset-base'],
  preflight: false,
  // No recipe function is called (src/panda/styles.ts writes the class strings), and run-time variant values would be
  // invisible to the static extractor anyway: without this the recipe CSS is silently missing.
  staticCss: {recipes: '*'},
  include: ['./src/panda/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  theme: {
    keyframes: {
      spin: {to: {transform: 'rotate(360deg)'}},
      pop: {from: {opacity: 0, transform: 'translateY(8px)'}, to: {opacity: 1, transform: 'none'}},
    },
    recipes: {button, spinner},
    slotRecipes: {alert, tabs, dialog},
  },
});
