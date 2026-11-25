import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {nativeHeight} from './float';
import {Popover, PopoverContent, PopoverTrigger} from './popover';

const ui = () => (
  <Popover>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent aria-label="Details">Content</PopoverContent>
  </Popover>
);

describe('Popover', () => {
  it('opens and closes with the trigger', async () => {
    const user = userEvent.setup();
    render(ui());
    const trigger = screen.getByRole('button', {name: 'Open'});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(await screen.findByRole('dialog', {name: 'Details'})).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
  it('Tab from the last control closes it and continues after the trigger, Shift+Tab goes before it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Details">
            <button>Inside</button>
          </PopoverContent>
        </Popover>
        <button>After</button>
      </>,
    );
    await user.click(screen.getByRole('button', {name: 'Open'}));
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', {name: 'Inside'})).toHaveFocus();
    await user.tab();
    await vi.waitFor(() => expect(screen.getByRole('button', {name: 'After'})).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Open'}));
    await screen.findByRole('dialog');
    await user.tab({shift: true});
    await vi.waitFor(() => expect(screen.getByRole('button', {name: 'Before'})).toHaveFocus());
  });
  it('closes on Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(ui());
    const trigger = screen.getByRole('button', {name: 'Open'});
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole('button', {name: 'Open'}));
    expect(await axe(await screen.findByRole('dialog'))).toHaveNoViolations();
  });
});

describe('Popover native anchor positioning (M1)', () => {
  const supports = CSS.supports;
  afterEach(() => {
    CSS.supports = supports;
    delete document.documentElement.dataset.anchor;
  });
  it('uses position-area and anchor-name when opted in and the browser has them, and no pixel placement', async () => {
    CSS.supports = () => true;
    document.documentElement.dataset.anchor = 'native';
    const user = userEvent.setup();
    render(ui());
    const trigger = screen.getByRole('button', {name: 'Open'});
    await user.click(trigger);
    const panel = await screen.findByRole('dialog', {name: 'Details'});
    expect(panel.style.getPropertyValue('position-area')).toBe('bottom span-right');
    expect(panel.style.getPropertyValue('position-anchor')).toBe(trigger.style.getPropertyValue('anchor-name'));
    expect(panel.style.left).toBe('');
    // collision padding only on the viewport-facing edges, never on the anchor-facing one
    expect(panel.style.marginBottom).toBe('8px');
    expect(panel.style.marginRight).toBe('8px');
    expect(panel.style.marginLeft).toBe('0px');
    expect(panel.dataset.side).toBe('bottom');
    await user.keyboard('{Escape}');
    expect(trigger.style.getPropertyValue('anchor-name')).toBe('');
  });
  it('stays on pixel placement by default even when the browser supports it', async () => {
    CSS.supports = () => true;
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole('button', {name: 'Open'}));
    const panel = await screen.findByRole('dialog', {name: 'Details'});
    expect(panel.style.left).toMatch(/px$/);
    expect(panel.style.getPropertyValue('position-area')).toBe('');
  });
  it('falls back to pixel placement without it', async () => {
    document.documentElement.dataset.anchor = 'native';
    CSS.supports = () => false;
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole('button', {name: 'Open'}));
    const panel = await screen.findByRole('dialog', {name: 'Details'});
    expect(panel.style.left).toMatch(/px$/);
    expect(panel.style.getPropertyValue('position-area')).toBe('');
  });
});

describe('native anchor-name and margins', () => {
  const supports = CSS.supports;
  beforeEach(() => {
    CSS.supports = () => true;
    document.documentElement.dataset.anchor = 'native';
  });
  afterEach(() => {
    CSS.supports = supports;
    delete document.documentElement.dataset.anchor;
  });
  it("two layers on one anchor keep each other's anchor-name; cleanup removes only its own", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="A">A</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole('button', {name: 'Open'});
    trigger.style.setProperty('anchor-name', '--other');
    await user.click(trigger);
    const panel = await screen.findByRole('dialog', {name: 'A'});
    const names = trigger.style
      .getPropertyValue('anchor-name')
      .split(',')
      .map((n) => n.trim());
    expect(names).toHaveLength(2);
    expect(names).toContain('--other');
    expect(panel.style.getPropertyValue('position-anchor')).toBe(names.find((n) => n !== '--other'));
    await user.keyboard('{Escape}');
    expect(trigger.style.getPropertyValue('anchor-name')).toBe('--other');
  });
  it('center alignment sets no bogus margin-r', async () => {
    const set = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty');
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="A" align="center">
          A
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole('button', {name: 'Open'}));
    const panel = await screen.findByRole('dialog', {name: 'A'});
    expect(set.mock.calls.map((c) => c[0]).filter((n) => /^margin-/.test(n))).not.toContain('margin-r');
    set.mockRestore();
    expect(panel.style.marginBottom).toBe('8px');
  });
});

describe('nativeHeight (native --available-height)', () => {
  const root = {clientHeight: 800} as HTMLElement;
  const rect = (top: number, bottom: number) => ({top, bottom}) as DOMRect;
  it('uses the larger of the two sides, minus offset and padding, so a too-tall panel flips instead of shrinking', () => {
    expect(nativeHeight(rect(700, 740), root, 'bottom', 4, 8)).toBe(700 - 4 - 8); // little room below, more above
    expect(nativeHeight(rect(100, 140), root, 'bottom', 4, 8)).toBe(660 - 4 - 8); // more room below
    expect(nativeHeight(rect(700, 740), root, 'top', 4, 8)).toBe(700 - 4 - 8);
  });
  it('is the viewport minus both paddings for left and right', () => {
    expect(nativeHeight(rect(700, 740), root, 'right', 4, 8)).toBe(800 - 16);
    expect(nativeHeight(rect(0, 10), root, 'left', 0, 8)).toBe(784);
  });
  it('never goes negative', () => {
    expect(nativeHeight(rect(2, 798), root, 'bottom', 4, 8)).toBe(0);
  });
  it('is set as a px value on the native panel, not 100%', async () => {
    CSS.supports = () => true;
    document.documentElement.dataset.anchor = 'native';
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole('button', {name: 'Open'}));
    expect((await screen.findByRole('dialog')).style.getPropertyValue('--available-height')).toMatch(/^\d+(\.\d+)?px$/);
  });
  afterEach(() => {
    delete document.documentElement.dataset.anchor;
  });
});
