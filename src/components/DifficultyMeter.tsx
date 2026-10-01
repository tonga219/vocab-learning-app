import type { Difficulty } from '../types';
import { DIFFICULTY_LABEL } from '../types';
import { cn } from '../utils/cn';

const BARS: Record<Difficulty, number> = { hard: 3, medium: 2, easy: 1 };

/** Small 3-bar indicator: Hard = 3 bars, Medium = 2, Easy = 1 (shape, not just color). */
export function DifficultyMeter({ difficulty, className, showLabel }: { difficulty: Difficulty; className?: string; showLabel?: boolean }) {
  const filled = BARS[difficulty];
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={DIFFICULTY_LABEL[difficulty]}>
      <span aria-hidden className="inline-flex items-end gap-[2px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('w-[3px] rounded-full', i <= filled ? 'bg-blue-600' : 'bg-slate-200')}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="text-xs font-medium text-slate-600">{DIFFICULTY_LABEL[difficulty]}</span>
      ) : (
        <span className="sr-only">{DIFFICULTY_LABEL[difficulty]}</span>
      )}
    </span>
  );
}
