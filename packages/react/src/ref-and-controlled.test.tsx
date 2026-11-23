import {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button} from './components/button';
import {IconButton} from './components/icon-button';
import {Tag} from './components/tag';
import {Textarea} from './components/textarea';
import {NativeSelect} from './components/native-select';
import {Checkbox} from './components/checkbox';
import {Switch} from './components/switch';
import {Rating} from './components/rating';
import {OtpInput} from './components/otp-input';
import {Combobox} from './components/combobox';
import {Tour} from './components/tour';
import {Command} from './components/command';
import {Card} from './components/card';
import {Calendar} from './components/calendar';
import {Slider} from './components/slider';
import {SegmentedControl} from './components/segmented-control';

const cases: Array<[string, (ref: React.Ref<never>) => React.ReactElement]> = [
  ['Button', (ref) => <Button ref={ref as never}>x</Button>],
  ['IconButton', (ref) => <IconButton ref={ref as never} aria-label="x">x</IconButton>],
  ['Tag', (ref) => <Tag ref={ref as never}>x</Tag>],
  ['Textarea', (ref) => <Textarea ref={ref as never} aria-label="x" />],
  ['NativeSelect', (ref) => <NativeSelect ref={ref as never} aria-label="x"><option>a</option></NativeSelect>],
  ['Checkbox', (ref) => <Checkbox ref={ref as never} aria-label="x" />],
  ['Switch', (ref) => <Switch ref={ref as never} aria-label="x" />],
  ['Rating', (ref) => <Rating ref={ref as never} aria-label="x" />],
  ['OtpInput', (ref) => <OtpInput ref={ref as never} aria-label="x" />],
  ['Combobox', (ref) => <Combobox ref={ref as never} aria-label="x" options={[]} />],
  ['Tour', (ref) => <Tour ref={ref as never} defaultOpen steps={[{title: 'x'}]} />],
  ['Command', (ref) => <Command ref={ref as never} defaultOpen items={[]} />],
  ['Card', (ref) => <Card ref={ref as never}>x</Card>],
  ['Calendar', (ref) => <Calendar ref={ref as never} aria-label="x" />],
  ['Slider', (ref) => <Slider ref={ref as never} aria-label="x" defaultValue={1} />],
];

describe('ref forwarding', () => {
  it.each(cases)('%s forwards its ref to a DOM element', (_name, make) => {
    const ref = createRef<HTMLElement>();
    render(make(ref as never));
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});

describe('controlled value stays put until the parent changes it', () => {
  it('Rating', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Rating aria-label="r" value={2} onValueChange={change} />);
    await user.click(screen.getByLabelText('4 of 5'));
    expect(change).toHaveBeenCalledWith(4);
    expect(screen.getByLabelText('2 of 5')).toBeChecked();
  });
  it('OtpInput', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<OtpInput aria-label="c" length={4} value="12" onValueChange={change} />);
    await user.click(screen.getByLabelText('Digit 3 of 4'));
    await user.keyboard('9');
    expect(change).toHaveBeenCalledWith('129');
    expect(screen.getByLabelText('Digit 3 of 4')).toHaveValue('');
  });
  it('SegmentedControl', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<SegmentedControl aria-label="s" value="a" onValueChange={change} options={[{value: 'a', label: 'A'}, {value: 'b', label: 'B'}]} />);
    await user.click(screen.getByRole('radio', {name: 'B'}));
    expect(change).toHaveBeenCalledWith('b');
    expect(screen.getByRole('radio', {name: 'A'})).toBeChecked();
  });
});
