import type { Difficulty } from '../types';
import { DIFFICULTY_LABEL } from '../types';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';

interface Props {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  /** compact = [ H | M | E ] for dense lists. */
  compact?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  label?: string;
}

const FULL: SegmentOption<Difficulty>[] = (['hard', 'medium', 'easy'] as const).map((d) => ({
  value: d,
  label: DIFFICULTY_LABEL[d],
}));

const COMPACT: SegmentOption<Difficulty>[] = (['hard', 'medium', 'easy'] as const).map((d) => ({
  value: d,
  label: DIFFICULTY_LABEL[d][0],
  ariaLabel: DIFFICULTY_LABEL[d],
}));

/** One-click Hard / Medium / Easy control. Never a dropdown. */
export function DifficultySelector({ value, onChange, compact, size, className, label = 'Difficulty' }: Props) {
  return (
    <SegmentedControl
      label={label}
      options={compact ? COMPACT : FULL}
      value={value}
      onChange={onChange}
      size={size ?? (compact ? 'xs' : 'sm')}
      className={className}
    />
  );
}
