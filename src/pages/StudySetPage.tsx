import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Keyboard, Layers, Plus, ListPlus } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { useToast } from '../hooks/useToast';
import { PageContainer, PageHeader } from '../components/Layout';
import { BackLink } from '../components/BackLink';
import { buttonClass } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { DefinitionToggle } from '../components/Toggle';
import { VocabularyRow } from '../components/VocabularyRow';
import { EditVocabularyDialog } from '../components/EditVocabularyDialog';
import { NotFound } from './NotFound';
import { formatShortDate } from '../utils/date';
import { countByDifficulty } from '../utils/dailyPriority';
import { DIFFICULTIES, DIFFICULTY_LABEL, type Vocabulary } from '../types';
import { cn } from '../utils/cn';

function LearnTile({
  to,
  icon,
  title,
  description,
  disabled,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled: boolean;
}) {
  const className = cn(
    'group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-soft transition-all duration-200 sm:p-5',
    disabled ? 'pointer-events-none opacity-50' : 'hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lift active:translate-y-0',
  );
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.6)] transition-transform duration-200 group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[13px] text-muted">{description}</span>
      </span>
      <ArrowRight size={18} className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden />
    </>
  );
  return disabled ? (
    <div className={className} aria-disabled>
      {content}
    </div>
  ) : (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
}

export function StudySetPage() {
  const { folderId = '', setId = '' } = useParams();
  const { setDifficulty, updateVocabularyText, deleteVocabulary } = useAppData();
  const { folderById, setById, vocabOf } = useLibrary();
  const toast = useToast();
  const [showDefinitions, setShowDefinitions] = useState(true);
  const [editing, setEditing] = useState<Vocabulary | null>(null);

  const set = setById.get(setId);
  const folder = folderById.get(folderId);
  const words = set ? vocabOf(set.id) : [];
  const counts = useMemo(() => countByDifficulty(words), [words]);

  if (!set || !folder || set.folderId !== folder.id) return <NotFound what="Study Set" />;
  const base = `/library/${folder.id}/${set.id}`;
  const empty = words.length === 0;

  return (
    <PageContainer>
      <PageHeader
        back={<BackLink to={`/library/${folder.id}`} label={folder.name} />}
        title={set.name}
        subtitle={
          <span className="tabular">
            Created {formatShortDate(set.createdAt)} · {words.length} {words.length === 1 ? 'word' : 'words'}
          </span>
        }
        actions={
          !empty && (
            <Link to={`${base}/add`} className={buttonClass({ variant: 'secondary' })}>
              <Plus size={16} aria-hidden />
              <span className="hidden sm:inline">Add vocabulary</span>
              <span className="sm:hidden">Add</span>
            </Link>
          )
        }
      />

      <section aria-labelledby="learn-heading">
        <h2 id="learn-heading" className="eyebrow mb-3">
          Learn
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <LearnTile
            to={`/study/${set.id}/flashcard`}
            icon={<Layers size={20} aria-hidden />}
            title="Flashcard"
            description="Flip through every card"
            disabled={empty}
          />
          <LearnTile
            to={`/study/${set.id}/dictation`}
            icon={<Keyboard size={20} aria-hidden />}
            title="Dictation"
            description="See Vietnamese, type English"
            disabled={empty}
          />
        </div>
      </section>

      <section aria-labelledby="overview-heading" className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div>
            <h2 id="overview-heading" className="eyebrow">
              Vocabulary overview
            </h2>
            {!empty && (
              <p className="tabular mt-1 text-[13px] text-muted">
                {DIFFICULTIES.map((d) => `${DIFFICULTY_LABEL[d]} ${counts[d]}`).join(' · ')}
              </p>
            )}
          </div>
          {!empty && <DefinitionToggle checked={showDefinitions} onChange={setShowDefinitions} />}
        </div>

        {empty ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60">
            <EmptyState
              icon={<ListPlus size={24} />}
              title="Your Study Set is empty."
              description="Add a few words — each new word starts as Hard and joins your daily review."
              action={
                <Link to={`${base}/add`} className={buttonClass()}>
                  <Plus size={16} aria-hidden />
                  Add vocabulary
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              {words.map((v) => (
                <VocabularyRow
                  key={v.id}
                  vocab={v}
                  showDefinition={showDefinitions}
                  onEdit={setEditing}
                  onDifficultyChange={setDifficulty}
                />
              ))}
            </ul>
            <p className="mt-3 text-center text-xs text-slate-400">Tap a word to edit it.</p>
          </>
        )}
      </section>

      <EditVocabularyDialog
        vocab={editing}
        onClose={() => setEditing(null)}
        onSave={(id, term, definition) => {
          updateVocabularyText(id, { term, definition });
          toast('Vocabulary saved');
        }}
        onDelete={(id) => {
          deleteVocabulary(id);
          setEditing(null);
          toast('Vocabulary deleted');
        }}
      />
    </PageContainer>
  );
}
