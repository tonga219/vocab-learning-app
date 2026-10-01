import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';

interface Props {
  exitTo: string;
  exitLabel: string;
  title: string;
  progress?: { current: number; total: number; completed: number };
  children: ReactNode;
}

/** Full-screen, distraction-free frame for study sessions. */
export function SessionShell({ exitTo, exitLabel, title, progress, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,#EFF6FF_0%,#F8FAFC_55%)]">
      <header className="sticky top-0 z-20 border-b border-line/50 bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[760px] items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            to={exitTo}
            aria-label={exitLabel}
            title={exitLabel}
            className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-200/60 hover:text-ink active:scale-95"
          >
            <X size={20} />
          </Link>
          {progress ? <ProgressIndicator {...progress} /> : <div className="flex-1" />}
          <span className="hidden shrink-0 text-[13px] font-medium text-muted sm:block">{title}</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
