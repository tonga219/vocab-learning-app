import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is abbreviated (e.g. "H" → "Hard"). */
  ariaLabel?: string;
  title?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Visual style of the selected segment. */
  tone?: 'solid' | 'raised';
}

const SIZES = {
  xs: { root: 'h-7 p-0.5 rounded-lg', item: 'text-[11px] min-w-[26px] px-1.5 rounded-md', radius: 'rounded-md' },
  sm: { root: 'h-9 p-[3px] rounded-[11px]', item: 'text-[13px] px-3 rounded-lg', radius: 'rounded-lg' },
  md: { root: 'h-11 p-1 rounded-xl', item: 'text-sm px-4 rounded-[9px]', radius: 'rounded-[9px]' },
};

/**
 * One-click segmented control (radio group) with a sliding selection indicator.
 * Selection is conveyed by fill, weight and aria-checked — not color alone.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  className,
  tone = 'solid',
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const next = (i + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('relative inline-grid select-none bg-slate-100 ring-1 ring-inset ring-slate-200/70', SIZES[size].root, className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute transition-transform duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]',
          SIZES[size].radius,
          tone === 'solid'
            ? 'bg-blue-600 shadow-[0_1px_2px_rgba(30,64,175,0.35),0_2px_6px_-1px_rgba(37,99,235,0.35)]'
            : 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/60',
        )}
        style={{
          top: 'var(--seg-pad)',
          bottom: 'var(--seg-pad)',
          left: 'var(--seg-pad)',
          width: `calc((100% - 2 * var(--seg-pad)) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
          ['--seg-pad' as string]: size === 'xs' ? '2px' : size === 'sm' ? '3px' : '4px',
        }}
      />
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            title={option.title ?? option.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation();
              if (!selected) onChange(option.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative z-[1] flex items-center justify-center whitespace-nowrap transition-colors duration-200',
              'focus-visible:outline-offset-0',
              SIZES[size].item,
              selected
                ? tone === 'solid'
                  ? 'font-semibold text-white'
                  : 'font-semibold text-ink'
                : 'font-medium text-slate-500 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
