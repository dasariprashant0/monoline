import {fileURLToPath} from 'node:url';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
// scripts/measure.ts builds one page at a time (POC_PAGE) and, with POC_STYLING_ONLY, swaps the shared CSS
// (Monoline's core.css and the app's own app.css) for an empty file so the CSS left is the approach's alone.
const pages = process.env.POC_PAGE ? [process.env.POC_PAGE] : ['index', 'plain', 'modules', 've', 'panda'];
const empty = p('src/empty.css');

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: process.env.POC_STYLING_ONLY
      ? [
          {find: '@monoline/css/core.css', replacement: empty},
          {find: /^.*\/app\.css$/, replacement: empty},
        ]
      : [{find: /^@monoline\/css\//, replacement: p('../../packages/css/dist/')}],
  },
  build: {rollupOptions: {input: Object.fromEntries(pages.map((n) => [n, p(`${n}.html`)]))}},
});
