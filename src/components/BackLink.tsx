import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="-ml-1.5 inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
    >
      <ChevronLeft size={16} aria-hidden />
      {label}
    </Link>
  );
}
