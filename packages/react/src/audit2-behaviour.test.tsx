import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Field} from './components/field';
import {Input} from './components/input';
import {Textarea} from './components/textarea';
import {TagsInput} from './components/tags-input';
import {Combobox} from './components/combobox';
import {Command} from './components/command';

describe('Field keeps its wiring when the control has its own id or aria-describedby', () => {
  it('Input: label still resolves and hint ids are joined with the caller\'s', () => {
    render(<Field label="Email" hint="We never share it."><Input id="mine" aria-describedby="extra" /></Field>);
    const i = screen.getByLabelText('Email');
    expect(i).toBe(screen.getByRole('textbox'));
    expect(i.getAttribute('aria-describedby')).toMatch(/-hint extra$/);
  });
  it('Textarea: same', () => {
    render(<Field label="Bio" error="Too long"><Textarea aria-describedby="extra" /></Field>);
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
    render(<><input aria-label="name" /><Command shortcut="/" items={[{id: 'a', label: 'A'}]} /></>);
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
