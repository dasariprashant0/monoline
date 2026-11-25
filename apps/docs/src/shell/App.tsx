// The docs frame: skip link, top bar, sidebar, main column, "On this page" rail, search palette.
// Routing, titles, scroll and focus are handled here; page bodies come from ../page and ../guides.
import {use, useEffect, useRef, useState, type ReactNode} from 'react';
import {Button, DirectionProvider} from '@monoline/react';
import {
  Astro,
  Editor,
  Extensions,
  IconsLibrary,
  IconsPage,
  Nextjs,
  PlainCss,
  Remix,
  Upgrade,
  Vite,
} from '../site/Pages';
import {PlaygroundPage} from '../page/live';
import {Tokens} from '../site/Tokens';
import {CopyMarkdown, OpenMenu, domToMarkdown} from '../page/doc-actions';
import {GITHUB} from './Topbar';
import {Nav} from './Nav';
import {Pager} from './Pager';
import {Search} from './Search';
import {Toc} from './Toc';
import {Topbar} from './Topbar';
import {useHeadings} from './headings';
import {PrefsContext, usePrefs} from './prefs';
import {VERSION, components, guides, hooks, inCategory, loadDemos, type Entry} from './registry';
import {loader, type Tracked} from './lazy';
import {href, resolve, useNavCount, usePathname, type Route} from './router';

const SITE = 'Monoline';
const HOME_DESCRIPTION =
  'Monoline: an open-source UI kit with plain CSS tokens and accessible React components on Radix.';

function setMeta(title: string, description: string) {
  document.title = title;
  let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!m) {
    m = document.createElement('meta');
    m.name = 'description';
    document.head.append(m);
  }
  m.content = description;
}

const SITE_BODIES: Record<string, () => ReactNode> = {
  tokens: Tokens,
  nextjs: Nextjs,
  vite: Vite,
  astro: Astro,
  remix: Remix,
  'plain-css': PlainCss,
  icons: IconsPage,
  'icons-library': IconsLibrary,
  editor: Editor,
  tools: Extensions,
  upgrade: Upgrade,
};

/** Title area of every page that is not a component: 30px heading and a grey description. */
export function PageHead({
  title,
  description,
  actions = true,
}: {
  title: string;
  description: string;
  actions?: boolean;
}) {
  return (
    <header className="doc-head">
      <h1 className="doc-title">{title}</h1>
      <p className="doc-lede">{description}</p>
      {actions && (
        <div className="doc-actions">
          <CopyMarkdown source={() => domToMarkdown(document.querySelector('.docs-main')!)} />
          <OpenMenu title={title} pageUrl={() => location.href} source={`${GITHUB}/tree/master/apps/docs/src`} />
        </div>
      )}
    </header>
  );
}

// The big page bodies are separate chunks. The prerender awaits them all (preloadAll); the browser awaits the route's
// chunks (preloadRoute) before hydrating and before it shows a new route, so rendering never suspends.
const loadComponentDoc = loader(() => import('../page/component-doc'));
const loadHome = loader(() => import('./Home'));
const siteLoaders: Record<string, () => Tracked<Record<string, unknown>>> = {
  components: loader(() => import('../site/Overview')),
  blocks: loader(() => import('../site/Blocks')),
  themes: loader(() => import('../site/Themes')),
  compare: loader(() => import('../site/Compare')),
  changelog: loader(() => import('../site/Doc')),
  roadmap: loader(() => import('../site/Doc')),
};
const SITE_EXPORT: Record<string, string> = {
  components: 'Overview',
  blocks: 'Blocks',
  themes: 'Themes',
  compare: 'Compare',
  changelog: 'Changelog',
  roadmap: 'Roadmap',
};

/** Loads everything a route needs to render. main.tsx awaits it before hydrating (the server HTML is kept) and App awaits it before it shows a new route. */
export function preloadRoute(route: Route): Promise<unknown> {
  if (route.kind === 'home') return loadHome();
  if (route.kind !== 'page') return Promise.resolve();
  const {entry} = route;
  if (entry.kind === 'site')
    return siteLoaders[entry.name]
      ? siteLoaders[entry.name]!().then(() =>
          entry.name === 'blocks' ? Promise.all(inCategory('blocks').map((m) => loadDemos(m.name))) : undefined,
        )
      : Promise.resolve();
  if (entry.kind === 'guide') return Promise.resolve();
  return Promise.all([loadComponentDoc(), loadDemos(entry.name)]);
}

/** Loads every page body. The prerender awaits it once, then renders each route synchronously. */
export const preloadAll = () =>
  Promise.all([
    loadHome(),
    loadComponentDoc(),
    ...Object.values(siteLoaders).map((l) => l()),
    ...[...components, ...hooks].map((m) => loadDemos(m.name)),
  ]);

function HomePage() {
  const {Home} = use(loadHome());
  return <Home />;
}

function Page({entry}: {entry: Entry}) {
  if (entry.kind === 'site') {
    const Body = siteLoaders[entry.name]
      ? (use(siteLoaders[entry.name]!()) as Record<string, () => ReactNode>)[SITE_EXPORT[entry.name]!]!
      : SITE_BODIES[entry.name]!;
    return (
      <>
        <PageHead title={entry.title} description={entry.description} />
        <Body />
      </>
    );
  }
  if (entry.kind === 'guide') {
    const guide = guides.find((g) => g.slug === entry.name)!;
    return (
      <>
        <PageHead title={guide.title} description={guide.summary} />
        {guide.body()}
      </>
    );
  }
  const meta = [...components, ...hooks].find((m) => m.name === entry.name)!;
  const {ComponentDoc} = use(loadComponentDoc());
  return <ComponentDoc meta={meta} />;
}

function Missing({path}: {path: string}) {
  return (
    <>
      <PageHead
        actions={false}
        title="Page not found"
        description={`There is no page at /${path}. Search with the / key, or start from the home page.`}
      />
      <div className="hero-actions">
        <Button variant="solid" asChild>
          <a href={href()}>Home</a>
        </Button>
      </div>
    </>
  );
}

/** Title and description of a route, shared by the browser (setMeta) and the prerender script. */
export function pageMeta(route: Route) {
  if (route.kind === 'page') {
    const {entry} = route;
    // Two pages are both called "Overview" in the sidebar: give them distinct document titles. Short descriptions get a suffix so search results have something to show.
    const name =
      entry.title === 'Overview' ? `${entry.tab[0]!.toUpperCase()}${entry.tab.slice(1)} overview` : entry.title;
    const description =
      entry.description.length < 60 && (entry.kind === 'component' || entry.kind === 'hook')
        ? `${entry.description.replace(/\.?$/, '.')} Props, examples and accessibility notes for the Monoline ${entry.kind === 'hook' ? 'hook' : 'React component'}.`
        : entry.description;
    return {title: `${name} · ${SITE}`, description};
  }
  if (route.kind === 'missing') return {title: `Page not found · ${SITE}`, description: HOME_DESCRIPTION};
  if (route.kind === 'playground')
    return {
      title: `Playground · ${SITE}`,
      description: 'Edit Monoline code and see it run: every component, no setup.',
    };
  return {title: `${SITE}: plain CSS and accessible React components`, description: HOME_DESCRIPTION};
}

export function App() {
  const requested = usePathname();
  // Show a new route only once its chunks have loaded, so nothing suspends and the old page stays until then.
  const [pathname, setShown] = useState(requested);
  useEffect(() => {
    let live = true;
    preloadRoute(resolve(requested)).then(
      () => live && setShown(requested),
      () => live && setShown(requested),
    );
    return () => {
      live = false;
    };
  }, [requested]);
  const navs = useNavCount();
  const route = resolve(pathname);
  const path =
    route.kind === 'page'
      ? route.entry.path
      : route.kind === 'missing'
        ? route.path
        : route.kind === 'playground'
          ? 'playground'
          : '';
  const [prefs, set] = usePrefs();
  const [search, setSearch] = useState(false);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const headings = useHeadings(main, path);

  // biome-ignore lint/correctness/useExhaustiveDependencies: route is derived from path; update the meta only when the path changes.
  useEffect(() => {
    const {title, description} = pageMeta(route);
    setMeta(title, description);
  }, [path]);

  // Demos and blocks render real <h1>s (a hero, a page header). The page keeps one: the others become level-2 headings for assistive tech.
  useEffect(() => {
    const root = main.current;
    if (!root) return;
    const demote = () =>
      root.querySelectorAll('h1').forEach((h, i) => {
        if (i > 0 && !h.hasAttribute('aria-level')) {
          h.setAttribute('role', 'heading');
          h.setAttribute('aria-level', '2');
        }
      });
    demote();
    const mo = new MutationObserver(demote); // childList only: setting attributes does not retrigger it
    mo.observe(root, {childList: true, subtree: true});
    return () => mo.disconnect();
  }, [path]);

  // After every navigation: scroll to the hash anchor or the top, and move focus to the page heading
  // (not on first load, so a fresh visit keeps the browser's own focus).
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
      return;
    }
    const h1 = main.current?.querySelector('h1');
    if (h1) {
      h1.tabIndex = -1;
      h1.focus({preventScroll: true});
    }
  }, [path, navs]);

  return (
    // Radix reads its direction from a provider, not from <html dir>: without this the RTL preference flips the CSS but not the arrow keys.
    <DirectionProvider dir={prefs.dir === 'rtl' ? 'rtl' : 'ltr'}>
      <PrefsContext.Provider value={[prefs, set] as const}>
        {route.kind === 'playground' ? (
          <PlaygroundPage />
        ) : (
          <div
            className="docs"
            data-home={route.kind === 'home' || undefined}
            data-rail={
              (route.kind !== 'home' &&
                (headings.length > 1 ||
                  (route.kind === 'page' &&
                    (route.entry.kind === 'component' ||
                      route.entry.kind === 'hook' ||
                      route.entry.name === 'components')))) ||
              undefined
            }
          >
            {/* biome-ignore lint/a11y/useValidAnchor: a real link to #main without JS; the handler also moves focus there. */}
            <a
              className="skip-link"
              href="#main"
              onClick={(e) => {
                e.preventDefault();
                const m = main.current;
                if (m) {
                  m.tabIndex = -1;
                  m.focus();
                }
              }}
            >
              Skip to main content
            </a>
            <Topbar path={path} route={route} prefs={prefs} set={set} onSearch={() => setSearch(true)} />
            <aside className="docs-side" id="docs-side" aria-label="Documentation sidebar">
              <button type="button" className="side-search" aria-haspopup="dialog" onClick={() => setSearch(true)}>
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="m10.5 10.5 3.5 3.5" />
                </svg>
                <span>Search</span>
                <kbd className="kbd" aria-hidden="true">
                  /
                </kbd>
              </button>
              <Nav
                tab={route.kind === 'page' ? route.entry.tab : undefined}
                current={route.kind === 'page' ? route.entry.path : ''}
              />
            </aside>
            <main className="docs-main" id="main" ref={main}>
              {route.kind === 'home' ? (
                <HomePage />
              ) : route.kind === 'missing' ? (
                <Missing path={route.path} />
              ) : (
                <>
                  <Page key={route.entry.path} entry={route.entry} />
                  <Pager entry={route.entry} />
                </>
              )}
            </main>
            {headings.length > 1 && route.kind !== 'home' && (
              <Toc
                headings={headings}
                extra={
                  route.kind === 'page' && (route.entry.kind === 'component' || route.entry.kind === 'hook') ? (
                    <aside className="docs-facts-box" aria-label="Package facts">
                      <dl className="docs-facts">
                        <dt>Version</dt>
                        <dd>{VERSION}</dd>
                        <dt>Links</dt>
                        <dd>
                          <a
                            href={`${GITHUB}/tree/master/packages/react/src/${route.entry.kind === 'hook' ? 'hooks' : 'components'}/${route.entry.name}`}
                          >
                            View source
                          </a>
                          <a href={`${GITHUB}/issues/new`}>Report an issue</a>
                          <a href={`${import.meta.env.BASE_URL}docs/${route.entry.name}.md`}>View as Markdown</a>
                        </dd>
                      </dl>
                    </aside>
                  ) : undefined
                }
              />
            )}
            <Search open={search} onOpenChange={setSearch} />
          </div>
        )}
      </PrefsContext.Provider>
    </DirectionProvider>
  );
}
