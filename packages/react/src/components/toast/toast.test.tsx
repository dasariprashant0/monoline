import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe} from '../../test/axe';
import {useState} from 'react';
import {Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport} from './toast';

function Demo({onUndo = () => {}}: {onUndo?: () => void}) {
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider duration={60000}>
      <button onClick={() => setOpen(true)}>Save</button>
      <Toast open={open} onOpenChange={setOpen}>
        <ToastTitle>Saved</ToastTitle>
        <ToastDescription>Draft stored.</ToastDescription>
        <ToastAction altText="Undo the save" onClick={onUndo}>
          Undo
        </ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport label="Notifications" />
    </ToastProvider>
  );
}

describe('Toast', () => {
  it('shows when opened and announces its content', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Draft stored.')).toBeInTheDocument();
    expect(screen.getByRole('region', {name: /notifications/i})).toBeInTheDocument();
  });
  it('dismisses with the close button', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole('button', {name: 'Save'}));
    await user.click(await screen.findByRole('button', {name: 'Dismiss'}));
    expect(screen.queryByText('Draft stored.')).not.toBeInTheDocument();
  });
  it('runs the action', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<Demo onUndo={fn} />);
    await user.click(screen.getByRole('button', {name: 'Save'}));
    await user.click(await screen.findByRole('button', {name: 'Undo'}));
    expect(fn).toHaveBeenCalled();
  });
  it('leaves no silent focus proxies in the Tab order, and Tab still reaches the toast buttons (a11y-report open finding)', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole('button', {name: 'Save'}));
    await screen.findByText('Draft stored.');
    const region = screen.getByRole('region', {name: /notifications/i});
    await waitFor(() => expect(region.querySelectorAll(':scope > [tabindex="0"]')).toHaveLength(0));
    expect(region.querySelectorAll(':scope > span[tabindex="-1"]').length).toBe(2);
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      await user.tab();
      seen.add(document.activeElement?.textContent ?? '');
    }
    expect(seen.has('Undo') && seen.has('Dismiss')).toBe(true);
  });
  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole('button', {name: 'Save'}));
    await screen.findByText('Draft stored.');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
