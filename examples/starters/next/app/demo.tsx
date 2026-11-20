'use client';
import {Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@monoline/react';

export function Demo() {
  return (
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
  );
}
