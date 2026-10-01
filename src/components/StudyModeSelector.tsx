import { Keyboard, Layers } from 'lucide-react';
import type { FlashcardFront, ReviewMode } from '../types';
import { SegmentedControl } from './SegmentedControl';

export function StudyModeSelector({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value: ReviewMode;
  onChange: (m: ReviewMode) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <SegmentedControl
      label="Review mode"
      tone="raised"
      size={size}
      className={className}
      value={value}
      onChange={onChange}
      options={[
        {
          value: 'flashcard',
          label: (
            <span className="inline-flex items-center gap-2">
              <Layers size={15} aria-hidden /> Flashcard
            </span>
          ),
        },
        {
          value: 'dictation',
          label: (
            <span className="inline-flex items-center gap-2">
              <Keyboard size={15} aria-hidden /> Dictation
            </span>
          ),
        },
      ]}
    />
  );
}

export function FrontSelector({ value, onChange }: { value: FlashcardFront; onChange: (f: FlashcardFront) => void }) {
  return (
    <SegmentedControl
      label="Card front"
      tone="raised"
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: 'english', label: 'English' },
        { value: 'vietnamese', label: 'Vietnamese' },
      ]}
    />
  );
}
