/// <reference types="vite/client" />
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderToString} from 'react-dom/server';
import {axe} from '../../test/axe';
import {ThemeProvider, themeOptions, useTheme} from './theme-provider';
import {SCRIPT_OPTIONS} from './theme-script';
import {themeScript} from './index';
import themeScriptSource from './theme-script.ts?raw';
import {ThemeSwitcher} from './theme-switcher';

const root = document.documentElement;
/** Node's experimental global localStorage can shadow jsdom's, so install a plain in-memory Storage. */
function memoryStorage() {
  const map = new Map<string, string>();
  return {
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  };
}
let store = memoryStorage();
function Probe() {
  const t = useTheme();
  return (
    <>
      <output>{`${t.theme}/${t.resolvedTheme}/${t.accent}`}</output>
      <button onClick={() => t.setTheme('midnight')}>midnight</button>
      <button onClick={() => t.setAccent('teal')}>teal</button>
      <button onClick={() => t.setFont('serif')}>serif</button>
      <button onClick={() => t.setRadius('round')}>round</button>
      <button onClick={() => t.setDensity('compact')}>compact</button>
      <button onClick={() => t.setDir('rtl')}>rtl</button>
    </>
  );
}

beforeEach(() => {
  store = memoryStorage();
  for (const t of [window, globalThis]) Object.defineProperty(t, 'localStorage', {value: store, configurable: true}); ['data-theme', 'data-accent', 'data-font', 'data-radius', 'data-density', 'dir'].forEach((a) => root.removeAttribute(a));
});

describe('ThemeProvider', () => {
  it('applies defaults to <html>, resolving system to warm in jsdom', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(await screen.findByText('system/warm/orange')).toBeInTheDocument();
    expect(root).toHaveAttribute('data-theme', 'warm');
    expect(root).toHaveAttribute('data-accent', 'orange');
  });
  it('uses initial props, and keeps the default for an explicit undefined', async () => {
    render(<ThemeProvider theme="dark" accent={undefined}><Probe /></ThemeProvider>);
    expect(await screen.findByText('dark/dark/orange')).toBeInTheDocument();
    expect(root).toHaveAttribute('data-accent', 'orange');
  });
  it('sets every option on <html> and saves it', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><Probe /></ThemeProvider>);
    for (const n of ['midnight', 'teal', 'serif', 'round', 'compact', 'rtl']) await user.click(screen.getByRole('button', {name: n}));
    expect(root).toHaveAttribute('data-theme', 'midnight');
    expect(root).toHaveAttribute('data-accent', 'teal');
    expect(root).toHaveAttribute('data-font', 'serif');
    expect(root).toHaveAttribute('data-radius', 'round');
    expect(root).toHaveAttribute('data-density', 'compact');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(localStorage.getItem('monoline-theme')).toBe('midnight');
    expect(localStorage.getItem('monoline-accent')).toBe('teal');
  });
  it('restores saved choices and ignores invalid ones', async () => {
    localStorage.setItem('monoline-theme', 'dark');
    localStorage.setItem('monoline-accent', 'chartreuse');
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(await screen.findByText('dark/dark/orange')).toBeInTheDocument();
    expect(root).toHaveAttribute('data-theme', 'dark');
  });
  it('survives blocked storage', async () => {
    const user = userEvent.setup();
    const get = vi.spyOn(store, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = vi.spyOn(store, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeProvider><Probe /></ThemeProvider>);
    await user.click(screen.getByRole('button', {name: 'teal'}));
    expect(root).toHaveAttribute('data-accent', 'teal');
    get.mockRestore(); set.mockRestore();
  });
  it('renders on the server without touching window', () => {
    expect(() => renderToString(<ThemeProvider><Probe /></ThemeProvider>)).not.toThrow();
  });
  it('throws a clear error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });
});

describe('themeScript options', () => {
  it('lists the same values as themeOptions', () => {
    expect(SCRIPT_OPTIONS).toEqual(themeOptions);
  });
});

describe('themeScript', () => {
  it('lives in a file without "use client", so a Server Component can call it', () => {
    expect(themeScriptSource).not.toMatch(/^\s*['"]use client['"]/);
    expect(typeof themeScript()).toBe('string');
  });

  it('sets saved attributes before paint', () => {
    localStorage.setItem('monoline-theme', 'midnight');
    localStorage.setItem('monoline-accent', 'blue');
    localStorage.setItem('monoline-dir', 'rtl');
    new Function(themeScript())();
    expect(root).toHaveAttribute('data-theme', 'midnight');
    expect(root).toHaveAttribute('data-accent', 'blue');
    expect(root).toHaveAttribute('dir', 'rtl');
  });
  it('ignores saved values that are not valid options', () => {
    localStorage.setItem('monoline-theme', 'neon');
    localStorage.setItem('monoline-dir', 'foo');
    localStorage.setItem('monoline-accent', '"><x>');
    new Function(themeScript())();
    expect(root).not.toHaveAttribute('dir', 'foo');
    expect(root.getAttribute('data-accent')).not.toBe('"><x>');
    expect(root.getAttribute('data-theme')).not.toBe('neon');
  });
  it('uses a custom key and never throws', () => {
    localStorage.setItem('app-theme', 'dark');
    new Function(themeScript({storageKey: 'app'}))();
    expect(root).toHaveAttribute('data-theme', 'dark');
    const get = vi.spyOn(store, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => new Function(themeScript())()).not.toThrow();
    get.mockRestore();
  });
});

describe('ThemeSwitcher', () => {
  it('changes theme and accent with the keyboard-operable selects', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
    await user.selectOptions(screen.getByRole('combobox', {name: 'Theme'}), 'Dark');
    await user.selectOptions(screen.getByRole('combobox', {name: 'Accent'}), 'Violet');
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-accent', 'violet');
  });
  it('has no axe violations', async () => {
    const {container} = render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
