// Server entry for scripts/prerender.ts: renders any docs route to an HTML string. Not shipped to the browser.
import {renderToString} from 'react-dom/server';
import {App, pageMeta, preloadAll} from './shell/App';
import {entries} from './shell/registry';
import {resolve, setServerPathname, BASE} from './shell/router';

// Page bodies are lazy chunks; load them all once so renderToString finds them ready.
await preloadAll();

/** Every real route: the home page and one per entry. `path` has no base and no trailing slash. */
export const routes = [{path: '', ...pageMeta({kind: 'home'}), kind: 'home'}, {path: 'playground', ...pageMeta({kind: 'playground'}), kind: 'playground'}, ...entries.map((e) => ({path: e.path, ...pageMeta({kind: 'page', entry: e}), kind: e.kind}))];

/** HTML of the whole app at a route path. */
export function render(path: string) {
  setServerPathname(BASE + path);
  return renderToString(<App />);
}

export {resolve};
