import { describe, expect, it } from 'vitest';
import type { Vocabulary } from '../types';
import { addDays, diffInCalendarDays, startOfDay } from './date';
import { calculateNextReview, changeDifficulty, completeReview, createNewVocabularyFields, getReviewInterval } from './spacedRepetition';

const now = new Date(2026, 9, 1, 14, 30);

function vocab(partial: Partial<Vocabulary> = {}): Vocabulary {
  return {
    id: 'v1',
    studySetId: 's1',
    term: 'deteriorate',
    definition: 'xấu đi',
    ...createNewVocabularyFields(now),
    ...partial,
  };
}

const daysUntil = (iso: string) => diffInCalendarDays(iso, now);

describe('getReviewInterval', () => {
  it('follows the hard schedule 1 → 3 → 7 → 30 → 60 → 60', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map((s) => getReviewInterval('hard', s))).toEqual([1, 3, 7, 30, 60, 60, 60]);
  });
  it('follows the medium schedule 3 → 30 → 60 → 60', () => {
    expect([1, 2, 3, 4, 8].map((s) => getReviewInterval('medium', s))).toEqual([3, 30, 60, 60, 60]);
  });
  it('follows the easy schedule 7 → 60 → 60', () => {
    expect([1, 2, 3, 7].map((s) => getReviewInterval('easy', s))).toEqual([7, 60, 60, 60]);
  });
});

describe('calculateNextReview', () => {
  it('returns local midnight of today + interval', () => {
    const next = new Date(calculateNextReview('hard', 3, now));
    expect(next.getTime()).toBe(addDays(startOfDay(now), 7).getTime());
  });
});

describe('new vocabulary', () => {
  it('defaults to hard, stage 0, due today', () => {
    const v = vocab();
    expect(v.difficulty).toBe('hard');
    expect(v.reviewStage).toBe(0);
    expect(v.lastReviewedAt).toBeNull();
    expect(daysUntil(v.nextReviewAt)).toBe(0);
  });
});

describe('completeReview', () => {
  it('walks the hard schedule from a new word', () => {
    let v = vocab();
    const seen: number[] = [];
    for (let i = 0; i < 7; i++) {
      v = completeReview(v, now);
      seen.push(daysUntil(v.nextReviewAt));
    }
    expect(seen).toEqual([1, 3, 7, 30, 60, 60, 60]);
    expect(v.lastReviewedAt).toBe(now.toISOString());
  });

  it('confirms stage 1 of a difficulty changed during the card', () => {
    const snapshot = vocab({ reviewStage: 2 });
    const changed = changeDifficulty(snapshot, 'medium', now);
    const reviewed = completeReview(changed, now, { snapshot });
    expect(reviewed.difficulty).toBe('medium');
    expect(reviewed.reviewStage).toBe(1);
    expect(daysUntil(reviewed.nextReviewAt)).toBe(3);
  });

  it('advances from the snapshot when difficulty was toggled back', () => {
    const snapshot = vocab({ reviewStage: 2 });
    const toggled = changeDifficulty(changeDifficulty(snapshot, 'easy', now), 'hard', now);
    const reviewed = completeReview(toggled, now, { snapshot });
    expect(reviewed.reviewStage).toBe(3);
    expect(daysUntil(reviewed.nextReviewAt)).toBe(7);
  });

  it('does not advance a word that is not due when advanceWhenNotDue is false', () => {
    const future = vocab({ reviewStage: 2, nextReviewAt: addDays(startOfDay(now), 5).toISOString() });
    const reviewed = completeReview(future, now, { advanceWhenNotDue: false });
    expect(reviewed.reviewStage).toBe(2);
    expect(reviewed.nextReviewAt).toBe(future.nextReviewAt);
    expect(reviewed.lastReviewedAt).toBe(now.toISOString());
  });
});

describe('changeDifficulty', () => {
  it('resets to stage 1 of the new schedule without counting as a review', () => {
    const v = vocab({ reviewStage: 4, lastReviewedAt: '2026-09-01T00:00:00.000Z' });
    const easy = changeDifficulty(v, 'easy', now);
    expect(easy.reviewStage).toBe(1);
    expect(daysUntil(easy.nextReviewAt)).toBe(7);
    expect(easy.lastReviewedAt).toBe(v.lastReviewedAt);
    const hard = changeDifficulty(easy, 'hard', now);
    expect(daysUntil(hard.nextReviewAt)).toBe(1);
  });
  it('is a no-op when difficulty is unchanged', () => {
    const v = vocab();
    expect(changeDifficulty(v, 'hard', now)).toBe(v);
  });
});
