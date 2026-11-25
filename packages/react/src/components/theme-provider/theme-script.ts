// No 'use client' here on purpose: a Next.js Server Component (a root layout) must be able to call themeScript().
import type {Theme} from './theme-provider';

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
 * page paints, so server-rendered pages do not flash the wrong look. Inline it in `<head>`.
 * @example <script dangerouslySetInnerHTML={{__html: themeScript()}} />
 */
export function themeScript(options: {storageKey?: string | undefined; defaultTheme?: Theme | undefined} = {}): string {
  const key = JSON.stringify(options.storageKey ?? 'monoline');
  const def = JSON.stringify(options.defaultTheme ?? 'system');
  return `(function(){try{var d=document.documentElement,k=${key},o=${JSON.stringify(SCRIPT_OPTIONS)},g=function(n){var v=localStorage.getItem(k+'-'+n);return v&&o[n].indexOf(v)>-1?v:null},t=g('theme')||${def};if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'warm';d.setAttribute('data-theme',t);['accent','font','radius','density'].forEach(function(n){var v=g(n);if(v)d.setAttribute('data-'+n,v)});var r=g('dir');if(r)d.setAttribute('dir',r)}catch(e){}})()`;
}
