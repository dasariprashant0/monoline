// Components whose first demo is only a trigger or an empty box (overlays, bare inputs). Their thumbnail shows the open
// or filled state instead, in the component's own classes, so the card still looks like the real thing. Markup only.
const btn = (t: string, v = 'line') => `<button class="btn btn-${v}">${t}</button>`;
const stack = (c: string, style = '') => `<div style="display:grid;gap:var(--s2);${style}">${c}</div>`;
const item = (t: string, extra = '') => `<div class="menu-item" role="menuitem">${t}${extra}</div>`;
const menu = (items: string) => `<div class="menu-content" role="menu" style="min-inline-size:12rem">${items}</div>`;
const dialog = (title: string, text: string, foot: string) =>
  `<div class="dialog-content" style="inline-size:100%"><div class="dialog-header"><h3 class="dialog-title">${title}</h3><p class="dialog-description">${text}</p></div><div class="dialog-footer">${foot}</div></div>`;

export const OVERRIDES: Record<string, string> = {
  dialog: dialog('Overwrite copy?', 'A file with this name already exists.', btn('Cancel') + btn('Overwrite', 'solid')),
  'alert-dialog': dialog('Delete project?', 'This cannot be undone.', btn('Cancel') + btn('Delete', 'danger')),
  drawer: `<div class="drawer-content" style="inline-size:100%;block-size:100%"><div class="dialog-header"><h3 class="dialog-title">Filters</h3><p class="dialog-description">Narrow the list.</p></div><div class="dialog-footer">${btn('Apply', 'solid')}</div></div>`,
  popover: `<div class="popover" role="dialog" style="inline-size:70%"><strong>Details</strong><p class="cdoc-muted">Created by Ada on 1 March.</p>${btn('Open')}</div>`,
  'hover-card': `<div style="display:grid;gap:var(--s2);justify-items:start"><a>@ada</a><div class="popover" style="inline-size:80%"><strong>Ada Example</strong><p class="cdoc-muted">Designs thin-line interfaces.</p></div></div>`,
  tooltip: `<div style="display:grid;gap:var(--s2);justify-items:center">${btn('Save')}<div class="tooltip" role="tooltip">Save changes</div></div>`,
  'dropdown-menu': stack(
    btn('Actions') + menu(item('Rename') + item('Duplicate') + '<div class="menu-sep"></div>' + item('Delete')),
  ),
  'context-menu': stack(
    menu(item('Back') + item('Reload') + '<div class="menu-sep"></div>' + item('Inspect')),
    'justify-items:center',
  ),
  command: `<div class="command" style="inline-size:100%;display:grid;position:static"><input class="input" value="Search actions" readonly />${menu(item('New project') + item('Invite a teammate') + item('Switch theme'))}</div>`,
  toast: `<div class="toast-item" style="inline-size:100%"><div class="toast-title">Draft saved</div><div class="toast-description">Stored on this device.</div></div>`,
  toc: stack(
    '<strong>On this page</strong>' +
      ['Introduction', 'Install', 'Usage', 'Props']
        .map(
          (t, i) =>
            `<span style="padding-inline-start:var(--s3);border-inline-start:2px solid ${i === 1 ? 'var(--accent)' : 'var(--rule)'};color:${i === 1 ? 'var(--foreground)' : 'var(--muted)'}">${t}</span>`,
        )
        .join(''),
    'inline-size:70%',
  ),
  input: `<input class="input" value="ada@example.com" readonly style="inline-size:100%" />`,
  textarea: `<textarea class="textarea" readonly style="inline-size:100%" rows="4">Thin lines, one accent, plain words.</textarea>`,
  tag: `<div style="display:flex;gap:var(--s2)"><span class="tag">design</span><span class="tag">writing</span><span class="tag">ui</span></div>`,
  skeleton: stack(
    '<span class="skeleton" style="block-size:var(--s7);inline-size:var(--s7)"></span><span class="skeleton" style="block-size:var(--s3);inline-size:100%"></span><span class="skeleton" style="block-size:var(--s3);inline-size:70%"></span>',
    'inline-size:100%',
  ),
  'scroll-progress': `<div style="display:grid;gap:var(--s3);inline-size:100%"><div style="block-size:var(--s1);background:var(--rule)"><div style="block-size:100%;inline-size:62%;background:var(--accent)"></div></div><p class="cdoc-muted">Reading progress follows the page scroll.</p></div>`,
};
