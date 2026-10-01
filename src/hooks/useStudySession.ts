import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReviewMode, SessionType, Vocabulary } from '../types';
import { useAppData } from './useAppData';

export interface DictationResult {
  answer: string;
  correct: boolean;
}

/**
 * Drives a study session over a fixed list of word ids.
 * A word counts as reviewed only when the user moves on from it (Next / Finish).
 */
export function useStudySession(wordIds: string[], mode: ReviewMode, sessionType: SessionType) {
  const { data, recordReview } = useAppData();
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [results, setResults] = useState<Record<string, DictationResult>>({});
  /** Each word as it was when its card was first opened in this session. */
  const snapshots = useRef(new Map<string, Vocabulary>());

  const byId = useMemo(() => new Map(data.vocabulary.map((v) => [v.id, v])), [data.vocabulary]);
  // Words deleted mid-session simply drop out.
  const words = useMemo(() => wordIds.map((id) => byId.get(id)).filter((v): v is Vocabulary => !!v), [wordIds, byId]);
  const safeIndex = Math.min(index, Math.max(0, words.length - 1));
  const current = words[safeIndex] ?? null;

  if (current && !snapshots.current.has(current.id)) snapshots.current.set(current.id, current);

  const completedSet = useMemo(() => new Set(completed), [completed]);

  const next = useCallback(() => {
    if (!current) return;
    if (!completedSet.has(current.id)) {
      const result = results[current.id];
      recordReview({
        vocabularyId: current.id,
        snapshot: snapshots.current.get(current.id) ?? current,
        reviewMode: mode,
        isCorrect: mode === 'dictation' ? (result?.correct ?? false) : null,
        sessionType,
      });
      setCompleted((c) => [...c, current.id]);
    }
    if (safeIndex >= words.length - 1) setFinished(true);
    else {
      setDirection('right');
      setIndex(safeIndex + 1);
    }
  }, [current, completedSet, results, recordReview, mode, sessionType, safeIndex, words.length]);

  const previous = useCallback(() => {
    if (safeIndex === 0) return;
    setDirection('left');
    setIndex(safeIndex - 1);
  }, [safeIndex]);

  const setResult = useCallback((id: string, result: DictationResult) => setResults((r) => ({ ...r, [id]: result })), []);

  const reviewedWords = useMemo(() => completed.map((id) => byId.get(id)).filter((v): v is Vocabulary => !!v), [completed, byId]);

  return {
    words,
    current,
    index: safeIndex,
    total: words.length,
    completedCount: completed.length,
    isCompleted: (id: string) => completedSet.has(id),
    isLast: safeIndex >= words.length - 1,
    finished,
    direction,
    next,
    previous,
    results,
    setResult,
    reviewedWords,
  };
}
