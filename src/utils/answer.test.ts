import { describe, expect, it } from 'vitest';
import { answerKey, diffChars, isCorrectAnswer } from './answer';

describe('isCorrectAnswer', () => {
  it('ignores case, spacing and trailing punctuation', () => {
    expect(isCorrectAnswer('  Deteriorate. ', 'deteriorate')).toBe(true);
    expect(isCorrectAnswer('interest   rate', 'interest rate')).toBe(true);
    expect(isCorrectAnswer('deteroriate', 'deteriorate')).toBe(false);
    expect(isCorrectAnswer('', 'deteriorate')).toBe(false);
  });
});

describe('dictation checking rules', () => {
  it('ignores anything in parentheses', () => {
    expect(isCorrectAnswer('deteriorate', 'deteriorate (v)')).toBe(true);
    expect(isCorrectAnswer('look up', 'look up (phrasal verb)')).toBe(true);
    expect(isCorrectAnswer('deteriorate (v)', 'deteriorate (v)')).toBe(true);
    expect(isCorrectAnswer('deteriorate', '(to) deteriorate')).toBe(true);
  });
  it('ignores case, periods and hyphen vs space', () => {
    expect(isCorrectAnswer('Cutting Edge', 'cutting-edge')).toBe(true);
    expect(isCorrectAnswer('cutting-edge', 'cutting edge')).toBe(true);
    expect(isCorrectAnswer('etc', 'etc.')).toBe(true);
    expect(isCorrectAnswer('U.S.', 'us')).toBe(true);
  });
  it('checks only the first line', () => {
    expect(isCorrectAnswer('look up', 'look up\n(phrasal verb) to search for information')).toBe(true);
    expect(isCorrectAnswer('look up to search', 'look up\nto search')).toBe(false);
  });
  it('still requires every letter to match', () => {
    expect(isCorrectAnswer('deteriorte', 'deteriorate (v)')).toBe(false);
    expect(isCorrectAnswer('cuttingedge', 'cutting-edge')).toBe(false);
    expect(isCorrectAnswer('look', 'look up')).toBe(false);
  });
  it('keeps the parentheses-free key for display', () => {
    expect(answerKey('look up (phrasal verb)\nexample')).toBe('look up');
  });
});

describe('diffChars', () => {
  it('flags extra characters', () => {
    const wrong = diffChars('deteroriate', 'deteriorate').filter((c) => !c.ok).map((c) => c.char);
    expect(wrong.length).toBeGreaterThan(0);
    expect(diffChars('abc', 'abc').every((c) => c.ok)).toBe(true);
  });
});
