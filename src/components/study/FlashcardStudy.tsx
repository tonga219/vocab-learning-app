import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Difficulty, FlashcardFront, Vocabulary } from '../../types';
import { Flashcard } from '../Flashcard';
import { DifficultySelector } from '../DifficultySelector';
import { FrontSelector } from '../StudyModeSelector';
import { Button } from '../Button';
import { SourceLabel } from './CardMeta';

interface Props {
  word: Vocabulary;
  source: string;
  front: FlashcardFront;
  onFrontChange: (front: FlashcardFront) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  canGoBack: boolean;
  isLast: boolean;
  enterFrom: 'left' | 'right' | null;
  onPrevious: () => void;
  onNext: () => void;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export function FlashcardStudy({
  word,
  source,
  front,
  onFrontChange,
  onDifficultyChange,
  canGoBack,
  isLast,
  enterFrom,
  onPrevious,
  onNext,
}: Props) {
  const [flip, setFlip] = useState({ id: word.id, flipped: false });
  const [instant, setInstant] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const flipped = flip.id === word.id && flip.flipped;

  // Move focus to the new card so Space / Enter flips it right away.
  useEffect(() => {
    cardRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [word.id]);

  const toggle = () => setFlip({ id: word.id, flipped: !flipped });

  const changeFront = (next: FlashcardFront) => {
    // Re-orient the current card immediately without restarting the session.
    if (flipped) {
      setInstant(true);
      setFlip({ id: word.id, flipped: false });
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }
    onFrontChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevious();
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        onDifficultyChange((['hard', 'medium', 'easy'] as const)[Number(e.key) - 1]);
      } else if ((e.key === ' ' || e.key === 'Enter') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        setFlip((f) => ({ id: word.id, flipped: !(f.id === word.id && f.flipped) }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrevious, onDifficultyChange, word.id]);

  const english = { label: 'English', text: word.term, lang: 'en' };
  const vietnamese = { label: 'Vietnamese', text: word.definition, lang: 'vi' };

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <SourceLabel>{source}</SourceLabel>
        <FrontSelector value={front} onChange={changeFront} />
      </div>

      {/* Stationary difficulty control — not part of the rotating card. */}
      <div className="relative z-10 mt-4 flex items-center justify-end gap-3 sm:mt-5">
        <span className="hidden text-[13px] font-medium text-slate-500 sm:inline">Level</span>
        <DifficultySelector value={word.difficulty} onChange={onDifficultyChange} label="Difficulty for this word" />
      </div>

      <div ref={cardRef} className="mt-4 sm:mt-5">
        <Flashcard
          key={word.id}
          front={front === 'english' ? english : vietnamese}
          back={front === 'english' ? vietnamese : english}
          flipped={flipped}
          onFlip={toggle}
          instant={instant}
          enterFrom={enterFrom}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 sm:mt-10">
        <Button
          variant="secondary"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoBack}
          icon={<ArrowLeft size={18} aria-hidden />}
          className="min-w-[120px] sm:min-w-[140px]"
        >
          Previous
        </Button>
        <span className="hidden text-xs text-slate-400 md:block">
          <kbd className="font-sans">Space</kbd> flip · <kbd className="font-sans">← →</kbd> move · <kbd className="font-sans">1 2 3</kbd> level
        </span>
        <Button
          size="lg"
          onClick={onNext}
          iconRight={isLast ? <Check size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
          className="min-w-[120px] sm:min-w-[140px]"
        >
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
