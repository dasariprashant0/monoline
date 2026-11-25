import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {Tooltip, TooltipProvider} from './tooltip';

const ui = () => (
  <TooltipProvider delayDuration={0}>
    <Tooltip content="Saved to notes">
      <button>Save</button>
    </Tooltip>
  </TooltipProvider>
);

describe('Tooltip', () => {
  it('shows on hover', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.hover(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Saved to notes');
  });
  it('shows on keyboard focus and hides on Escape', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('stays open when scrolling brings the focused trigger into view, closes on scroll otherwise (e2e F7)', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    await screen.findByRole('tooltip');
    act(() => {
      fireEvent.scroll(document);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    (document.activeElement as HTMLElement).blur();
    await user.hover(screen.getByRole('button', {name: 'Save'}));
    await screen.findByRole('tooltip');
    act(() => {
      fireEvent.scroll(document);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('closes on scroll when a hover opened it on a click-focused trigger', async () => {
    const user = userEvent.setup();
    render(ui());
    const save = screen.getByRole('button', {name: 'Save'});
    await user.click(save); // focuses the trigger with the pointer, not the keyboard
    expect(save).toHaveFocus();
    await user.unhover(save);
    await user.hover(save);
    await screen.findByRole('tooltip');
    act(() => {
      fireEvent.scroll(document);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('describes its trigger while open', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    await screen.findByRole('tooltip');
    expect(screen.getByRole('button', {name: 'Save'})).toHaveAccessibleDescription('Saved to notes');
  });
  it('has no axe violations', async () => {
    const {container} = render(ui());
    expect(await axe(container)).toHaveNoViolations();
  });
});
