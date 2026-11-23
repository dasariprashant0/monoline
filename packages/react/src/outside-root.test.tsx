import {render} from '@testing-library/react';
import {DropdownMenuTrigger} from './components/dropdown-menu';
import {HoverCardTrigger} from './components/hover-card';
import {MenubarTrigger} from './components/menubar';
import {PopoverTrigger} from './components/popover';
import {SelectTrigger} from './components/select';
import {TooltipContent} from './components/tooltip';

// A part used outside its root should name the problem, not fail on a null property read.
describe('parts rendered outside their root', () => {
  it.each([
    ['PopoverTrigger', () => <PopoverTrigger>x</PopoverTrigger>, /Popover/],
    ['HoverCardTrigger', () => <HoverCardTrigger>x</HoverCardTrigger>, /HoverCard/],
    ['SelectTrigger', () => <SelectTrigger aria-label="x" />, /Select/],
    ['DropdownMenuTrigger', () => <DropdownMenuTrigger>x</DropdownMenuTrigger>, /menu/],
    ['MenubarTrigger', () => <MenubarTrigger>x</MenubarTrigger>, /Menubar|menu/],
    ['TooltipContent', () => <TooltipContent>x</TooltipContent>, /Tooltip/],
  ])('%s throws a Monoline message', (_name, ui, message) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(ui())).toThrow(message);
    expect(() => render(ui())).toThrow(/Monoline/);
    spy.mockRestore();
  });
});
