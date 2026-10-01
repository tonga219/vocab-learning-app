import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText, CalendarClock, Check, ChevronDown, Coffee, FolderPlus } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { useToday } from '../hooks/useToday';
import { countByDifficulty, getTodayPlan } from '../utils/dailyPriority';
import { diffInCalendarDays, formatLongDate } from '../utils/date';
import { PageContainer } from '../components/Layout';
import { Button, buttonClass } from '../components/Button';
import { StudyModeSelector } from '../components/StudyModeSelector';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { EmptyState } from '../components/EmptyState';
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty, type Vocabulary } from '../types';
import { cn } from '../utils/cn';

const SHADE: Record<Difficulty, string> = { hard: 'bg-blue-700', medium: 'bg-blue-500', easy: 'bg-blue-300' };

function Breakdown({ counts, total }: { counts: Record<Difficulty, number>; total: number }) {
  return (
    <div>
      <div className="flex h-2 w-full max-w-[360px] gap-[3px] overflow-hidden rounded-full" aria-hidden>
        {DIFFICULTIES.filter((d) => counts[d] > 0).map((d) => (
          <div key={d} className={cn('h-full rounded-full transition-all duration-700', SHADE[d])} style={{ flexGrow: counts[d] / total }} />
        ))}
      </div>
      <dl className="mt-4 flex gap-6 sm:gap-8">
        {DIFFICULTIES.map((d) => (
          <div key={d} className="flex flex-col gap-1">
            <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <span className={cn('h-2 w-2 rounded-full', SHADE[d])} aria-hidden />
              {DIFFICULTY_LABEL[d]}
            </dt>
            <dd className="tabular text-xl font-semibold tracking-tight text-ink">{counts[d]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CardStackPreview({ words }: { words: Vocabulary[] }) {
  const top = words[0];
  if (!top) return null;
  return (
    <div className="relative mr-4 hidden h-[188px] w-[244px] shrink-0 md:block lg:w-[264px]" aria-hidden>
      <div className="absolute inset-0 translate-x-5 translate-y-4 rotate-[6deg] rounded-2xl border border-slate-200 bg-white shadow-soft" />
      <div className="absolute inset-0 translate-x-2.5 translate-y-2 rotate-[3deg] rounded-2xl border border-slate-200 bg-white shadow-soft" />
      <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1">
        <span className="eyebrow">First up</span>
        <div className="mt-3 h-px bg-gradient-to-r from-blue-200 to-transparent" />
        <div className="flex flex-1 items-center justify-center">
          <span className="text-center text-[26px] font-semibold tracking-tight text-ink">{top.term}</span>
        </div>
      </div>
    </div>
  );
}

function OverviewStat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
      <div className="text-[13px] font-medium text-muted">{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-0.5 hidden text-xs text-slate-400 sm:block">{hint}</div>}
    </div>
  );
}

function nextUpcoming(vocabulary: Vocabulary[], today: Date) {
  let minDays = Infinity;
  let count = 0;
  for (const v of vocabulary) {
    const days = diffInCalendarDays(v.nextReviewAt, today);
    if (days <= 0) continue;
    if (days < minDays) {
      minDays = days;
      count = 1;
    } else if (days === minDays) count += 1;
  }
  return minDays === Infinity ? null : { days: minDays, count };
}

export function TodayPage() {
  const { data, updateSettings } = useAppData();
  const { sourceLabel } = useLibrary();
  const today = useToday();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const plan = useMemo(
    () => getTodayPlan(data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, today),
    [data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, today],
  );
  const counts = useMemo(() => countByDifficulty(plan.selected), [plan.selected]);
  const sourceCount = useMemo(() => new Set(plan.selected.map((v) => v.studySetId)).size, [plan.selected]);
  const upcoming = useMemo(() => nextUpcoming(data.vocabulary, today), [data.vocabulary, today]);
  const mode = data.settings.preferredReviewMode;
  const reviewedToday = plan.reviewedTodayIds.length;
  const total = plan.selected.length;
  const visibleWords = showAll ? plan.selected : plan.selected.slice(0, 8);

  const upcomingText = upcoming
    ? `Next review ${upcoming.days === 1 ? 'tomorrow' : `in ${upcoming.days} days`} · ${upcoming.count} ${upcoming.count === 1 ? 'word' : 'words'}`
    : null;

  return (
    <PageContainer>
      <header className="mb-6 sm:mb-8">
        <p className="text-sm font-medium text-muted">{formatLongDate(today)}</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[38px]">Today</h1>
      </header>

      {data.vocabulary.length === 0 ? (
        <section className="rounded-[28px] border border-line bg-white shadow-soft">
          <EmptyState
            icon={<FolderPlus size={24} />}
            title="Nothing to review yet"
            description="Add vocabulary to a Study Set and Cadence will pick the words you should review each day."
            action={
              <Link to="/library" className={buttonClass()}>
                <BookOpenText size={16} aria-hidden />
                Go to Library
              </Link>
            }
          />
        </section>
      ) : total === 0 ? (
        <section className="relative overflow-hidden rounded-[28px] border border-line bg-white px-6 py-12 text-center shadow-soft sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/80 to-transparent" aria-hidden />
          <div className="relative mx-auto flex h-16 w-16 animate-ring-pop items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)]">
            {reviewedToday > 0 ? <Check size={30} strokeWidth={2.6} /> : <Coffee size={26} />}
          </div>
          <h2 className="relative mt-6 text-2xl font-semibold tracking-[-0.02em] text-ink">
            {reviewedToday > 0 ? "Today's review complete" : "You're all caught up."}
          </h2>
          <p className="relative mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
            {reviewedToday > 0
              ? `You reviewed ${reviewedToday} ${reviewedToday === 1 ? 'word' : 'words'} today.`
              : 'No vocabulary is due today. Enjoy the break.'}
            {plan.waiting.length > 0 &&
              ` ${plan.waiting.length} more ${plan.waiting.length === 1 ? 'word is' : 'words are'} waiting and will be prioritized tomorrow.`}
          </p>
          {upcomingText && (
            <p className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-[13px] font-medium text-slate-600">
              <CalendarClock size={14} aria-hidden />
              {upcomingText}
            </p>
          )}
        </section>
      ) : (
        <section
          aria-labelledby="today-review-heading"
          className="relative overflow-hidden rounded-[28px] border border-line bg-white shadow-lift"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-50 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-8 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 id="today-review-heading" className="eyebrow text-blue-700">
                Today's review
              </h2>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="tabular text-[76px] font-semibold leading-none tracking-[-0.05em] text-ink sm:text-[96px]">{total}</span>
                <span className="text-lg font-medium text-slate-500">{total === 1 ? 'word' : 'words'} to review</span>
              </div>
              <div className="mt-7">
                <Breakdown counts={counts} total={total} />
              </div>
            </div>
            <CardStackPreview words={plan.selected} />
          </div>

          <div className="relative flex flex-col gap-3 border-t border-line/80 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-5">
            <StudyModeSelector
              value={mode}
              onChange={(m) => updateSettings({ preferredReviewMode: m })}
              className="w-full sm:w-auto"
            />
            <Button
              size="lg"
              className="h-12 w-full sm:w-auto sm:min-w-[200px]"
              onClick={() => navigate(`/review/${mode}`)}
              iconRight={<ArrowRight size={18} aria-hidden />}
            >
              Start review
            </Button>
          </div>
        </section>
      )}

      {data.vocabulary.length > 0 && (
        <section className="mt-10" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-[15px] font-semibold tracking-tight text-ink">
            Today's overview
          </h2>
          <div className="mt-3 flex divide-x divide-line rounded-2xl border border-line bg-white">
            <OverviewStat label="Due" value={plan.due.length} hint="Ready for review now" />
            <OverviewStat label="Selected today" value={total} hint={limitHint(data.settings.dailyReviewLimit, reviewedToday)} />
            <OverviewStat label="Waiting" value={plan.waiting.length} hint="Stay overdue for tomorrow" />
          </div>
          {reviewedToday > 0 && total > 0 && (
            <p className="mt-3 text-[13px] text-muted">
              {reviewedToday} already reviewed today — you can pick up where you left off.
            </p>
          )}
        </section>
      )}

      {total > 0 && (
        <section className="mt-10" aria-labelledby="words-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="words-heading" className="text-[15px] font-semibold tracking-tight text-ink">
              Today's words
            </h2>
            <span className="text-[13px] text-muted">
              From {sourceCount} Study {sourceCount === 1 ? 'Set' : 'Sets'} · by priority
            </span>
          </div>
          <ol className="mt-3 grid overflow-hidden rounded-2xl border border-line bg-white sm:grid-cols-2">
            {visibleWords.map((v, i) => (
              <li
                key={v.id}
                className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-b-0 sm:px-5 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0 sm:odd:border-r"
              >
                <span className="tabular w-5 shrink-0 text-right text-xs font-medium text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div lang="en" className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {v.term}
                  </div>
                  <div className="truncate text-xs text-muted">{sourceLabel(v)}</div>
                </div>
                <DifficultyMeter difficulty={v.difficulty} />
              </li>
            ))}
          </ol>
          {plan.selected.length > 8 && (
            <div className="mt-3 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                {showAll ? 'Show less' : `Show all ${plan.selected.length}`}
                <ChevronDown size={15} className={cn('transition-transform duration-200', showAll && 'rotate-180')} aria-hidden />
              </Button>
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
}

function limitHint(limit: number | null, reviewed: number) {
  const base = limit === null ? 'No daily limit' : `Daily limit ${limit}`;
  return reviewed > 0 ? `${base} · ${reviewed} done` : base;
}
