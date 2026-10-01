import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface Props {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex animate-fade-up flex-col items-center px-6 py-14 text-center', className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-3 rounded-[22px] bg-blue-50" aria-hidden />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-soft">
          {icon}
        </div>
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
