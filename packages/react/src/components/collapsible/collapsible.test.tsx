import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from './collapsible';

const ui = () => (
  <Collapsible>
    <CollapsibleTrigger>Details</CollapsibleTrigger>
    <CollapsibleContent>Hidden text</CollapsibleContent>
  </Collapsible>
);

describe('Collapsible', () => {
  it('is closed by default and toggles by click', async () => {
    const user = userEvent.setup();
    render(ui());
    const trigger = screen.getByRole('button', {name: 'Details'});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Hidden text')).not.toBeVisible(); // kept in the DOM with hidden=until-found, so Find in page reaches it
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden text')).toBeVisible();
  });
  it('toggles by keyboard', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Hidden text')).toBeVisible();
    await user.keyboard(' ');
    expect(screen.getByText('Hidden text')).not.toBeVisible(); // kept in the DOM with hidden=until-found, so Find in page reaches it
  });
  it('opens when the browser finds its text (beforematch)', async () => {
    render(ui());
    act(() => {
      screen.getByText('Hidden text').dispatchEvent(new Event('beforematch'));
    });
    await waitFor(() => expect(screen.getByRole('button', {name: 'Details'})).toHaveAttribute('aria-expanded', 'true'));
  });
  it('can start open', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Shown</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText('Shown')).toBeVisible();
  });
  it('has no axe violations', async () => {
    const {container} = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Shown</CollapsibleContent>
      </Collapsible>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
