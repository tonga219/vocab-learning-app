import type { Difficulty, ISODateString, Vocabulary } from '../types';
import { addDays, diffInCalendarDays, startOfDay } from './date';

/**
 * Review intervals (in days) per difficulty. Stage n uses SCHEDULES[d][n - 1].
 * After the final stage, the last interval repeats forever.
 *
 *   Hard:   1 → 3 → 7 → 30 → 60 → 60 …
 *   Medium: 3 → 30 → 60 → 60 …
 *   Easy:   7 → 60 → 60 …
 */
export const SCHEDULES: Record<Difficulty, readonly number[]> = {
  hard: [1, 3, 7, 30, 60],
  medium: [3, 30, 60],
  easy: [7, 60],
};

/** Interval in days for a given difficulty and stage (stage >= 1). */
export function getReviewInterval(difficulty: Difficulty, stage: number): number {
  const schedule = SCHEDULES[difficulty];
  const index = Math.min(Math.max(stage, 1), schedule.length) - 1;
  return schedule[index];
}

/** Next review date: local midnight of (today + interval for the stage). */
export function calculateNextReview(difficulty: Difficulty, stage: number, from: Date = new Date()): ISODateString {
  return addDays(startOfDay(from), getReviewInterval(difficulty, stage)).toISOString();
}

export function isDue(vocab: Pick<Vocabulary, 'nextReviewAt'>, now: Date = new Date()): boolean {
  return diffInCalendarDays(vocab.nextReviewAt, now) <= 0;
}

/** A newly created word: Hard, never reviewed, due today. */
export function createNewVocabularyFields(now: Date = new Date()): Pick<
  Vocabulary,
  'difficulty' | 'reviewStage' | 'lastReviewedAt' | 'nextReviewAt' | 'createdAt'
> {
  return {
    difficulty: 'hard',
    reviewStage: 0,
    lastReviewedAt: null,
    nextReviewAt: startOfDay(now).toISOString(),
    createdAt: now.toISOString(),
  };
}

/**
 * Changing difficulty resets the word to Stage 1 of the new schedule and
 * recalculates nextReviewAt from today. It is NOT a review (no history,
 * lastReviewedAt untouched).
 */
export function changeDifficulty(vocab: Vocabulary, difficulty: Difficulty, now: Date = new Date()): Vocabulary {
  if (vocab.difficulty === difficulty) return vocab;
  return {
    ...vocab,
    difficulty,
    reviewStage: 1,
    nextReviewAt: calculateNextReview(difficulty, 1, now),
  };
}

export interface CompleteReviewOptions {
  /**
   * The word as it was when the card was opened. If the difficulty was changed
   * while the card was on screen, the word was already re-scheduled to Stage 1
   * of the new difficulty starting today, so this review simply confirms that
   * schedule rather than advancing past it.
   */
  snapshot?: Vocabulary;
  /**
   * When false, a word that is not yet due keeps its schedule (studying ahead
   * in a Study Set should not push it further out). Defaults to true.
   */
  advanceWhenNotDue?: boolean;
}

/**
 * Completes a review of a word (the user moved on from it in a study session).
 * Updates lastReviewedAt, advances reviewStage and recalculates nextReviewAt.
 */
export function completeReview(current: Vocabulary, now: Date = new Date(), options: CompleteReviewOptions = {}): Vocabulary {
  const { snapshot, advanceWhenNotDue = true } = options;
  const reviewedAt = now.toISOString();

  if (snapshot && snapshot.difficulty !== current.difficulty) {
    return {
      ...current,
      reviewStage: 1,
      nextReviewAt: calculateNextReview(current.difficulty, 1, now),
      lastReviewedAt: reviewedAt,
    };
  }

  const base = snapshot ? { ...current, reviewStage: snapshot.reviewStage, nextReviewAt: snapshot.nextReviewAt } : current;

  if (!advanceWhenNotDue && !isDue(base, now)) {
    return { ...base, lastReviewedAt: reviewedAt };
  }

  const nextStage = base.reviewStage + 1;
  return {
    ...base,
    reviewStage: nextStage,
    nextReviewAt: calculateNextReview(base.difficulty, nextStage, now),
    lastReviewedAt: reviewedAt,
  };
}
