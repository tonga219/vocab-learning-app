interface Props {
  current: number;
  total: number;
  completed: number;
}

/** "4 / 30" with a slim animated bar showing completed words. */
export function ProgressIndicator({ current, total, completed }: Props) {
  const pct = total ? Math.min(100, (completed / total) * 100) : 0;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="tabular shrink-0 text-sm font-semibold text-ink" aria-live="polite">
        {current}
        <span className="font-medium text-slate-400"> / {total}</span>
      </span>
      <div
        className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-200/80"
        role="progressbar"
        aria-label="Words completed"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
