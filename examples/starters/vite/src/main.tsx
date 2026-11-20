import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@monoline/react';
import '@monoline/css/core.css'; // tokens, themes, base; then one file per component you use
import '@monoline/css/components/button.css';
import '@monoline/css/components/dialog.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Dialog>
      <DialogTrigger asChild><Button variant="solid">Open dialog</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hello from Monoline</DialogTitle>
          <DialogDescription>Installed from npm packages, no aliases.</DialogDescription>
        </DialogHeader>
        <DialogFooter><DialogClose asChild><Button variant="line">Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  </StrictMode>,
);
