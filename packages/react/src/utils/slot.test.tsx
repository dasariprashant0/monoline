import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createRef} from 'react';
import {Slot} from './slot';

describe('Slot', () => {
  it('merges className, style and composes refs', () => {
    const outer = createRef<HTMLElement>(), inner = createRef<HTMLButtonElement>();
    render(<Slot ref={outer} className="a" style={{color: 'red'}}><button ref={inner} className="b" style={{margin: 1}}>x</button></Slot>);
    const b = screen.getByRole('button');
    expect(b).toHaveClass('a', 'b');
    expect(outer.current).toBe(b);
    expect(inner.current).toBe(b);
  });
  it('runs the child handler first and skips the Slot handler when the child prevents default', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const {rerender} = render(<Slot onClick={() => order.push('slot')}><button onClick={() => order.push('child')}>x</button></Slot>);
    await user.click(screen.getByRole('button'));
    expect(order).toEqual(['child', 'slot']);
    order.length = 0;
    rerender(<Slot onClick={() => order.push('slot')}><button onClick={(e) => { order.push('child'); e.preventDefault(); }}>x</button></Slot>);
    await user.click(screen.getByRole('button'));
    expect(order).toEqual(['child']);
  });
  it('lets the Slot own aria-* and data-state, the child own everything else', () => {
    render(<Slot aria-expanded="true" data-state="open" title="slot"><button aria-expanded="false" data-state="closed" title="child">x</button></Slot>);
    const b = screen.getByRole('button');
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(b).toHaveAttribute('data-state', 'open');
    expect(b).toHaveAttribute("title", "child");
  });
  it('warns and renders nothing for a non-element child', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const {container} = render(<Slot>just text</Slot>);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
