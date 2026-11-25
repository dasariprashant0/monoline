import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from './accordion';

const ui = () => (
  <Accordion type="single" collapsible>
    <AccordionItem value="a">
      <AccordionTrigger>One</AccordionTrigger>
      <AccordionContent>Body one</AccordionContent>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionTrigger>Two</AccordionTrigger>
      <AccordionContent>Body two</AccordionContent>
    </AccordionItem>
  </Accordion>
);

describe('Accordion', () => {
  it('expands and collapses an item with aria-expanded', async () => {
    const user = userEvent.setup();
    render(ui());
    const one = screen.getByRole('button', {name: 'One'});
    expect(one).toHaveAttribute('aria-expanded', 'false');
    await user.click(one);
    expect(one).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body one')).toBeVisible();
    await user.click(one);
    expect(one).toHaveAttribute('aria-expanded', 'false');
  });
  it('single mode closes the other item', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole('button', {name: 'One'}));
    await user.click(screen.getByRole('button', {name: 'Two'}));
    expect(screen.getByRole('button', {name: 'One'})).toHaveAttribute('aria-expanded', 'false');
  });
  it('moves between triggers with arrow keys', async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', {name: 'Two'})).toHaveFocus();
  });
  it('has no axe violations', async () => {
    const {container} = render(ui());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Accordion find in page (M2)', () => {
  it('keeps closed content findable and opens on beforematch where hidden=until-found exists', async () => {
    render(ui());
    const panel = (await screen.findByText('Body one')).closest('.acc-content')!;
    expect(panel).toHaveAttribute('hidden', 'until-found');
    act(() => {
      panel.dispatchEvent(new Event('beforematch'));
    });
    await waitFor(() => expect(screen.getByRole('button', {name: 'One'})).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(panel).not.toHaveAttribute('hidden'));
  });
  it('hides the panel again when the trigger click is refused (disabled item), so the DOM matches data-state', async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a" disabled>
          <AccordionTrigger>One</AccordionTrigger>
          <AccordionContent>Body one</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const panel = (await screen.findByText('Body one')).closest('.acc-content')!;
    act(() => {
      panel.dispatchEvent(new Event('beforematch'));
      panel.removeAttribute('hidden');
    }); // the browser reveals the panel after the event
    await waitFor(() => expect(panel).toHaveAttribute('hidden', 'until-found'));
    expect(panel).toHaveAttribute('data-state', 'closed');
    expect(screen.getByRole('button', {name: 'One'})).toHaveAttribute('aria-expanded', 'false');
  });
  it('hides the panel again when a controlled accordion refuses the change', async () => {
    render(
      <Accordion type="single" collapsible value="" onValueChange={() => {}}>
        <AccordionItem value="a">
          <AccordionTrigger>One</AccordionTrigger>
          <AccordionContent>Body one</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const panel = (await screen.findByText('Body one')).closest('.acc-content')!;
    act(() => {
      panel.dispatchEvent(new Event('beforematch'));
      panel.removeAttribute('hidden');
    });
    await waitFor(() => expect(panel).toHaveAttribute('hidden', 'until-found'));
    expect(screen.getByRole('button', {name: 'One'})).toHaveAttribute('aria-expanded', 'false');
  });
  it('unmounts closed content where the browser lacks hidden=until-found (fallback)', () => {
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>,
      d = Object.getOwnPropertyDescriptor(proto, 'onbeforematch');
    delete proto.onbeforematch;
    try {
      render(ui());
      expect(screen.queryByText('Body one')).not.toBeInTheDocument();
    } finally {
      if (d) Object.defineProperty(proto, 'onbeforematch', d);
    }
  });
});
