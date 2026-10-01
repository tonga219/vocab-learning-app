import { describe, expect, it } from 'vitest';
import { diffChars, isCorrectAnswer } from './answer';

describe('isCorrectAnswer', () => {
  it('ignores case, spacing and trailing punctuation', () => {
    expect(isCorrectAnswer('  Deteriorate. ', 'deteriorate')).toBe(true);
    expect(isCorrectAnswer('interest   rate', 'interest rate')).toBe(true);
    expect(isCorrectAnswer('deteroriate', 'deteriorate')).toBe(false);
    expect(isCorrectAnswer('', 'deteriorate')).toBe(false);
  });
});

describe('diffChars', () => {
  it('flags extra characters', () => {
    const wrong = diffChars('deteroriate', 'deteriorate').filter((c) => !c.ok).map((c) => c.char);
    expect(wrong.length).toBeGreaterThan(0);
    expect(diffChars('abc', 'abc').every((c) => c.ok)).toBe(true);
  });
});
