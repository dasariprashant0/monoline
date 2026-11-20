import type {ReactNode} from 'react';
import '@monoline/css/core.css'; // tokens, themes, base; then one file per component you use
import '@monoline/css/components/button.css';
import '@monoline/css/components/dialog.css';

export const metadata = {title: 'Monoline + Next.js'};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" data-theme="warm">
      <body>{children}</body>
    </html>
  );
}
