import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

const MENU_WIDTH = 160;
const MENU_HEIGHT = 88;
/** Space kept clear at the bottom for the mobile tab bar. */
const BOTTOM_CLEARANCE = 96;

/**
 * Small overflow menu with Rename / Delete for folders and Study Sets.
 * The menu is rendered in a portal with fixed positioning, so neighbouring
 * rows and clipped lists can never cover it.
 */
export function RowMenu({ label, onRename, onDelete }: { label: string; onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const opensUp = rect.bottom + 4 + MENU_HEIGHT > window.innerHeight - BOTTOM_CLEARANCE && rect.top - 4 - MENU_HEIGHT > 0;
    setPosition({
      top: opensUp ? rect.top - 4 - MENU_HEIGHT : rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          'relative z-[2] inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-ink active:scale-95',
          open && 'bg-slate-100 text-ink',
        )}
      >
        <MoreHorizontal size={18} />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${label}`}
            className="fixed z-50 animate-scale-in rounded-xl border border-line bg-white p-1 shadow-lift"
            style={{ top: position.top, right: position.right, width: MENU_WIDTH }}
          >
            <button
              role="menuitem"
              type="button"
              className={cn(item, 'text-slate-700 hover:bg-slate-100')}
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              <Pencil size={15} aria-hidden /> Rename
            </button>
            <button
              role="menuitem"
              type="button"
              className={cn(item, 'text-red-600 hover:bg-red-50')}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={15} aria-hidden /> Delete
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
