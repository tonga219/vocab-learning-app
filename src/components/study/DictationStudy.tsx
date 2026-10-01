import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Check, CornerDownLeft } from 'lucide-react';
import type { Difficulty, Vocabulary } from '../../types';
import type { DictationResult } from '../../hooks/useStudySession';
import { DifficultySelector } from '../DifficultySelector';
import { Button } from '../Button';
import { SourceLabel } from './CardMeta';
import { diffChars, isCorrectAnswer } from '../../utils/answer';
import { cn } from '../../utils/cn';

interface Props {
  word: Vocabulary;
  source: string;
  result: DictationResult | undefined;
  onCheck: (result: DictationResult) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  isLast: boolean;
  onNext: () => void;
}

function promptSize(text: string) {
  if (text.length <= 18) return 'text-[30px] sm:text-[40px]';
  if (text.length <= 36) return 'text-[24px] sm:text-[32px]';
  return 'text-xl sm:text-2xl';
}

export function DictationStudy({ word, source, result, onCheck, onDifficultyChange, isLast, onNext }: Props) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  useEffect(() => {
    setAnswer('');
    inputRef.current?.focus({ preventScroll: true });
  }, [word.id]);

  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true });
  }, [result]);

  const check = (value = answer) => onCheck({ answer: value.trim(), correct: isCorrectAnswer(value, word.term) });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3">
        <SourceLabel>{source}</SourceLabel>
        <DifficultySelector value={word.difficulty} onChange={onDifficultyChange} label="Difficulty for this word" />
      </div>

      {/* Prompt card */}
      <div key={word.id} className="relative mt-5 animate-card-in-right sm:mt-6">
        <div aria-hidden className="absolute inset-x-3 -bottom-1.5 top-3 rounded-[22px] border border-slate-200/80 bg-white/90 shadow-soft" />
        <div className="relative flex min-h-[200px] flex-col rounded-[22px] border border-slate-200/90 bg-white shadow-card sm:min-h-[240px]">
          <div className="px-6 pt-5 sm:px-8 sm:pt-6">
            <span className="eyebrow">Vietnamese</span>
            <div className="mt-4 h-px bg-gradient-to-r from-blue-200 via-blue-100 to-transparent" aria-hidden />
          </div>
          <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12">
            <p lang="vi" className={cn('whitespace-pre-line text-center font-semibold tracking-[-0.02em] text-ink [text-wrap:balance]', promptSize(word.definition))}>
              {word.definition}
            </p>
          </div>
        </div>
      </div>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (result) onNext();
          else if (answer.trim()) check();
        }}
      >
        <label htmlFor={inputId} className="mb-2 block text-[13px] font-semibold text-slate-600">
          English
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            ref={inputRef}
            lang="en"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            readOnly={!!result}
            placeholder="Type the English term"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              'h-14 w-full rounded-2xl border bg-white px-5 text-lg font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-slate-400',
              !result && 'border-line focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
              result?.correct && 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100',
              result && !result.correct && 'animate-shake border-red-300 bg-red-50/30 ring-4 ring-red-50',
            )}
          />
          {!result && (
            <Button type="submit" size="lg" disabled={!answer.trim()} className="h-14 rounded-2xl sm:min-w-[140px]" icon={<CornerDownLeft size={17} aria-hidden />}>
              Check
            </Button>
          )}
        </div>

        {!result && (
          <div className="mt-3 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => check('')}
              className="rounded-lg px-2 py-1 text-[13px] font-medium text-slate-500 underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              I don't know — show answer
            </button>
          </div>
        )}

        {result && (
          <div role="status" className="mt-5 animate-fade-up">
            {result.correct ? (
              <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 animate-ring-pop items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check size={20} strokeWidth={2.8} aria-hidden />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-blue-900">Correct</div>
                  <div lang="en" className="text-sm text-blue-800/80">
                    {word.term}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="grid divide-y divide-line/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  <div className="px-5 py-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-red-600/80">Your answer</div>
                    <div lang="en" className="mt-1 break-words text-lg font-medium text-slate-700">
                      {result.answer ? (
                        diffChars(result.answer, word.term).map((c, i) => (
                          <span key={i} className={cn(!c.ok && 'rounded-[3px] bg-red-100 text-red-700 underline decoration-red-400 decoration-2 underline-offset-4')}>
                            {c.char}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50/40 px-5 py-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blue-700">Correct answer</div>
                    <div lang="en" className="mt-1 whitespace-pre-line break-words text-lg font-semibold text-ink">
                      {result.answer
                        ? diffChars(word.term, result.answer).map((c, i) => (
                            <span key={i} className={cn(!c.ok && 'rounded-[3px] bg-blue-100 text-blue-800')}>
                              {c.char}
                            </span>
                          ))
                        : word.term}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                ref={nextRef}
                type="submit"
                size="lg"
                className="w-full sm:w-auto sm:min-w-[160px]"
                iconRight={isLast ? <Check size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
              >
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
