import type { Difficulty, Vocabulary } from '../types';
import { DifficultySelector } from './DifficultySelector';
import { cn } from '../utils/cn';

interface Props {
  vocab: Vocabulary;
  showDefinition: boolean;
  onEdit: (vocab: Vocabulary) => void;
  onDifficultyChange: (id: string, difficulty: Difficulty) => void;
}

/** A row in the Vocabulary Overview. Tap the row to edit; H/M/E changes level in one click. */
export function VocabularyRow({ vocab, showDefinition, onEdit, onDifficultyChange }: Props) {
  return (
    <li className="group relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:px-5">
      <button
        type="button"
        onClick={() => onEdit(vocab)}
        className="min-w-0 flex-1 rounded-md text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-500"
        aria-label={`Edit ${vocab.term}`}
      >
        <span lang="en" className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {vocab.term}
        </span>
        <span
          lang="vi"
          className={cn(
            'grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out',
            showDefinition ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0',
          )}
          aria-hidden={!showDefinition}
        >
          <span className="overflow-hidden">
            <span className="block truncate pt-0.5 text-sm text-muted">{vocab.definition}</span>
          </span>
        </span>
      </button>
      <div className="relative z-[1] shrink-0">
        <DifficultySelector
          compact
          value={vocab.difficulty}
          onChange={(d) => onDifficultyChange(vocab.id, d)}
          label={`Difficulty for ${vocab.term}`}
        />
      </div>
    </li>
  );
}
