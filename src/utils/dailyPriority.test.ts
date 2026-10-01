import { describe, expect, it } from 'vitest';
import type { ReviewHistory, Vocabulary } from '../types';
import { addDays, startOfDay } from './date';
import { getDueVocabulary, getTodayPlan, getTodayReview, sortByPriority } from './dailyPriority';

const today = new Date(2026, 9, 1, 9, 0);
const dayOffset = (n: number) => addDays(startOfDay(today), n).toISOString();

let n = 0;
function v(partial: Partial<Vocabulary>): Vocabulary {
  n += 1;
  return {
    id: `v${String(n).padStart(3, '0')}`,
    studySetId: 's1',
    term: `term${n}`,
    definition: `def${n}`,
    difficulty: 'hard',
    reviewStage: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastReviewedAt: null,
    nextReviewAt: dayOffset(0),
    ...partial,
  };
}

describe('getDueVocabulary', () => {
  it('includes words due today or earlier only', () => {
    const words = [v({ nextReviewAt: dayOffset(-3) }), v({ nextReviewAt: dayOffset(0) }), v({ nextReviewAt: dayOffset(1) })];
    expect(getDueVocabulary(words, today)).toHaveLength(2);
  });
});

describe('sortByPriority', () => {
  it('applies overdue, difficulty, stage, last reviewed in order', () => {
    const a = v({ nextReviewAt: dayOffset(-1), difficulty: 'easy' });
    const b = v({ nextReviewAt: dayOffset(-5), difficulty: 'easy' });
    const c = v({ nextReviewAt: dayOffset(-1), difficulty: 'hard', reviewStage: 3 });
    const d = v({ nextReviewAt: dayOffset(-1), difficulty: 'hard', reviewStage: 2, lastReviewedAt: '2026-09-20T00:00:00Z' });
    const e = v({ nextReviewAt: dayOffset(-1), difficulty: 'hard', reviewStage: 2, lastReviewedAt: '2026-09-10T00:00:00Z' });
    const f = v({ nextReviewAt: dayOffset(-1), difficulty: 'medium' });
    const sorted = sortByPriority([a, c, d, f, e, b], today).map((x) => x.id);
    expect(sorted).toEqual([b.id, e.id, d.id, c.id, f.id, a.id]);
  });
});

describe('getTodayReview', () => {
  it('shows all due words when fewer than the limit, never filling with future words', () => {
    const words = [
      ...Array.from({ length: 23 }, () => v({ nextReviewAt: dayOffset(-1) })),
      ...Array.from({ length: 10 }, () => v({ nextReviewAt: dayOffset(2) })),
    ];
    const r = getTodayReview(words, 30, today);
    expect(r.selected).toHaveLength(23);
    expect(r.waiting).toHaveLength(0);
  });

  it('selects the top 30 of 68 due and leaves 38 waiting untouched', () => {
    const words = Array.from({ length: 68 }, (_, i) => v({ nextReviewAt: dayOffset(-(i % 10)) }));
    const before = words.map((w) => w.nextReviewAt);
    const r = getTodayReview(words, 30, today);
    expect(r.due).toHaveLength(68);
    expect(r.selected).toHaveLength(30);
    expect(r.waiting).toHaveLength(38);
    expect(words.map((w) => w.nextReviewAt)).toEqual(before);
    const minSelectedOverdue = Math.min(...r.selected.map((w) => -new Date(w.nextReviewAt).getTime()));
    const maxWaitingOverdue = Math.max(...r.waiting.map((w) => -new Date(w.nextReviewAt).getTime()));
    expect(minSelectedOverdue).toBeGreaterThanOrEqual(maxWaitingOverdue);
  });

  it('supports unlimited', () => {
    const words = Array.from({ length: 40 }, () => v({}));
    expect(getTodayReview(words, null, today).selected).toHaveLength(40);
  });
});

describe('getTodayPlan', () => {
  it('counts words reviewed in today\'s daily review against the limit', () => {
    const words = Array.from({ length: 20 }, () => v({}));
    const history: ReviewHistory[] = Array.from({ length: 25 }, (_, i) => ({
      id: `h${i}`,
      vocabularyId: `reviewed${i}`,
      reviewedAt: today.toISOString(),
      oldDifficulty: 'hard',
      newDifficulty: 'hard',
      reviewMode: 'flashcard',
      isCorrect: null,
      sessionType: 'daily',
    }));
    const reviewedWords = history.map((h) => v({ id: h.vocabularyId, nextReviewAt: dayOffset(1) }));
    const plan = getTodayPlan([...words, ...reviewedWords], history, 30, today);
    expect(plan.reviewedTodayIds).toHaveLength(25);
    expect(plan.selected).toHaveLength(5);
    expect(plan.waiting).toHaveLength(15);
  });
});
