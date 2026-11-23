import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger} from './context-menu';

const ui = (fn = () => {}) => (
  <ContextMenu>
    <ContextMenuTrigger>Right click here</ContextMenuTrigger>
    <ContextMenuContent><ContextMenuItem onSelect={fn}>Rename</ContextMenuItem><ContextMenuSeparator /><ContextMenuItem tone="danger">Delete</ContextMenuItem></ContextMenuContent>
  </ContextMenu>
);

// jsdom's PointerEvent has no pointerType, so build touch pointer events from a MouseEvent.
const touch = (el: Element, type: string, x: number, y: number) => {
  const e = new MouseEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y});
  Object.defineProperty(e, 'pointerType', {value: 'touch'});
  fireEvent(el, e);
};

describe('ContextMenu', () => {
  it('opens on right click as a menu', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Right click here')});
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });
  it('opens from the keyboard context-menu event when the trigger is focusable (e2e F7)', async () => {
    const user = userEvent.setup();
    render(<ContextMenu><ContextMenuTrigger asChild><button>Area</button></ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Rename</ContextMenuItem></ContextMenuContent></ContextMenu>);
    await user.tab();
    expect(screen.getByRole('button', {name: 'Area'})).toHaveFocus();
    fireEvent.contextMenu(screen.getByRole('button', {name: 'Area'}));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });
  it('runs an item and closes', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(ui(fn));
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Right click here')});
    await user.click(await screen.findByRole('menuitem', {name: 'Rename'}));
    expect(fn).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Right click here')});
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Right click here')});
    await screen.findByRole('menu');
    expect(await axe(document.body)).toHaveNoViolations();
  });
  it('makes the default trigger focusable so keyboard users can reach it', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    expect(screen.getByText('Right click here')).toHaveFocus();
  });
  it('cancels the touch long-press when the browser takes over the gesture', () => {
    vi.useFakeTimers();
    render(ui());
    const area = screen.getByText('Right click here');
    touch(area, 'pointerdown', 5, 5);
    touch(area, 'pointercancel', 5, 5);
    vi.advanceTimersByTime(800);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
  it('keeps a touch long-press alive through small finger jitter', async () => {
    vi.useFakeTimers();
    render(ui());
    const area = screen.getByText('Right click here');
    touch(area, 'pointerdown', 5, 5);
    touch(area, 'pointermove', 7, 6);
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    vi.useRealTimers();
  });
  it('opens after a long touch press, and not when the finger moved far', async () => {
    vi.useFakeTimers();
    render(ui());
    const area = screen.getByText('Right click here');
    touch(area, 'pointerdown', 5, 5);
    touch(area, 'pointermove', 60, 5);
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
  it('gives the menu an accessible name, which the consumer can replace', async () => {
    const user = userEvent.setup();
    const {unmount} = render(ui());
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Right click here')});
    expect(await screen.findByRole('menu', {name: 'Menu'})).toBeInTheDocument();
    unmount();
    render(<ContextMenu><ContextMenuTrigger>Area</ContextMenuTrigger><ContextMenuContent aria-label="File actions"><ContextMenuItem>Rename</ContextMenuItem></ContextMenuContent></ContextMenu>);
    await user.pointer({keys: '[MouseRight]', target: screen.getByText('Area')});
    expect(await screen.findByRole('menu', {name: 'File actions'})).toBeInTheDocument();
  });
});
