import {type ReactNode, StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';

const themes = ['warm', 'dark', 'midnight'];
const accents = ['orange', 'green', 'blue', 'violet', 'rose', 'teal', 'amber', 'slate'];

/** Theme and accent on <html>, the page-level switch. The demos also set both on a subtree. */
function Look() {
  const [theme, setTheme] = useState('warm');
  const [accent, setAccent] = useState('orange');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
  }, [theme, accent]);
  return (
    <div className="bar">
      <label>
        Theme{' '}
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          {themes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Accent{' '}
        <select value={accent} onChange={(e) => setAccent(e.target.value)}>
          {accents.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function mount(children: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <main>
        <Look />
        <div className="grid">{children}</div>
      </main>
    </StrictMode>,
  );
}
