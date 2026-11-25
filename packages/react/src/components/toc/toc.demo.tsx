import {useRef} from 'react';
import type {Demo} from '../../demo';
import {Toc} from './toc';

function Article() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 14rem', gap: 'var(--s5)'}}>
      <div ref={ref}>
        <h2 id="toc-demo-intro">Introduction</h2>
        <p>The list on the right is built from the headings in this column.</p>
        <h3 id="toc-demo-install">Install</h3>
        <p>Nested levels are indented.</p>
        <h2 id="toc-demo-usage">Usage</h2>
        <p>The heading being read gets aria-current.</p>
      </div>
      <Toc container={ref} />
    </div>
  );
}

export const demos: Demo[] = [
  {
    title: 'From the page headings',
    description: 'Pass a ref to the element that holds the headings. Only headings with an id are listed.',
    render: () => <Article />,
  },
  {
    title: 'From data',
    description: 'Pass `items` when you already know the headings. `heading={null}` hides the visible title.',
    render: () => (
      <Toc
        items={[
          {id: 'toc-demo-intro', text: 'Introduction'},
          {id: 'toc-demo-install', text: 'Install', level: 3},
          {id: 'toc-demo-usage', text: 'Usage'},
        ]}
        heading={null}
        aria-label="Sections"
      />
    ),
  },
];
