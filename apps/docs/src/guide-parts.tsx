import type {ReactNode} from 'react';
import {CodeBlock, Tabs, TabsContent, TabsList, TabsTrigger, useLocalStorage} from '@monoline/react';

export const Section = ({title, children}: {title: string; children: ReactNode}) => (
  <section className="block"><h2 className="cdoc-h2">{title}</h2>{children}</section>
);
export const P = ({children}: {children: ReactNode}) => <p className="prose">{children}</p>;

/** Install commands for one or more packages, per package manager. */
export const pmInstall = (pkgs: string): Record<string, string> => ({
  npm: `npm install ${pkgs}`,
  pnpm: `pnpm add ${pkgs}`,
  yarn: `yarn add ${pkgs}`,
  bun: `bun add ${pkgs}`,
});

/** A command in npm, pnpm, yarn and bun tabs. The choice is remembered across guides and the home page. */
export function PmCode({cmds, label = 'Package manager'}: {cmds: Record<string, string>; label?: string}) {
  const [pm, setPm] = useLocalStorage('monoline-pm', 'npm');
  const current = pm in cmds ? pm : 'npm';
  return (
    <Tabs value={current} onValueChange={setPm}>
      <TabsList aria-label={label}>{Object.keys(cmds).map((k) => <TabsTrigger key={k} value={k}>{k}</TabsTrigger>)}</TabsList>
      {Object.entries(cmds).map(([k, cmd]) => <TabsContent key={k} value={k} style={{minWidth: 0}}><CodeBlock title="bash" code={cmd} /></TabsContent>)}
    </Tabs>
  );
}

// Same result as shell/router's href, copied here because router imports the registry, which imports the guides.
export const href = (path: string) => import.meta.env.BASE_URL.replace(/\/?$/, '/') + path;
export const GITHUB = 'https://github.com/dasariprashant0/monoline';
