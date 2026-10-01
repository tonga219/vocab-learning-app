import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { getTodayPlan } from '../utils/dailyPriority';
import { StudyScreen } from '../components/study/StudyScreen';
import type { ReviewMode } from '../types';
import { NotFound } from './NotFound';

const isMode = (m: string | undefined): m is ReviewMode => m === 'flashcard' || m === 'dictation';

/** Today's Daily Review: the priority engine's selection across ALL Study Sets. */
export function DailyReviewPage() {
  const { mode } = useParams();
  const { data } = useAppData();
  // Snapshot the selection when the session starts so it stays stable.
  const [ids] = useState(() =>
    getTodayPlan(data.vocabulary, data.reviewHistory, data.settings.dailyReviewLimit, new Date()).selected.map((v) => v.id),
  );
  if (!isMode(mode)) return <Navigate to="/" replace />;
  return (
    <StudyScreen
      wordIds={ids}
      mode={mode}
      sessionType="daily"
      title={mode === 'flashcard' ? "Today's review · Flashcard" : "Today's review · Dictation"}
      exitTo="/"
      exitLabel="Back to Today"
      completeTitle="Today's review complete"
      emptyTitle="Nothing left to review today"
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
