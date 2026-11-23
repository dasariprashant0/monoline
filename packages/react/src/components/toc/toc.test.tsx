import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createRef} from 'react';
import {axe} from '../../test/axe';
import {Toc} from './toc';

type Cb = (entries: unknown[]) => void;
let fire: Cb = () => {};
let observed: string[] = [];
class IOStub {
  constructor(cb: Cb) { fire = cb; }
  observe(el: Element) { observed.push(el.id); }
  disconnect() {}
  unobserve() {}
}

const items = [{id: 'a', text: 'Alpha'}, {id: 'b', text: 'Beta', level: 3}, {id: 'c', text: 'Gamma'}];
const Page = () => <>{items.map((i) => <h2 key={i.id} id={i.id}>{i.text}</h2>)}<Toc items={items} /></>;

beforeEach(() => { observed = []; vi.stubGlobal('IntersectionObserver', IOStub); });
afterEach(() => vi.unstubAllGlobals());

describe('Toc', () => {
  it('is a named navigation landmark with a link per item', () => {
    render(<Toc items={items} />);
    expect(screen.getByRole('navigation', {name: 'On this page'})).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#a', '#b', '#c']);
    expect(screen.getByText('Beta').closest('li')).toHaveAttribute('data-level', '3');
  });
  it('allows renaming the landmark and hiding the heading', () => {
    render(<Toc items={items} heading={null} aria-label="Sections" />);
    expect(screen.getByRole('navigation', {name: 'Sections'})).toBeInTheDocument();
    expect(screen.queryByText('On this page')).not.toBeInTheDocument();
  });
  it('renders nothing without entries', () => {
    const {container} = render(<Toc items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('builds entries from headings with an id inside a container', () => {
    const ref = createRef<HTMLDivElement>();
    const {rerender} = render(<div ref={ref}><h2 id="x">One</h2><h3 id="y">Two</h3><h2>No id</h2><h4 id="z">Deep</h4><div data-no-toc><h2 id="w">Skip</h2></div></div>);
    rerender(<><div ref={ref}><h2 id="x">One</h2><h3 id="y">Two</h3><h2>No id</h2><h4 id="z">Deep</h4><div data-no-toc><h2 id="w">Skip</h2></div></div><Toc container={ref} /></>);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['One', 'Two']);
  });
  it('still lists headings when the container itself sits inside a data-no-toc element', () => {
    const ref = createRef<HTMLDivElement>();
    const ui = <div data-no-toc><div ref={ref}><h2 id="x">One</h2></div></div>;
    const {rerender} = render(ui);
    rerender(<>{ui}<Toc container={ref} /></>);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['One']);
  });
  it('marks the last heading scrolled past the offset with aria-current=location', () => {
    const tops: Record<string, number> = {a: -300, b: -10, c: 400};
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { return {top: tops[this.id] ?? 0} as DOMRect; });
    render(<Page />);
    expect(screen.getByRole('link', {current: 'location'})).toHaveTextContent('Beta');
    tops.c = 50;
    act(() => fire([]));
    expect(screen.getByRole('link', {current: 'location'})).toHaveTextContent('Gamma');
    tops.a = tops.b = tops.c = 400;
    act(() => fire([]));
    expect(screen.queryByRole('link', {current: 'location'})).not.toBeInTheDocument();
    spy.mockRestore();
  });
  it('is reachable and operable by keyboard', async () => {
    render(<Page />);
    await userEvent.tab();
    expect(screen.getByRole('link', {name: 'Alpha'})).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(location.hash).toBe('#b');
  });
  it('forwards ref and className', () => {
    const ref = createRef<HTMLElement>();
    render(<Toc ref={ref} items={items} className="x" />);
    expect(ref.current).toBe(screen.getByRole('navigation'));
    expect(ref.current).toHaveClass('toc', 'x');
  });
  it('has no axe violations', async () => {
    const {container} = render(<Page />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
