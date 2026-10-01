import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

/** Small overflow menu with Rename / Delete for folders and Study Sets. */
export function RowMenu({ label, onRename, onDelete }: { label: string; onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors';

  return (
    <div ref={ref} className="relative z-[2]">
      <button
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
          'inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-ink active:scale-95',
          open && 'bg-slate-100 text-ink',
        )}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-40 origin-top-right animate-scale-in rounded-xl border border-line bg-white p-1 shadow-lift"
        >
          <button
            role="menuitem"
            type="button"
            className={cn(item, 'text-slate-700 hover:bg-slate-100')}
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={15} aria-hidden /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
