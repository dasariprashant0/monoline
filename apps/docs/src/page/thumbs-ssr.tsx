// Build-time only (scripts/gen-thumbs.ts loads it through Vite's SSR): renders one demo per component to static HTML.
import {renderToStaticMarkup} from 'react-dom/server';
import type {Demo} from '@monoline/react';
import {OVERRIDES} from './thumb-overrides';

const files = import.meta.glob<{demos: Demo[]}>('../../../../packages/react/src/components/*/*.demo.tsx', {
  eager: true,
});

/** Which demo to show when the first is not the best picture of the component. */
const PICK: Record<string, number> = {};

/** name -> HTML of the demo shown as the thumbnail. */
export function renderThumbs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [file, mod] of Object.entries(files)) {
    const name = file.split('/').at(-2)!;
    const demo = mod.demos[PICK[name] ?? 0];
    if (demo) out[name] = renderToStaticMarkup(demo.render());
  }
  return {...out, ...OVERRIDES};
}
