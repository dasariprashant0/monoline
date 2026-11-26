// Monoline's design tokens: the source of truth (ADR 0014). `npm run tokens` writes packages/css/src/tokens.css,
// accents.css and options.css from this file, and every token output (JSON, Figma, .d.ts, React Native, the contrast
// check) reads it directly. Edit here, run `npm run tokens`, commit the regenerated CSS with it.
//
// The shape follows the CSS it generates. Each file is a list of items, emitted in order with a blank line between:
// {comment} a comment on its own; {selector, groups} a rule block, with an optional note printed above it; {raw} CSS
// kept as written (options.css rules that are not tokens). A group's note is printed above its tokens. A token is
// 'value' or ['value', 'note'], the note printed after it on the same line. accents.css is a table: one row of
// [--accent, --accent-text, --accent-2, --on-accent] per preset and theme; warm is the bare [data-accent] rule.
//
// References are plain CSS, var(--name). A reference to a token that is not declared here fails `tsc` (see the end
// of this file); `npm run tokens` also fails on cycles, duplicates, fallbacks and malformed var().

type Value = string | readonly [value: string, note: string];
type Group = {readonly note?: string; readonly tokens: {readonly [name: `--${string}`]: Value}};
type Block = {
  readonly note?: string;
  readonly selector: string;
  readonly groups: readonly Group[];
  readonly css?: {readonly [property: string]: string};
};
export type Item = Block | {readonly comment: string} | {readonly raw: string};
type Accent = readonly [accent: string, accentText: string, accent2: string, onAccent: string];
export type Model = {
  readonly 'tokens.css': readonly Item[];
  readonly 'accents.css': {
    readonly comment: string;
    readonly presets: {
      readonly [name: string]: {readonly warm: Accent; readonly dark: Accent; readonly midnight: Accent};
    };
  };
  readonly 'options.css': readonly Item[];
};

export const tokens = {
  'tokens.css': [
    {
      comment: `Monoline tokens: every colour, size and timing. Components never use a raw value;
if a token is missing, add it to packages/tokens/src/tokens.ts and run npm run tokens (DESIGN.md "Adding a token").

An app may override only the accent group (--accent, --accent-text,
--accent-2) in its own brand.css, per theme. Everything else is shared.`,
    },
    {
      note: '─── Theme: Warm (default, light) ───',
      selector: ':root, [data-theme="warm"]',
      groups: [
        {
          tokens: {
            '--background': '#FAFAF5',
            '--foreground': '#16120E',
            '--muted': ['#706B65', '4.9:1 on background'],
            '--border': '#E6E1D9',
            '--surface': ['#16120E', 'always-dark panel: toasts, code'],
            '--surface-text': 'rgba(250, 250, 245, 0.85)',
          },
        },
        {
          tokens: {
            '--accent': ['#FF4500', 'fills, marks, focus; not body text'],
            '--accent-text': ['#D13900', 'accent as text: 4.6:1 on background'],
            '--accent-2': '#AAFF00',
            '--on-accent': ['#16120E', 'text on an accent fill: 5.6:1'],
          },
        },
        {
          tokens: {
            '--danger': '#B3261E',
            '--warning': '#8A5300',
            '--ok': '#1F6B3A',
          },
        },
      ],
      css: {'color-scheme': 'light'},
    },
    {
      note: '─── Theme: Dark ───',
      selector: '[data-theme="dark"]',
      groups: [
        {
          tokens: {
            '--background': '#111110',
            '--foreground': '#F0EDE7',
            '--muted': '#8C8279',
            '--border': '#242220',
            '--surface': '#09090A',
            '--surface-text': 'rgba(240, 237, 231, 0.85)',
          },
        },
        {
          tokens: {
            '--accent': '#FF4500',
            '--accent-text': '#FF4500',
            '--accent-2': '#AAFF00',
            '--on-accent': '#111110',
          },
        },
        {
          tokens: {
            '--danger': '#F0847A',
            '--warning': '#E0A23A',
            '--ok': '#6FCF8E',
          },
        },
      ],
      css: {'color-scheme': 'dark'},
    },
    {
      note: '─── Theme: Midnight ───',
      selector: '[data-theme="midnight"]',
      groups: [
        {
          tokens: {
            '--background': '#060B1A',
            '--foreground': '#DDE3F5',
            '--muted': '#7680A5',
            '--border': '#0F1630',
            '--surface': '#02050F',
            '--surface-text': 'rgba(221, 227, 245, 0.85)',
          },
        },
        {
          tokens: {
            '--accent': '#AAFF00',
            '--accent-text': '#AAFF00',
            '--accent-2': '#00E5FF',
            '--on-accent': '#060B1A',
          },
        },
        {
          tokens: {
            '--danger': '#FF8A80',
            '--warning': '#FFC857',
            '--ok': '#7CE0A3',
          },
        },
      ],
      css: {'color-scheme': 'dark'},
    },
    {
      selector: ':root',
      groups: [
        {
          note: `Code colours. The code panel is always dark (--surface), so these are one set for every theme.
\`npm run check\` tests each against all three surfaces for 4.5:1.`,
          tokens: {
            '--code-keyword': '#FF9A70',
            '--code-string': '#A8E6A1',
            '--code-number': '#F5CD7A',
            '--code-comment': '#9A9EAD',
            '--code-tag': '#7FC8FF',
            '--code-attr': '#F0A8D4',
            '--code-fn': '#D6B4FF',
          },
        },
        {
          note: 'Type: Space Mono for display, DM Mono for everything else.',
          tokens: {
            '--font-display': '"Space Mono", ui-monospace, monospace',
            '--font-body': '"DM Mono", ui-monospace, monospace',
            '--text-xs': '11px',
            '--text-sm': '13px',
            '--text-base': '15px',
            '--text-lg': '18px',
          },
        },
        {
          note: 'Page headings in app content (Heading level 1 and 2, .prose h2). The 64px+ display sizes below are for heroes (.display-*).',
          tokens: {
            '--heading-1': 'clamp(32px, 4vw, 44px)',
            '--heading-2': 'clamp(26px, 3vw, 34px)',
            '--display-sm': 'clamp(28px, 3.4vw, 40px)',
            '--display-md': 'clamp(34px, 5vw, 64px)',
            '--display-xl': 'clamp(44px, 8vw, 104px)',
          },
        },
        {
          note: 'Weights: the three the bundled fonts ship (400 and 700 Space Mono, 400 and 500 DM Mono). No 600 is used.',
          tokens: {
            '--weight-regular': '400',
            '--weight-medium': '500',
            '--weight-bold': '700',
          },
        },
        {
          note: 'Line heights: tight for headings, normal for body text (the page default), relaxed for code and long form.',
          tokens: {
            '--leading-tight': '1.2',
            '--leading-normal': '1.55',
            '--leading-relaxed': '1.6',
          },
        },
        {
          note: 'Space: 4px steps.',
          tokens: {
            '--s1': '4px',
            '--s2': '8px',
            '--s3': '12px',
            '--s4': '16px',
            '--s5': '24px',
            '--s6': '32px',
            '--s7': '48px',
            '--s8': '64px',
            '--s9': '96px',
          },
        },
        {
          note: 'Shape: square. One radius for the rare round thing (a ring, a dot).',
          tokens: {
            '--radius': '0',
            '--round': '999px',
          },
        },
        {
          note: `Radius scale, derived from --radius so data-radius="soft" | "round" moves every step: square 0/0/0,
soft 3/6/9px, round 6/12/18px. --radius-md is --radius. Set data-radius on <html>: these are resolved there.`,
          tokens: {
            '--radius-sm': 'calc(var(--radius) * 0.5)',
            '--radius-md': 'var(--radius)',
            '--radius-lg': 'calc(var(--radius) * 1.5)',
          },
        },
        {
          note: 'Lines and states.',
          tokens: {
            '--border-width': '1px',
            '--opacity-disabled': '0.5',
          },
        },
        {
          note: 'Elevation. Popovers and menus are flat panels with a rule, so --shadow-popover is none (a hook for apps that want a lift). The toast floats over the page.',
          tokens: {
            '--shadow-popover': 'none',
            '--shadow-toast': '0 8px 30px -12px rgba(0, 0, 0, 0.5)',
          },
        },
        {
          note: 'Motion.',
          tokens: {
            '--ease': 'cubic-bezier(0.76, 0, 0.24, 1)',
            '--fast': '0.12s',
            '--base': '0.2s',
            '--slow': '0.45s',
          },
        },
        {
          note: 'Layout.',
          tokens: {
            '--side': ['264px', 'sidebar width'],
            '--measure': ['64ch', 'longest comfortable line'],
            '--content': ['1080px', 'widest main column'],
          },
        },
        {
          note: "Container widths (Tailwind's steps), for max-width on a centred column.",
          tokens: {
            '--container-sm': '640px',
            '--container-md': '768px',
            '--container-lg': '1024px',
            '--container-xl': '1280px',
            '--container-2xl': '1536px',
          },
        },
        {
          note: `Breakpoints, for JavaScript (matchMedia) and documentation. CSS cannot read a variable inside @media,
so a stylesheet must write the number out; these are the values to write. The built-in stylesheets still
use older widths, listed in CHANGELOG.md; do not copy them.`,
          tokens: {
            '--bp-xs': '480px',
            '--bp-sm': '640px',
            '--bp-md': '768px',
            '--bp-lg': '1024px',
            '--bp-xl': '1280px',
            '--bp-2xl': '1536px',
          },
        },
        {
          note: 'Layers.',
          tokens: {
            '--z-drawer': '40',
            '--z-grain': '50',
            '--z-toast': '60',
          },
        },
      ],
    },
    {
      comment: `─── Derived tokens ───
Each is computed from another token. A custom property resolves var() on the element that declares it and children
inherit the result, so a derived token declared only on :root would keep the <html> look inside a wrapper with its own
data-theme, data-accent or data-density. Each group is therefore declared again on exactly the elements that set its
inputs (ADR 0012); the radius scale stays on :root, since options.css re-declares it in each data-radius rule.
Override one of these in your own CSS on the same selectors, not on :root alone.`,
    },
    {
      note: 'From --foreground and --muted, which the themes set.',
      selector: ':root, [data-theme]',
      groups: [
        {
          note: `Lines: a 20% mix of the text colour. --border alone is ~1.1:1 in the
dark themes, so dividers use --rule.`,
          tokens: {
            '--rule': 'color-mix(in srgb, var(--foreground) 20%, transparent)',
          },
        },
        {
          note: 'Washes: hover rows, code blocks, selected cells.',
          tokens: {
            '--wash': 'color-mix(in srgb, var(--foreground) 4%, transparent)',
            '--wash-2': 'color-mix(in srgb, var(--foreground) 9%, transparent)',
          },
        },
        {
          note: 'Ink density: tell up to five kinds apart without new colours.',
          tokens: {
            '--ink-1': 'var(--foreground)',
            '--ink-2': 'color-mix(in srgb, var(--foreground) 70%, transparent)',
            '--ink-3': 'color-mix(in srgb, var(--foreground) 45%, transparent)',
            '--ink-4': 'color-mix(in srgb, var(--foreground) 25%, transparent)',
            '--ink-5': 'color-mix(in srgb, var(--foreground) 10%, transparent)',
            '--hatch': 'repeating-linear-gradient(135deg, var(--muted) 0 1.5px, transparent 1.5px 7px)',
          },
        },
      ],
    },
    {
      note: 'From --accent, which the themes and accents set. Add outline-offset where the control needs room (base.css uses 3px).',
      selector: ':root, [data-theme], [data-accent]',
      groups: [
        {
          note: 'Focus: the one ring.',
          tokens: {
            '--focus-ring': '2px solid var(--accent)',
          },
        },
      ],
    },
    {
      note: 'From the space steps, which data-density sets.',
      selector: ':root, [data-density]',
      groups: [
        {
          note: 'One height per size for every single-line control, so Button, Input, Select and friends line up in a form row.',
          tokens: {
            '--control-sm': 'calc(var(--s6) + var(--s1))',
            '--control-md': 'var(--s7)',
            '--control-lg': 'calc(var(--s7) + var(--s2))',
            '--window-pad': ['var(--s6)', "a small window's inset from every edge (Settings, a panel)"],
          },
        },
      ],
    },
  ],
  'accents.css': {
    comment: `Monoline accent presets. Orange is the default and lives in tokens.css.
Set one on <html data-accent="green">. Each pair passes, in all three themes:
--accent-text on --background >= 4.5:1, --accent on --background >= 3:1,
--on-accent on --accent >= 4.5:1. Load this file after tokens.css.`,
    presets: {
      orange: {
        warm: ['#FF4500', '#D13900', '#AAFF00', '#16120E'],
        dark: ['#FF4500', '#FF4500', '#AAFF00', '#111110'],
        midnight: ['#AAFF00', '#AAFF00', '#00E5FF', '#060B1A'],
      },
      green: {
        warm: ['#0E7A5F', '#0B6A52', '#E0A23A', '#FFFFFF'],
        dark: ['#45C29C', '#45C29C', '#E0A23A', '#06241C'],
        midnight: ['#5FD6B2', '#5FD6B2', '#FFC857', '#06241C'],
      },
      blue: {
        warm: ['#2563EB', '#1D4FD8', '#E0A23A', '#FFFFFF'],
        dark: ['#5B9DFF', '#5B9DFF', '#E0A23A', '#07162E'],
        midnight: ['#6FB1FF', '#6FB1FF', '#FFC857', '#06142B'],
      },
      violet: {
        warm: ['#7C3AED', '#6D28D9', '#E0A23A', '#FFFFFF'],
        dark: ['#A78BFA', '#A78BFA', '#E0A23A', '#150B33'],
        midnight: ['#B49CFF', '#B49CFF', '#FFC857', '#150B33'],
      },
      rose: {
        warm: ['#E11D48', '#BE123C', '#E0A23A', '#FFFFFF'],
        dark: ['#FB7185', '#FB7185', '#E0A23A', '#2A0710'],
        midnight: ['#FDA4AF', '#FDA4AF', '#FFC857', '#2A0710'],
      },
      teal: {
        warm: ['#0F766E', '#0F766E', '#E0A23A', '#FFFFFF'],
        dark: ['#2DD4BF', '#2DD4BF', '#E0A23A', '#04201D'],
        midnight: ['#5EEAD4', '#5EEAD4', '#FFC857', '#04201D'],
      },
      amber: {
        warm: ['#B45309', '#92400E', '#0E7A5F', '#FFFFFF'],
        dark: ['#FBBF24', '#FBBF24', '#45C29C', '#231703'],
        midnight: ['#FCD34D', '#FCD34D', '#5FD6B2', '#231703'],
      },
      slate: {
        warm: ['#334155', '#334155', '#E0A23A', '#FFFFFF'],
        dark: ['#CBD5E1', '#CBD5E1', '#E0A23A', '#0F172A'],
        midnight: ['#E2E8F0', '#E2E8F0', '#FFC857', '#0F172A'],
      },
    },
  },
  'options.css': [
    {
      comment: `Options: change the look without touching components. Set on <html>.
data-font="mono" (default) | "sans" | "serif"
data-radius="square" (default) | "soft" | "round"  (also resets the --radius-sm/md/lg scale, so it works on any wrapper)
data-density="compact" | "comfortable" (default) | "spacious"
Load after components. Fonts use system stacks, nothing extra to download.`,
    },
    {
      selector: '[data-font="sans"]',
      groups: [
        {
          tokens: {
            '--font-display':
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            '--font-body':
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        },
      ],
    },
    {
      selector: '[data-font="serif"]',
      groups: [
        {
          tokens: {
            '--font-display': 'ui-serif, Georgia, "Times New Roman", serif',
            '--font-body': 'ui-serif, Georgia, "Times New Roman", serif',
          },
        },
      ],
    },
    {
      raw: '[data-font="sans"] .display, [data-font="serif"] .display { text-transform: none; letter-spacing: -0.02em; line-height: 1.05; }',
    },
    {
      selector: '[data-radius="soft"]',
      groups: [
        {
          tokens: {
            '--radius': '6px',
            '--radius-sm': 'calc(var(--radius) * 0.5)',
            '--radius-md': 'var(--radius)',
            '--radius-lg': 'calc(var(--radius) * 1.5)',
          },
        },
      ],
    },
    {
      selector: '[data-radius="round"]',
      groups: [
        {
          tokens: {
            '--radius': '12px',
            '--radius-sm': 'calc(var(--radius) * 0.5)',
            '--radius-md': 'var(--radius)',
            '--radius-lg': 'calc(var(--radius) * 1.5)',
          },
        },
      ],
    },
    {
      raw: `/* Cards, dialogs, alerts, code blocks, empty states, segmented controls and kbd take --radius-md in their own stylesheets. Badges and tags are set here (round makes them pills); round buttons too. */
[data-radius="soft"] .badge, [data-radius="soft"] .tag,
[data-radius="round"] .badge, [data-radius="round"] .tag { border-radius: var(--radius); }
[data-radius="round"] .btn, [data-radius="round"] .badge, [data-radius="round"] .tag { border-radius: var(--round); }`,
    },
    {
      selector: '[data-density="compact"]',
      groups: [
        {
          tokens: {
            '--s2': '6px',
            '--s3': '9px',
            '--s4': '12px',
            '--s5': '18px',
            '--s6': '24px',
            '--s7': '36px',
            '--text-base': '14px',
            '--text-sm': '12px',
          },
        },
      ],
    },
    {
      selector: '[data-density="spacious"]',
      groups: [
        {
          tokens: {
            '--s2': '10px',
            '--s3': '15px',
            '--s4': '20px',
            '--s5': '30px',
            '--s6': '40px',
            '--s7': '60px',
            '--text-base': '16px',
            '--text-sm': '14px',
          },
        },
      ],
    },
  ],
} as const satisfies Model;

// Every var(--x) in the model must name a token declared in it. A misspelling fails `tsc` on the last line of this
// file, naming the bad reference (not the token that holds it): "Type 'true' does not satisfy the expected type
// '"--misspelt"'". Search the file for that name. test/reference-check.ts proves the check still fires.
type Strings<T> = T extends string
  ? T
  : T extends readonly (infer E)[]
    ? Strings<E>
    : T extends object
      ? {[K in keyof T]: Strings<T[K]>}[keyof T]
      : never;
type Names<T> = T extends string
  ? never
  : T extends readonly (infer E)[]
    ? Names<E>
    : T extends object
      ? {[K in keyof T]: (K extends `--${string}` ? K : never) | Names<T[K]>}[keyof T]
      : never;
type Refs<S> = S extends `${string}var(${infer N})${infer Rest}`
  ? (N extends `--${string}` ? N : never) | Refs<Rest>
  : never;
type Undeclared<M> = Exclude<Refs<Strings<M>>, Names<M>>;
export type ReferenceCheck<M> = [Undeclared<M>] extends [never] ? true : Undeclared<M>;
true satisfies ReferenceCheck<typeof tokens>;
