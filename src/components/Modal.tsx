import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cn } from '../utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}

/** Accessible dialog: bottom sheet on mobile, centered on larger screens. */
export function Modal({ open, onClose, title, description, children, footer, size = 'sm' }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));
    // Focus the first input if any, otherwise the panel.
    const first = panel?.querySelector<HTMLElement>('input, textarea') ?? panel;
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const items = focusable();
        if (!items.length) return;
        const firstItem = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-sheet-in rounded-t-[22px] bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.25)] outline-none sm:animate-scale-in sm:rounded-2xl',
          size === 'sm' ? 'sm:max-w-[420px]' : 'sm:max-w-[520px]',
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pb-1 pt-5">
          <div>
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm leading-relaxed text-muted">{description}</div>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <X size={18} />
          </IconButton>
        </div>
        {children && <div className="px-6 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:flex-row sm:justify-end sm:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
