import { useMemo, useState } from 'react';
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { EXTRA_REVIEW_SIZE, getExtraReview, getTodayPlan } from '../utils/dailyPriority';
import { StudyScreen } from '../components/study/StudyScreen';
import type { ReviewMode } from '../types';
import { NotFound } from './NotFound';

const isMode = (m: string | undefined): m is ReviewMode => m === 'flashcard' || m === 'dictation';

/** Today's Daily Review: the priority engine's selection across ALL Study Sets. */
export function DailyReviewPage() {
  // A new session (e.g. "Review 10 more" from the completion screen) gets fresh state.
  const location = useLocation();
  return <DailyReviewSession key={location.key} />;
}

function DailyReviewSession() {
  const { mode } = useParams();
  const [params] = useSearchParams();
  const extra = params.get('extra') === '1';
  const { data } = useAppData();
  // Snapshot the selection when the session starts so it stays stable.
  const [ids] = useState(() => {
    const plan = getTodayPlan(data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, new Date());
    return (extra ? getExtraReview(plan) : plan.selected).map((v) => v.id);
  });
  // Live count of words still waiting, for the "Review more" offer when finished.
  const waiting = useMemo(
    () => getTodayPlan(data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, new Date()).waiting.length,
    [data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit],
  );
  if (!isMode(mode)) return <Navigate to="/" replace />;
  const label = mode === 'flashcard' ? 'Flashcard' : 'Dictation';
  return (
    <StudyScreen
      wordIds={ids}
      mode={mode}
      sessionType="daily"
      title={extra ? `Extra review · ${label}` : `Today's review · ${label}`}
      exitTo="/"
      exitLabel="Back to Today"
      completeTitle={extra ? 'Extra review complete' : "Today's review complete"}
      emptyTitle="Nothing left to review today"
      moreAction={
        waiting > 0
          ? { to: `/review/${mode}?extra=1`, label: `Review ${Math.min(EXTRA_REVIEW_SIZE, waiting)} more` }
          : undefined
      }
    />
  );
}

/** Manual study of one Study Set — separate from the Daily Review. */
export function ManualStudyPage() {
  const { setId = '', mode } = useParams();
  const { setById, vocabOf } = useLibrary();
  const set = setById.get(setId);
  const [ids] = useState(() => vocabOf(setId).map((v) => v.id));
  if (!set) return <NotFound what="Study Set" />;
  if (!isMode(mode)) return <Navigate to={`/library/${set.folderId}/${set.id}`} replace />;
  const back = `/library/${set.folderId}/${set.id}`;
  return (
    <StudyScreen
      wordIds={ids}
      mode={mode}
      sessionType="manual"
      title={`${set.name} · ${mode === 'flashcard' ? 'Flashcard' : 'Dictation'}`}
      exitTo={back}
      exitLabel="Back to Study Set"
      completeTitle="Session complete"
      emptyTitle="This Study Set is empty"
    />
  );
}
