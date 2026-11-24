import {render} from '@testing-library/react';
import {Combobox} from './components/combobox';
import {MultiSelect} from './components/multi-select';
import {TagsInput} from './components/tags-input';
import {OtpInput} from './components/otp-input';
import {ColorPicker} from './components/color-picker';
import {DatePicker} from './components/date-picker';
import {DateRangePicker} from './components/date-range-picker';
import {TreeSelect} from './components/tree-select';

const data = (ui: React.ReactElement) => {
  const {container} = render(<form>{ui}</form>);
  return [...new FormData(container.querySelector('form')!).entries()];
};
const opts = [{value: 'a', label: 'Apple'}, {value: 'b', label: 'Banana'}];

describe('custom controls submit their value through a hidden input', () => {
  it('Combobox submits the option value, not its label', () => {
    expect(data(<Combobox name="f" aria-label="f" defaultValue="a" options={opts} />)).toEqual([['f', 'a']]);
  });
  it('MultiSelect submits one entry per value and not the search text', () => {
    expect(data(<MultiSelect name="f" aria-label="f" defaultValue={['a', 'b']} options={opts} />)).toEqual([['f', 'a'], ['f', 'b']]);
  });
  it('TagsInput submits one entry per tag', () => {
    expect(data(<TagsInput name="t" aria-label="t" defaultValue={['x', 'y']} />)).toEqual([['t', 'x'], ['t', 'y']]);
  });
  it('OtpInput submits the whole code', () => {
    expect(data(<OtpInput name="c" aria-label="c" length={4} defaultValue="12" />)).toEqual([['c', '12']]);
  });
  it('ColorPicker submits the hex colour', () => {
    expect(data(<ColorPicker name="c" defaultValue="#112233" />)).toEqual([['c', '#112233']]);
  });
  it('DatePicker submits YYYY-MM-DD, and empty when unset', () => {
    expect(data(<DatePicker name="d" aria-label="d" defaultValue={new Date(2025, 0, 5)} />)).toEqual([['d', '2025-01-05']]);
    expect(data(<DatePicker name="d" aria-label="d" />)).toEqual([['d', '']]);
  });
  it('DateRangePicker submits start and end', () => {
    expect(data(<DateRangePicker name="r" aria-label="r" defaultValue={{start: new Date(2025, 0, 5), end: new Date(2025, 0, 9)}} />)).toEqual([['r-start', '2025-01-05'], ['r-end', '2025-01-09']]);
  });
  it('TreeSelect submits one entry per node id', () => {
    expect(data(<TreeSelect name="n" aria-label="n" multiple defaultValue={['x']} items={[{id: 'x', label: 'X'}]} />)).toEqual([['n', 'x']]);
  });
});
