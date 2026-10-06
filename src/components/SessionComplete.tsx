import { Link } from 'react-router-dom';
import type { Vocabulary } from '../types';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../types';
import { countByDifficulty } from '../utils/dailyPriority';
import { buttonClass } from './Button';
import { DifficultyMeter } from './DifficultyMeter';

interface Props {
  title: string;
  reviewed: Vocabulary[];
  correct?: number | null;
  backTo: string;
  backLabel: string;
  secondary?: { to: string; label: string };
}

export function SessionComplete({ title, reviewed, correct, backTo, backLabel, secondary }: Props) {
  const counts = countByDifficulty(reviewed);
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-4 animate-ring-pop rounded-full bg-blue-100/70 [animation-delay:120ms]" aria-hidden />
        <div className="relative flex h-20 w-20 animate-ring-pop items-center justify-center rounded-full bg-blue-600 shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="white"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="48"
              className="animate-check-draw"
            />
          </svg>
        </div>
      </div>

      <h1 className="mt-8 animate-fade-up text-[26px] font-semibold tracking-[-0.025em] text-ink [animation-delay:200ms] sm:text-[30px]">
        {title}
      </h1>
      <p className="tabular mt-2 animate-fade-up text-[15px] text-muted [animation-delay:260ms]">
        {reviewed.length} {reviewed.length === 1 ? 'word' : 'words'} reviewed
        {correct != null && ` · ${correct} correct`}
      </p>

      <dl className="mt-8 grid w-full max-w-sm animate-fade-up grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white shadow-soft [animation-delay:320ms]">
        {DIFFICULTIES.map((d) => (
          <div key={d} className="flex flex-col items-center gap-1.5 px-2 py-4">
            <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <DifficultyMeter difficulty={d} />
              {DIFFICULTY_LABEL[d]}
            </dt>
            <dd className="tabular text-2xl font-semibold tracking-tight text-ink">{counts[d]}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex w-full max-w-sm animate-fade-up flex-col gap-2 [animation-delay:380ms]">
        <Link to={backTo} className={buttonClass({ size: 'lg', block: true })}>
          {backLabel}
        </Link>
        {secondary && (
          <Link to={secondary.to} className={buttonClass({ variant: 'secondary', size: 'lg', block: true })}>
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
