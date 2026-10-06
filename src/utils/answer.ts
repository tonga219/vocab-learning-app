/**
 * The part of a term that dictation checks: the first line only, with
 * anything in parentheses removed. "deteriorate (v)" → "deteriorate",
 * "look up (phrasal verb)\nexample…" → "look up".
 */
export function answerKey(term: string): string {
  const firstLine = term.split(/\r?\n/).find((line) => line.trim()) ?? '';
  return firstLine
    .replace(/\([^)]*\)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text for comparison. Ignores letter case, periods, hyphens vs
 * spaces, extra spaces and surrounding punctuation. Every letter must still match.
 */
export function normalizeAnswer(text: string): string {
  return answerKey(text)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\./g, '')
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:!?"']+|[\s,;:!?"']+$/g, '')
    .trim();
}

/** Exact match after normalization (no typo tolerance). */
export function isCorrectAnswer(answer: string, term: string): boolean {
  const a = normalizeAnswer(answer);
  if (!a) return false;
  const key = answerKey(term);
  // Accept any of the alternatives in "a / b" style terms.
  const options = [key, ...key.split('/')].map(normalizeAnswer).filter(Boolean);
  return options.includes(a);
}

/**
 * Marks which characters of `answer` are not part of the longest common
 * subsequence with `target` — used to highlight typos.
 */
export function diffChars(answer: string, target: string): { char: string; ok: boolean }[] {
  const a = answer.toLowerCase();
  const b = target.toLowerCase();
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { char: string; ok: boolean }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      out.push({ char: answer[i], ok: true });
      i++;
      j++;
    } else if (j < b.length && dp[i][j + 1] >= dp[i + 1][j]) j++;
    else {
      out.push({ char: answer[i], ok: false });
      i++;
    }
  }
  return out;
}
