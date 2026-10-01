import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarCheck2, Library, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useToday } from '../hooks/useToday';
import { getTodayPlan } from '../utils/dailyPriority';
import { cn } from '../utils/cn';

const NAV = [
  { to: '/', label: 'Today', icon: CalendarCheck2, end: true },
  { to: '/library', label: 'Library', icon: Library, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#2563EB" />
        <rect x="8" y="10" width="16" height="12" rx="2.5" fill="#fff" transform="rotate(-8 16 16)" opacity=".5" />
        <rect x="8" y="10" width="16" height="12" rx="2.5" fill="#fff" />
        <rect x="11" y="14.5" width="10" height="1.6" rx=".8" fill="#2563EB" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Cadence</span>
    </div>
  );
}

function useRemainingToday() {
  const { data } = useAppData();
  const today = useToday();
  return useMemo(
    () => getTodayPlan(data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, today).selected.length,
    [data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, today],
  );
}

export function Layout() {
  const remaining = useRemainingToday();
  const location = useLocation();

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line/80 bg-white/60 px-4 py-6 backdrop-blur lg:flex">
        <Logo className="px-2" />
        <nav aria-label="Main" className="mt-9 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 font-medium transition-all duration-150',
                  to === '/' ? 'h-12 text-[15px]' : 'h-10 text-sm',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={to === '/' ? 19 : 18} strokeWidth={isActive ? 2.2 : 1.9} aria-hidden />
                  <span className="flex-1">{label}</span>
                  {to === '/' && remaining > 0 && (
                    <span
                      className={cn(
                        'tabular rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-600',
                      )}
                      aria-label={`${remaining} words to review`}
                    >
                      {remaining}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 text-xs leading-relaxed text-slate-400">
          Your daily words, chosen for you.
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-line/60 bg-canvas/85 px-5 backdrop-blur-md lg:hidden">
        <Logo />
      </header>

      <main className="min-w-0 flex-1 pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-0">
        <div key={location.pathname.split('/').slice(0, 2).join('/')} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-white/90 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95',
                  isActive ? 'text-blue-700' : 'text-slate-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <span
                      className={cn(
                        'absolute -inset-x-3.5 -inset-y-1 rounded-full transition-all duration-200',
                        isActive ? 'scale-100 bg-blue-50 opacity-100' : 'scale-75 opacity-0',
                      )}
                      aria-hidden
                    />
                    <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} className="relative" aria-hidden />
                    {to === '/' && remaining > 0 && (
                      <span className="tabular absolute -right-3 -top-1.5 min-w-[18px] rounded-full bg-blue-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white ring-2 ring-white">
                        {remaining}
                      </span>
                    )}
                  </span>
                  <span className={cn(isActive && 'font-semibold')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  back,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5 text-sm font-medium text-muted">{eyebrow}</div>}
          <h1 className="truncate text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[32px]">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[880px] px-5 pb-10 pt-6 sm:px-8 sm:pt-10 lg:pt-14', className)}>{children}</div>;
}
