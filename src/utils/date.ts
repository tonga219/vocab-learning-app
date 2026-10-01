import type { ISODateString } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight of the given date. */
export function startOfDay(date: Date | ISODateString): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Adds calendar days (DST-safe because it uses setDate). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function diffInCalendarDays(to: Date | ISODateString, from: Date | ISODateString): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function isSameDay(a: Date | ISODateString, b: Date | ISODateString): boolean {
  return diffInCalendarDays(a, b) === 0;
}

export function formatLongDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayMonth = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${weekday}, ${dayMonth}`;
}

/** dd/mm/yyyy */
export function formatShortDate(date: Date | ISODateString): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Human description of when a review is due, relative to `now`. */
export function formatRelativeDue(next: ISODateString, now: Date = new Date()): string {
  const days = diffInCalendarDays(next, now);
  if (days < -1) return `Overdue by ${-days} days`;
  if (days === -1) return 'Overdue by 1 day';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
