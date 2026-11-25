import type {Demo} from '../../demo';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './context-menu';

export const demos: Demo[] = [
  {
    title: 'Right click the box',
    render: () => (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '120px',
              width: '100%',
              border: '1px dashed var(--rule)',
              background: 'none',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            Right click here, or focus and press Shift+F10
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuLabel>File</ContextMenuLabel>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem tone="danger">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
];
