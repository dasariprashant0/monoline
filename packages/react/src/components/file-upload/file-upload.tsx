'use client';
import {forwardRef, useId, useRef, useState, type DragEvent, type InputHTMLAttributes, type ReactNode} from 'react';
import {cx} from '../../utils/cx';
import {setRefs} from '../../utils/overlay';

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'children'> {
  /** The visible prompt, for example "Drop files here or choose". */
  label?: ReactNode;
  /** Called with the full current list whenever it changes. */
  onFilesChange?: (files: File[]) => void;
}

/** Whether a file matches an `accept` list such as `.png, image/*, application/pdf`. An empty list accepts everything. */
function accepted(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase(), type = file.type.toLowerCase();
  return tokens.some((t) => (t.startsWith('.') ? name.endsWith(t) : t.endsWith('/*') ? type.startsWith(t.slice(0, -1)) : type === t));
}

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

/** Controls are native: the input is visually hidden but focusable. Use `accept` and `multiple` as on any file input. */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload({label = 'Drop files here or choose', onFilesChange, multiple, className, ...rest}, ref) {
  const id = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement | null>(null);
  // Keep the real input's file list equal to the shown list, so a `name`d input inside a <form> submits what the user sees.
  // Where DataTransfer is not available the input is cleared instead (the list is still reported through `onFilesChange`).
  const syncInput = (next: File[]) => {
    const el = input.current;
    if (!el) return;
    try { const dt = new DataTransfer(); next.forEach((f) => dt.items.add(f)); el.files = dt.files; } catch { el.value = ''; }
  };
  const set = (next: File[], msg: string) => { setFiles(next); setNote(msg); syncInput(next); onFilesChange?.(next); };
  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const all = Array.from(list), incoming = all.filter((f) => accepted(f, rest.accept));
    const rejected = all.length - incoming.length;
    const rejectNote = rejected ? `, ${rejected} not accepted` : '';
    if (!incoming.length) { setNote(`${rejected} file${rejected > 1 ? 's' : ''} not accepted`); syncInput(files); return; }
    set(multiple ? [...files, ...incoming] : incoming.slice(0, 1), `${incoming.length} file${incoming.length > 1 ? 's' : ''} added${rejectNote}`);
  };
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (!rest.disabled) add(e.dataTransfer.files); };
  return (
    <div className={cx('upload', className)}>
      <label
        htmlFor={id}
        className="upload-zone"
        data-over={over || undefined}
        onDragOver={(e) => { e.preventDefault(); if (!rest.disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        <input ref={(n) => setRefs(n, input, ref)} id={id} type="file" className="sr-only" multiple={multiple} onChange={(e) => add(e.target.files)} {...rest} />
        <span>{label}</span>
      </label>
      {files.length > 0 && (
        <ul className="upload-list" aria-label="Selected files">
          {files.map((f, i) => (
            <li key={f.name + i}>
              <span className="upload-name">{f.name}</span><span className="muted small">{size(f.size)}</span>
              <button type="button" className="upload-remove" onClick={() => set(files.filter((_, j) => j !== i), `${f.name} removed`)}>Remove<span className="sr-only"> {f.name}</span></button>
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only" role="status">{note}</span>
    </div>
  );
});
