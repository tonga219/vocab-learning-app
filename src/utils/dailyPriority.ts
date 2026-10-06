import type { Difficulty, ReviewHistory, Vocabulary } from '../types';
import { diffInCalendarDays, isSameDay } from './date';

const DIFFICULTY_RANK: Record<Difficulty, number> = { hard: 0, medium: 1, easy: 2 };

/** Whole days a word is past its review date (0 = due today, negative = not due). */
export function getOverdueDays(vocab: Vocabulary, today: Date = new Date()): number {
  return diffInCalendarDays(today, vocab.nextReviewAt);
}

/** The Due Pool: every word with nextReviewAt <= today. */
export function getDueVocabulary(vocabulary: Vocabulary[], today: Date = new Date()): Vocabulary[] {
  return vocabulary.filter((v) => getOverdueDays(v, today) >= 0);
}

/**
 * Priority order (exact):
 *   1. Overdue days — descending
 *   2. Difficulty — Hard > Medium > Easy
 *   3. Review stage — ascending
 *   4. Last reviewed — oldest first (never reviewed counts as oldest)
 * Ties after that fall back to creation order for a stable result.
 */
export function sortByPriority(vocabulary: Vocabulary[], today: Date = new Date()): Vocabulary[] {
  const lastReviewed = (v: Vocabulary) => (v.lastReviewedAt ? new Date(v.lastReviewedAt).getTime() : -Infinity);
  return [...vocabulary].sort((a, b) => {
    const overdue = getOverdueDays(b, today) - getOverdueDays(a, today);
    if (overdue !== 0) return overdue;
    const difficulty = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
    if (difficulty !== 0) return difficulty;
    const stage = a.reviewStage - b.reviewStage;
    if (stage !== 0) return stage;
    const la = lastReviewed(a);
    const lb = lastReviewed(b);
    if (la !== lb) return la < lb ? -1 : 1;
    const created = a.createdAt.localeCompare(b.createdAt);
    if (created !== 0) return created;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Selects today's review from the Due Pool. Never fills unused slots with
 * words that are not due. Words left out keep their nextReviewAt and compete
 * again tomorrow.
 */
export function getTodayReview(vocabulary: Vocabulary[], limit: number | null, today: Date = new Date()) {
  const due = sortByPriority(getDueVocabulary(vocabulary, today), today);
  const slots = limit === null ? due.length : Math.max(0, limit);
  return { due, selected: due.slice(0, slots), waiting: due.slice(slots) };
}

export interface TodayPlan {
  /** Every word due now (not yet reviewed today). */
  due: Vocabulary[];
  /** Words still to review in today's session. */
  selected: Vocabulary[];
  /** Due words beyond today's limit. */
  waiting: Vocabulary[];
  /** Distinct words already reviewed in today's Daily Review. */
  reviewedTodayIds: string[];
  limit: number | null;
}

/**
 * Today's plan. Words already reviewed in a Daily Review today use up slots
 * of the daily limit, so finishing 30 words does not pull in 30 more.
 */
export function getTodayPlan(
  vocabulary: Vocabulary[],
  history: ReviewHistory[],
  limit: number | null,
  today: Date = new Date(),
): TodayPlan {
  const existing = new Set(vocabulary.map((v) => v.id));
  const reviewedTodayIds = [
    ...new Set(
      history
        .filter((h) => h.sessionType === 'daily' && isSameDay(h.reviewedAt, today) && existing.has(h.vocabularyId))
        .map((h) => h.vocabularyId),
    ),
  ];
  const remaining = limit === null ? null : Math.max(0, limit - reviewedTodayIds.length);
  const { due, selected, waiting } = getTodayReview(vocabulary, remaining, today);
  return { due, selected, waiting, reviewedTodayIds, limit };
}

export function countByDifficulty(vocabulary: Pick<Vocabulary, 'difficulty'>[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { hard: 0, medium: 0, easy: 0 };
  for (const v of vocabulary) counts[v.difficulty] += 1;
  return counts;
}

/** How many waiting words "Review more" adds after today's review is done. */
export const EXTRA_REVIEW_SIZE = 10;

/** The next highest-priority waiting words, for an optional extra session. */
export function getExtraReview(plan: TodayPlan, size = EXTRA_REVIEW_SIZE): Vocabulary[] {
  return plan.selected.length > 0 ? [] : plan.waiting.slice(0, size);
}
