import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Field} from './components/field';
import {Input} from './components/input';
import {Textarea} from './components/textarea';
import {TagsInput} from './components/tags-input';
import {Combobox} from './components/combobox';
import {Command} from './components/command';
import {Button} from './components/button';
import {Rating} from './components/rating';
import {PasswordInput} from './components/password-input';

describe('Field keeps its wiring when the control has its own id or aria-describedby', () => {
  it("Input: label still resolves and hint ids are joined with the caller's", () => {
    render(
      <Field label="Email" hint="We never share it.">
        <Input id="mine" aria-describedby="extra" />
      </Field>,
    );
    const i = screen.getByLabelText('Email');
    expect(i).toBe(screen.getByRole('textbox'));
    expect(i.getAttribute('aria-describedby')).toMatch(/-hint extra$/);
  });
  it('Textarea: same', () => {
    render(
      <Field label="Bio" error="Too long">
        <Textarea aria-describedby="extra" />
      </Field>,
    );
    expect(screen.getByLabelText('Bio').getAttribute('aria-describedby')).toMatch(/-error extra$/);
  });
});

describe('Enter while composing text (IME) does not commit', () => {
  it('TagsInput', () => {
    const change = vi.fn();
    render(<TagsInput aria-label="t" onValueChange={change} />);
    const i = screen.getByLabelText('t');
    fireEvent.change(i, {target: {value: 'に'}});
    fireEvent.keyDown(i, {key: 'Enter', isComposing: true});
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(i, {key: 'Enter'});
    expect(change).toHaveBeenCalledWith(['に']);
  });
  it('Combobox', () => {
    const change = vi.fn();
    render(<Combobox aria-label="c" onValueChange={change} options={[{value: 'a', label: 'Apple'}]} />);
    const i = screen.getByLabelText('c');
    fireEvent.click(i);
    fireEvent.keyDown(i, {key: 'Enter', isComposing: true});
    expect(change).not.toHaveBeenCalled();
  });
});

describe('Command plain-key shortcut', () => {
  it('does not open or swallow the key while typing in a field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="name" />
        <Command shortcut="/" items={[{id: 'a', label: 'A'}]} />
      </>,
    );
    await user.click(screen.getByLabelText('name'));
    await user.keyboard('a/b');
    expect(screen.getByLabelText('name')).toHaveValue('a/b');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('still opens from the page body', async () => {
    const user = userEvent.setup();
    render(<Command shortcut="/" items={[{id: 'a', label: 'A'}]} />);
    await user.keyboard('/');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Button, Link, Rating, PasswordInput, NumberInput', () => {
  it('Button asChild + disabled blocks the link', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <Button asChild disabled onClick={click}>
        <a href="#x">Go</a>
      </Button>,
    );
    const a = screen.getByRole('link', {name: 'Go'});
    expect(a).toHaveAttribute('aria-disabled', 'true');
    expect(a).toHaveAttribute('tabindex', '-1');
    await user.click(a);
    expect(click).not.toHaveBeenCalled();
  });
  it('Rating clearable resets to 0 on the chosen star', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Rating aria-label="r" clearable defaultValue={3} onValueChange={change} />);
    await user.click(screen.getByLabelText('3 of 5'));
    expect(change).toHaveBeenLastCalledWith(0);
  });
  it('PasswordInput takes labels and disables its toggle with the input', () => {
    render(
      <PasswordInput aria-label="p" disabled labels={{show: 'Zeigen', hide: 'Verbergen', password: 'Passwort'}} />,
    );
    expect(screen.getByRole('button', {name: 'Zeigen Passwort'})).toBeDisabled();
  });
});

describe('Toaster overflow and Tour announcement', () => {
  it('toasts pushed past the limit are dismissed and do not come back', async () => {
    const {act} = await import('@testing-library/react');
    const {Toaster, toast} = await import('./components/toaster');
    vi.useFakeTimers();
    render(<Toaster limit={2} />);
    let ids: Array<string | number> = [];
    act(() => {
      ids = [toast('one'), toast('two'), toast('three')];
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByText('one')).toBeNull();
    act(() => {
      toast.dismiss(ids[2]);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByText('one')).toBeNull();
    act(() => {
      toast.dismiss();
      vi.advanceTimersByTime(400);
    });
    vi.useRealTimers();
  });
  it('Tour does not announce an empty title for a non-string title', async () => {
    const {Tour} = await import('./components/tour');
    render(<Tour defaultOpen steps={[{title: <b>Hi</b>}]} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^Step 1 of 1$/);
  });
});
