import {Links, Meta, Outlet, Scripts, ScrollRestoration} from 'react-router';
import '@monoline/css/core.css'; // tokens, themes, base; then one file per component you use
import '@monoline/css/components/button.css';
import '@monoline/css/components/dialog.css';

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" data-theme="warm">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
