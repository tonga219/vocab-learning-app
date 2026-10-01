import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Layers, Plus } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { useToast } from '../hooks/useToast';
import { PageContainer, PageHeader } from '../components/Layout';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { NameDialog } from '../components/NameDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RowMenu } from '../components/RowMenu';
import { NotFound } from './NotFound';
import { formatShortDate } from '../utils/date';
import type { StudySet } from '../types';

export function FolderPage() {
  const { folderId = '' } = useParams();
  const { createStudySet, renameStudySet, deleteStudySet } = useAppData();
  const { folderById, setsOf, vocabOf } = useLibrary();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<StudySet | null>(null);
  const [deleting, setDeleting] = useState<StudySet | null>(null);

  const folder = folderById.get(folderId);
  if (!folder) return <NotFound what="folder" />;
  const sets = setsOf(folder.id);

  return (
    <PageContainer>
      <PageHeader
        back={<BackLink to="/library" label="Library" />}
        title={folder.name}
        subtitle={`${sets.length} Study ${sets.length === 1 ? 'Set' : 'Sets'}`}
        actions={
          sets.length > 0 && (
            <Button icon={<Plus size={16} aria-hidden />} onClick={() => setCreating(true)}>
              <span className="hidden sm:inline">New Study Set</span>
              <span className="sm:hidden">New</span>
            </Button>
          )
        }
      />

      {sets.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60">
          <EmptyState
            icon={<Layers size={24} />}
            title="No Study Sets yet"
            description={`Create a Study Set inside ${folder.name} to start adding vocabulary.`}
            action={
              <Button icon={<Plus size={16} aria-hidden />} onClick={() => setCreating(true)}>
                Create Study Set
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          {sets.map((set) => {
            const count = vocabOf(set.id).length;
            return (
              <li key={set.id} className="group relative border-b border-line/70 last:border-b-0">
                <Link
                  to={`/library/${folder.id}/${set.id}`}
                  className="flex items-center gap-4 px-4 py-4 pr-14 transition-colors hover:bg-slate-50 sm:px-5 sm:pr-16"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-soft transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                    <Layers size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{set.name}</span>
                    <span className="tabular mt-0.5 block text-[13px] text-muted">
                      {formatShortDate(set.createdAt)} · {count} {count === 1 ? 'word' : 'words'}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                  <RowMenu label={set.name} onRename={() => setRenaming(set)} onDelete={() => setDeleting(set)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NameDialog
        open={creating}
        title="New Study Set"
        label="Study Set name"
        placeholder="e.g. Environment"
        submitLabel="Create Study Set"
        onSubmit={(name) => {
          createStudySet(folder.id, name);
          toast(`Study Set "${name}" created`);
        }}
        onClose={() => setCreating(false)}
      />
      <NameDialog
        open={!!renaming}
        title="Rename Study Set"
        label="Study Set name"
        initialValue={renaming?.name}
        submitLabel="Save"
        onSubmit={(name) => renaming && renameStudySet(renaming.id, name)}
        onClose={() => setRenaming(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={deleting && `This permanently deletes the Study Set and its ${vocabOf(deleting.id).length} words.`}
        confirmLabel="Delete Study Set"
        onConfirm={() => {
          if (deleting) {
            deleteStudySet(deleting.id);
            toast('Study Set deleted');
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
