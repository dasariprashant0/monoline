// "On this page": the library Toc inside the docs rail, plus an optional facts box under it (component pages).
import type {ReactNode} from 'react';
import {Toc as OnThisPage} from '@monoline/react';
import type {Heading} from './headings';

export function Toc({headings, extra}: {headings: Heading[]; extra?: ReactNode}) {
  return (
    <aside className="docs-rail">
      <OnThisPage items={headings} offset={140} />
      {extra}
    </aside>
  );
}
