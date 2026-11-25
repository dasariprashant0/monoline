// Components overview: one card per component and hook, grouped by category.
// A component's thumbnail is the real component: scripts/gen-thumbs.ts renders one demo to static HTML, and the card
// shows it scaled down inside an SVG (foreignObject), so it follows the theme, accent and text direction with no
// JavaScript. Hooks draw nothing, so each has a small purpose-made illustration below.
import type {ReactNode} from 'react';
import {categories, hooks, inCategory, nice, pathOf} from '../shell/registry';
import {href} from '../shell/router';
import './overview.css';

// A glob, like the other generated files, so a type check before `npm run gen` still passes.
const html: Record<string, string> = Object.values(import.meta.glob<Record<string, string>>('../page/thumbs.generated.json', {eager: true, import: 'default'}))[0] ?? {};
const W = 320, H = 200;

/** Illustrations on a 320 by 200 board. Lines are the kit's rule weight; the accent marks the thing the hook gives you. */
const A = 'var(--accent)';
const Box = (p: {x: number; y: number; w: number; h: number; fill?: boolean; dash?: boolean}) => <rect x={p.x} y={p.y} width={p.w} height={p.h} className={p.fill ? 'ov-fill' : undefined} strokeDasharray={p.dash ? '4 3' : undefined} />;
const T = ({x, y, children, anchor = 'start'}: {x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'}) => <text x={x} y={y} textAnchor={anchor} className="ov-text">{children}</text>;
const Arrow = ({d}: {d: string}) => <path d={d} markerEnd="url(#ov-head)" />;

const HOOK_ART: Record<string, {call: string; art: ReactNode}> = {
  'use-click-outside': {call: 'useClickOutside(ref, close)', art: <><Box x={100} y={70} w={120} h={70} dash /><T x={160} y={110} anchor="middle">menu</T><path d="M250 150l0-20 6 6 6-12" className="ov-dim" /><circle cx={256} cy={136} r={14} stroke={A} /><path d="M30 80l12 12M42 80l-12 12" stroke={A} /></>},
  'use-clipboard': {call: 'const {copy, copied} = useClipboard()', art: <><Box x={110} y={64} w={70} h={90} /><Box x={140} y={84} w={70} h={90} /><path d="M120 84h40M120 96h30M150 106h40M150 118h30" className="ov-dim" /><path d="M176 148l10 10 22-26" stroke={A} strokeWidth={3} /></>},
  'use-controllable-state': {call: 'useControllableState({value, defaultValue})', art: <><Box x={40} y={80} w={90} h={50} /><T x={85} y={110} anchor="middle">value</T><Box x={190} y={80} w={90} h={50} dash /><T x={235} y={110} anchor="middle">default</T><Arrow d="M134 98h50" /><Arrow d="M186 116h-50" /><circle cx={160} cy={150} r={5} className="ov-fill" /></>},
  'use-counter': {call: 'const {count, inc, dec} = useCounter(0)', art: <><Box x={40} y={80} w={50} h={50} /><path d="M52 105h26" /><Box x={110} y={80} w={100} h={50} /><T x={160} y={114} anchor="middle">3</T><Box x={230} y={80} w={50} h={50} fill /><path d="M243 105h24M255 93v24" stroke="var(--background)" /></>},
  'use-debounce': {call: 'useDebounce(value, 300)', art: <><path d="M30 150h260" className="ov-dim" />{[40, 52, 60, 74, 82, 96].map((x, i) => <path key={x} d={`M${x} 150v-${28 + (i % 3) * 8}`} className="ov-dim" />)}<path d="M230 150v-70" stroke={A} strokeWidth={4} /><path d="M100 70h130" strokeDasharray="3 3" /><T x={165} y={62} anchor="middle">wait</T></>},
  'use-disclosure': {call: 'const {open, toggle} = useDisclosure()', art: <><Box x={50} y={64} w={220} h={30} /><path d="M66 74l8 8 8-8" stroke={A} strokeWidth={2} /><path d="M96 79h90" className="ov-dim" /><Box x={50} y={94} w={220} h={64} /><path d="M66 112h150M66 126h110M66 140h130" className="ov-dim" /></>},
  'use-document-title': {call: 'useDocumentTitle("Inbox")', art: <><Box x={40} y={60} w={240} h={110} /><path d="M40 84h240" /><path d="M52 60V54h90v6" /><Box x={58} y={64} w={64} h={7} fill /><path d="M52 104h150M52 118h110M52 132h130" className="ov-dim" /></>},
  'use-focus-trap': {call: 'useFocusTrap(ref, active)', art: <><Box x={60} y={56} w={200} h={112} dash /><Box x={80} y={84} w={50} h={24} /><Box x={140} y={84} w={50} h={24} fill /><Box x={200} y={84} w={46} h={24} /><path d="M105 130h110" className="ov-dim" /><Arrow d="M232 140c-10 14-120 14-140 0" /></>},
  'use-hash': {call: 'const [hash, setHash] = useHash()', art: <><Box x={30} y={70} w={260} h={34} /><T x={44} y={92}>/docs/guide</T><Box x={150} y={78} w={90} h={18} fill /><T x={156} y={92}>#install</T><path d="M30 130h200M30 146h150" className="ov-dim" /></>},
  'use-hotkeys': {call: 'useHotkeys("mod+k", open)', art: <><Box x={56} y={76} w={60} h={60} /><T x={86} y={114} anchor="middle">Cmd</T><path d="M132 106h18M141 97v18" /><Box x={166} y={76} w={60} h={60} fill /><T x={196} y={114} anchor="middle">K</T><path d="M60 156h210" className="ov-dim" /></>},
  'use-hover': {call: 'const [ref, hovered] = useHover()', art: <><Box x={90} y={70} w={140} h={70} fill /><path d="M205 150l0-24 6 6 8-4-8 20z" /><path d="M60 156h200" className="ov-dim" /></>},
  'use-intersection': {call: 'useIntersection(ref, {threshold: 0.5})', art: <><Box x={70} y={52} w={180} h={100} dash /><T x={160} y={66} anchor="middle">viewport</T><Box x={110} y={118} w={100} h={50} fill /><path d="M110 168h100M60 130h-12M60 160h-12" className="ov-dim" /></>},
  'use-interval': {call: 'useInterval(tick, 1000)', art: <><circle cx={160} cy={110} r={46} /><path d="M160 110V80M160 110l20 12" stroke={A} strokeWidth={3} />{[0, 90, 180, 270].map((a) => <path key={a} d="M160 68v-6" transform={`rotate(${a} 160 110)`} className="ov-dim" />)}<Arrow d="M226 90a70 70 0 0 1 0 40" /></>},
  'use-local-storage': {call: 'const [theme, setTheme] = useLocalStorage("theme")', art: <><path d="M110 76v62c0 10 100 10 100 0V76" /><ellipse cx={160} cy={76} rx={50} ry={10} /><path d="M110 104c0 10 100 10 100 0M110 124c0 10 100 10 100 0" className="ov-dim" /><Box x={142} y={84} w={36} h={12} fill /><path d="M60 110h40M220 110h40" className="ov-dim" /></>},
  'use-long-press': {call: 'useLongPress(onLongPress, {delay: 500})', art: <><circle cx={160} cy={110} r={44} className="ov-dim" /><path d="M160 66a44 44 0 1 1-38 22" stroke={A} strokeWidth={4} /><circle cx={160} cy={110} r={12} className="ov-fill" /></>},
  'use-media-query': {call: 'useMediaQuery("(min-width: 768px)")', art: <><Box x={50} y={100} w={40} h={64} /><Box x={110} y={84} w={80} h={80} /><Box x={210} y={64} w={70} h={100} /><path d="M50 60h230" className="ov-dim" /><path d="M50 54v12M110 54v12M210 54v12M280 54v12" /><path d="M110 60h100" stroke={A} strokeWidth={3} /></>},
  'use-mounted': {call: 'const mounted = useMounted()', art: <><Box x={40} y={80} w={90} h={60} dash /><T x={85} y={114} anchor="middle">server</T><Arrow d="M138 110h40" /><Box x={190} y={80} w={90} h={60} /><T x={235} y={106} anchor="middle">client</T><path d="M222 122l8 8 16-18" stroke={A} strokeWidth={3} /></>},
  'use-previous': {call: 'const prev = usePrevious(value)', art: <><Box x={50} y={80} w={90} h={60} dash /><T x={95} y={116} anchor="middle">3</T><Arrow d="M148 110h24" /><Box x={180} y={80} w={90} h={60} fill /><T x={225} y={116} anchor="middle" >4</T><T x={95} y={160} anchor="middle">prev</T><T x={225} y={160} anchor="middle">now</T></>},
  'use-reduced-motion': {call: 'const reduce = useReducedMotion()', art: <><path d="M50 96c20-30 40 30 60 0s40 30 60 0 40 30 60 0" className="ov-dim" /><path d="M50 132h220" stroke={A} strokeWidth={3} /><circle cx={160} cy={132} r={8} className="ov-fill" /></>},
  'use-scroll-spy': {call: 'const active = useScrollSpy(ids)', art: <><Box x={50} y={60} w={100} h={110} /><Box x={58} y={96} w={84} h={18} fill /><path d="M64 78h50M64 130h56M64 148h42" className="ov-dim" /><path d="M180 66h90M180 84h70M180 102h90M180 120h60M180 138h80" className="ov-dim" /><Box x={282} y={64} w={6} h={104} /><Box x={282} y={84} w={6} h={30} fill /></>},
  'use-timeout': {call: 'useTimeout(callback, 2000)', art: <><path d="M40 130h240" /><circle cx={40} cy={130} r={5} className="ov-fill" /><path d="M40 108h200" strokeDasharray="4 3" /><path d="M40 102v12M240 102v12" /><T x={140} y={96} anchor="middle">delay</T><Box x={236} y={122} w={16} h={16} fill /></>},
  'use-toggle': {call: 'const [on, toggle] = useToggle()', art: <><Box x={50} y={90} w={90} h={36} /><circle cx={68} cy={108} r={11} className="ov-dim" /><Box x={180} y={90} w={90} h={36} fill /><circle cx={252} cy={108} r={11} fill="var(--background)" stroke="none" /><Arrow d="M148 108h24" /></>},
  'use-window-event': {call: 'useWindowEvent("resize", handler)', art: <><Box x={50} y={60} w={220} h={110} /><path d="M50 82h220" /><path d="M200 150l30-30M200 150h14M200 150v-14" stroke={A} strokeWidth={2} /><path d="M230 120h-14M230 120v14" stroke={A} strokeWidth={2} /><path d="M66 104h90M66 120h60" className="ov-dim" /></>},
};

function HookThumb({name, title}: {name: string; title: string}) {
  const h = HOOK_ART[name] ?? {call: `${title}()`, art: <Box x={110} y={80} w={100} h={60} fill />};
  return (
    <svg className="ov-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <text x={16} y={28} className="ov-text ov-call">{h.call}</text>
      <g className="ov-art">{h.art}</g>
    </svg>
  );
}

function ComponentThumb({name}: {name: string}) {
  return (
    <svg className="ov-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <foreignObject width={W} height={H}><div className="ov-stage" data-no-toc="" inert dangerouslySetInnerHTML={{__html: html[name] ?? ''}} /></foreignObject>
    </svg>
  );
}

export function Overview() {
  const groups = [...categories.map((c) => ({title: nice(c), items: inCategory(c).filter((m) => !['rich-text-editor', 'mentions'].includes(m.name))})), {title: 'hooks', items: hooks}];
  return (
    <>
      <svg width="0" height="0" className="ov-defs" aria-hidden="true" focusable="false"><defs><marker id="ov-head" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1l6 3-6 3" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs></svg>
      {groups.map((g) => (
        <section key={g.title} className="ov-group" aria-labelledby={`ov-${g.title}`}>
          <h2 id={`ov-${g.title}`} className="ov-h2">{g.title}</h2>
          <ul className="ov-grid">
            {g.items.map((m) => (
              <li key={m.name}>
                <a className="ov-card" href={href(pathOf(m))} aria-labelledby={`ovn-${m.name}`} aria-describedby={`ovd-${m.name}`}>
                  {m.category === 'hooks' ? <HookThumb name={m.name} title={m.title} /> : <ComponentThumb name={m.name} />}
                  <span className="ov-body"><span id={`ovn-${m.name}`} className="ov-name">{m.title}</span><span id={`ovd-${m.name}`} className="ov-desc">{m.description}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
