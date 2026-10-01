import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import type { Difficulty, ReviewMode, SessionType } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { useLibrary } from '../../hooks/useLibrary';
import { useStudySession } from '../../hooks/useStudySession';
import { SessionShell } from '../SessionShell';
import { SessionComplete } from '../SessionComplete';
import { EmptyState } from '../EmptyState';
import { buttonClass } from '../Button';
import { FlashcardStudy } from './FlashcardStudy';
import { DictationStudy } from './DictationStudy';

interface Props {
  wordIds: string[];
  mode: ReviewMode;
  sessionType: SessionType;
  title: string;
  exitTo: string;
  exitLabel: string;
  completeTitle: string;
  emptyTitle: string;
}

export function StudyScreen({ wordIds, mode, sessionType, title, exitTo, exitLabel, completeTitle, emptyTitle }: Props) {
  const { data, setDifficulty, updateSettings } = useAppData();
  const { sourceLabel } = useLibrary();
  const session = useStudySession(wordIds, mode, sessionType);
  const { current } = session;

  const changeDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (current) setDifficulty(current.id, difficulty);
    },
    [current, setDifficulty],
  );

  if (session.finished) {
    const correct = mode === 'dictation' ? session.reviewedWords.filter((w) => session.results[w.id]?.correct).length : null;
    return (
      <SessionShell exitTo={exitTo} exitLabel={exitLabel} title={title}>
        <SessionComplete
          title={completeTitle}
          reviewed={session.reviewedWords}
          correct={correct}
          backTo={exitTo}
          backLabel={exitLabel}
        />
      </SessionShell>
    );
  }

  if (!current) {
    return (
      <SessionShell exitTo={exitTo} exitLabel={exitLabel} title={title}>
        <EmptyState
          className="flex-1 justify-center"
          icon={<Inbox size={24} />}
          title={emptyTitle}
          action={
            <Link to={exitTo} className={buttonClass({ variant: 'secondary' })}>
              {exitLabel}
            </Link>
          }
        />
      </SessionShell>
    );
  }

  return (
    <SessionShell
      exitTo={exitTo}
      exitLabel={exitLabel}
      title={title}
      progress={{ current: session.index + 1, total: session.total, completed: session.completedCount }}
    >
      {mode === 'flashcard' ? (
        <FlashcardStudy
          word={current}
          source={sourceLabel(current)}
          front={data.settings.flashcardFront}
          onFrontChange={(flashcardFront) => updateSettings({ flashcardFront })}
          onDifficultyChange={changeDifficulty}
          canGoBack={session.index > 0}
          isLast={session.isLast}
          enterFrom={session.direction}
          onPrevious={session.previous}
          onNext={session.next}
        />
      ) : (
        <DictationStudy
          word={current}
          source={sourceLabel(current)}
          result={session.results[current.id]}
          onCheck={(r) => session.setResult(current.id, r)}
          onDifficultyChange={changeDifficulty}
          isLast={session.isLast}
          onNext={session.next}
        />
      )}
    </SessionShell>
  );
}
