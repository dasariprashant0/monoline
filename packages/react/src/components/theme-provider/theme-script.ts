// No 'use client' here on purpose: a Next.js Server Component (a root layout) must be able to call themeScript().
import type {Accent, Density, Dir, Font, Radius, Theme} from './theme-provider';

/** The values the saved choices may have: the same lists as `themeOptions` in theme-provider.tsx (a test keeps them equal). Kept here so this file needs no client module. */
export const SCRIPT_OPTIONS = {
  theme: ['warm', 'dark', 'midnight', 'system'],
  accent: ['orange', 'rose', 'amber', 'green', 'teal', 'blue', 'violet', 'slate'],
  font: ['mono', 'sans', 'serif'],
  radius: ['square', 'soft', 'round'],
  density: ['compact', 'comfortable', 'spacious'],
  dir: ['ltr', 'rtl'],
} as const;

/**
 * A script (as a string) that sets the saved theme, accent, font, corners, density and direction on `<html>` before the
 * page paints, so server-rendered pages do not flash the wrong look. Inline it in `<head>`. Give it the same `accent`,
 * `font`, `radius`, `density` and `dir` you give `ThemeProvider`, so a visitor with nothing saved sees them from the first frame.
 * @example <script dangerouslySetInnerHTML={{__html: themeScript({accent: 'teal'})}} />
 */
export function themeScript(
  options: {
    storageKey?: string | undefined;
    defaultTheme?: Theme | undefined;
    accent?: Accent | undefined;
    font?: Font | undefined;
    radius?: Radius | undefined;
    density?: Density | undefined;
    dir?: Dir | undefined;
  } = {},
): string {
  const key = JSON.stringify(options.storageKey ?? 'monoline');
  const def = JSON.stringify(options.defaultTheme ?? 'system');
  // Only allowlisted values reach the inline script.
  const app = Object.fromEntries(
    (['accent', 'font', 'radius', 'density', 'dir'] as const)
      .filter((n) => (SCRIPT_OPTIONS[n] as readonly string[]).includes(options[n] as string))
      .map((n) => [n, options[n]]),
  );
  return `(function(){try{var d=document.documentElement,k=${key},o=${JSON.stringify(SCRIPT_OPTIONS)},a=${JSON.stringify(app)},g=function(n){var v=localStorage.getItem(k+'-'+n);return v&&o[n].indexOf(v)>-1?v:a[n]||null},t=g('theme')||${def};if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'warm';d.setAttribute('data-theme',t);['accent','font','radius','density'].forEach(function(n){var v=g(n);if(v)d.setAttribute('data-'+n,v)});var r=g('dir');if(r)d.setAttribute('dir',r)}catch(e){}})()`;
}
