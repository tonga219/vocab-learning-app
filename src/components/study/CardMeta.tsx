import { FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';

/** Source Study Set label shown above a card. */
export function SourceLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-slate-500">
      <FolderOpen size={14} className="shrink-0 text-slate-400" aria-hidden />
      <span className="truncate">{children}</span>
    </div>
  );
}
