// No 'use client' here on purpose: a Next.js Server Component (a root layout) must be able to call themeScript().
import type {Theme} from './theme-provider';

/**
 * A script (as a string) that sets the saved theme, accent, font, corners, density and direction on `<html>` before the
 * page paints, so server-rendered pages do not flash the wrong look. Inline it in `<head>`.
 * @example <script dangerouslySetInnerHTML={{__html: themeScript()}} />
 */
export function themeScript(options: {storageKey?: string; defaultTheme?: Theme} = {}): string {
  const key = JSON.stringify(options.storageKey ?? 'monoline');
  const def = JSON.stringify(options.defaultTheme ?? 'system');
  return `(function(){try{var d=document.documentElement,k=${key},g=function(n){return localStorage.getItem(k+'-'+n)},t=g('theme')||${def};if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'warm';d.setAttribute('data-theme',t);['accent','font','radius','density'].forEach(function(n){var v=g(n);if(v)d.setAttribute('data-'+n,v)});var r=g('dir');if(r)d.setAttribute('dir',r)}catch(e){}})()`;
}
