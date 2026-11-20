// First-run guides: Vite walkthrough, Next.js, copy-paste recipes and "is this for me". Code strings live in
// site/start-snippets.ts, where each one is a file that was built in a clean app (see docs/ADOPTION.md).
import {CodeBlock} from '@monoline/react';
import {Section, P, PmCode, pmInstall, href, GITHUB} from './guide-parts';
import {viteMain1, viteMain2, settings, toastDemo} from './site/start-snippets';

const PKGS = '@monoline/react @monoline/css';

/** The numbered first-run path for Vite. The generic sections that follow it live in guides.tsx. */
export const viteSteps = () => (
  <>
    <Section title="Before you start">
      <P>You need Node 20.19 or newer and a package manager. This path takes about ten minutes and ends with a themed page, a dark-mode toggle and a dialog. It was run from an empty folder against the published 0.4.0 packages; the other package managers use the same commands in their own syntax.</P>
    </Section>
    <Section title="1. Create a Vite app">
      <PmCode cmds={{
        npm: 'npm create vite@latest my-app -- --template react-ts\ncd my-app\nnpm install',
        pnpm: 'pnpm create vite my-app --template react-ts\ncd my-app\npnpm install',
        yarn: 'yarn create vite my-app --template react-ts\ncd my-app\nyarn install',
        bun: 'bun create vite my-app --template react-ts\ncd my-app\nbun install',
      }} />
    </Section>
    <Section title="2. Install Monoline">
      <PmCode cmds={pmInstall(PKGS)} />
      <P>Two packages: <code>@monoline/css</code> is the plain CSS and <code>@monoline/react</code> the components. React 18 or newer is a peer dependency, and a fresh Vite app already has it. The install should finish with no peer-dependency warning.</P>
    </Section>
    <Section title="3. Render a button">
      <P>The Vite template ships its own colours and layout in <code>index.css</code> and <code>App.css</code>, which fight with Monoline. Delete both, then replace <code>src/main.tsx</code>.</P>
      <CodeBlock title="bash" code="rm src/App.tsx src/App.css src/index.css" />
      <CodeBlock title="src/main.tsx" code={viteMain1} />
      <P>Run <code>npm run dev</code> and open the address it prints. You get a styled Save button; there is no provider to add. <code>core.css</code> holds the tokens, themes and base styles and is always needed. Each component has one small CSS file you import beside it. If a component looks unstyled, its CSS file is the one that is missing. While you are exploring you can replace all the CSS lines with <code>import '@monoline/css'</code>, which loads everything (about 18 KB gzip).</P>
    </Section>
    <Section title="4. Pick a look">
      <P>Theme, accent, font, corners and density are attributes on <code>&lt;html&gt;</code>. Edit <code>index.html</code> and the page re-themes, no code change:</P>
      <CodeBlock title="index.html" code={'<html lang="en" data-theme="midnight" data-accent="teal" data-radius="soft">'} />
      <P>Values are listed in <a href={href('docs/theming')}>Theming</a>. The <a href={href('docs/tools/theme-builder')}>theme builder</a> lets you try them and copy the result.</P>
    </Section>
    <Section title="5. Dark mode and a dialog">
      <P><code>ThemeProvider</code> sets those attributes for you, saves the visitor's choice and, until they choose, follows the system light or dark setting. <code>useTheme()</code> reads and changes it. Remove the <code>data-theme</code> and <code>data-accent</code> attributes you added in step 4, because the provider now owns them. The dialog is the native <code>&lt;dialog&gt;</code> element: Escape closes it, focus returns to the button that opened it and the page behind cannot be reached.</P>
      <CodeBlock title="src/main.tsx" code={viteMain2} />
    </Section>
    <Section title="6. Check it">
      <P>Click <em>Dark mode</em>: the whole page switches without a reload. Open the dialog, press Escape, and check that focus is back on <em>Delete project</em>. Then run <code>npm run build</code>. A Button-only app measured 69.4 KB of JavaScript gzip in total, 0.8 KB more than an empty React page, plus 3.9 KB of CSS.</P>
    </Section>
    <Section title="Next steps">
      <P>Browse the <a href={href('docs/guides/recipes')}>copy-paste recipes</a>, use Monoline in <a href={href('docs/frameworks/nextjs')}>Next.js</a>, or open any component page for its examples, props and keyboard behaviour. Not sure Monoline fits? Read <a href={href('docs/guides/choosing')}>Is Monoline for you?</a>.</P>
    </Section>
  </>
);

export const recipes = () => (
  <>
    <Section title="How to use these">
      <P>Each recipe is one file. It was built and clicked through in a Vite app set up as in <a href={href('docs/getting-started')}>Getting started</a>. The imports at the top list every CSS file the recipe needs, so it renders styled when pasted. Add <code>core.css</code> once in your entry file.</P>
    </Section>
    <Section title="Confirm dialog">
      <P>The dialog from <a href={href('docs/getting-started')}>Getting started</a>, step 5, is the pattern: <code>DialogTrigger asChild</code> around a Button, and <code>DialogClose asChild</code> around the cancel button. Title and description are required, which is what names the dialog for screen readers.</P>
    </Section>
    <Section title="Settings card with a form">
      <CodeBlock title="Settings.tsx" code={settings} />
      <P><code>Field</code> needs a <code>label</code>, so every input has a name. The <code>flow</code> class spaces the children of a plain container; see Spacing between blocks in Getting started. For validation, error summaries and react-hook-form, read <a href={href('docs/guides/forms')}>Forms and validation</a>.</P>
    </Section>
    <Section title="Toast">
      <CodeBlock title="ToastDemo.tsx" code={toastDemo} />
      <P>Render one <code>ToastProvider</code> near the root of the part of the page that triggers toasts. The viewport is a labelled region that screen readers announce.</P>
    </Section>
    <Section title="Ask your AI tool">
      <P>Point the tool at the generated index and the rules file, then ask for the page. It then picks real components and props instead of guessing.</P>
      <CodeBlock title="prompt" code={'Read AGENTS.md and llms.txt from the Monoline repo (github.com/dasariprashant0/monoline).\nBuild a billing settings page with @monoline/react: a Card with a Field and Input for the\ncompany name, a Switch for invoice emails and a solid Button. Import each component\'s CSS\nfrom @monoline/css/components/<name>.css and use tokens, never raw colours.'} />
      <P>More about the files an assistant can read: <a href={href('docs/tools/for-ai-tools')}>For AI tools</a>.</P>
    </Section>
  </>
);

export const choosing = () => (
  <>
    <Section title="Pick Monoline if">
      <dl className="kv">
        <dt>You want plain CSS</dt><dd>No Tailwind, no runtime CSS-in-JS, no required provider. One CSS import and class names you can read.</dd>
        <dt>You want one look you can change</dt><dd>Three themes, eight accents, three fonts, three corner styles and three densities, each one attribute on <code>&lt;html&gt;</code>, with contrast checked for every pairing.</dd>
        <dt>You want small output</dt><dd>One Button is under 1 KB of JavaScript gzip on top of React, and CSS can be loaded per component. See <a href={href(''docs/tools/compare'')}>Compare</a> for measured numbers.</dd>
        <dt>You want to own the code or use AI tools</dt><dd>Install the packages, or copy source with the CLI. Every component has a <code>meta.json</code>, and <code>llms.txt</code> and a JSON registry describe them all.</dd>
      </dl>
    </Section>
    <Section title="Pick something else if">
      <dl className="kv">
        <dt>You need a stable 1.0 today</dt><dd>Monoline is 0.x. Minor releases can rename classes or props, and each change is in the <a href={href(''docs/tools/changelog'')}>changelog</a>. Pin an exact version in production.</dd>
        <dt>You use Tailwind everywhere</dt><dd>shadcn/ui fits that workflow better; Monoline's classes do not use Tailwind's utilities.</dd>
        <dt>You build React Native or Vue</dt><dd>The components are React only. The CSS works anywhere, but the behaviour does not come with it.</dd>
        <dt>You need proof from assistive technology</dt><dd>Every component has axe and keyboard tests and is audited in a real browser. No human screen-reader test has been run yet; the <a href={href('docs/guides/accessibility')}>accessibility page</a> says what is not covered.</dd>
        <dt>You need a large community</dt><dd>The project is new and has few users. Questions and bugs go to <a href={`${GITHUB}/issues`}>GitHub issues</a>.</dd>
      </dl>
    </Section>
    <Section title="Where the numbers come from">
      <P>Sizes are measured with <code>npm run size</code>. Install steps were run from a clean folder against the published packages; the log is in <a href={`${GITHUB}/blob/master/docs/ADOPTION.md`}>docs/ADOPTION.md</a>.</P>
    </Section>
  </>
);
