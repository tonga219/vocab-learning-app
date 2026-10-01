import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Folder as FolderIcon, FolderPlus, Plus } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { useToast } from '../hooks/useToast';
import { PageContainer, PageHeader } from '../components/Layout';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { NameDialog } from '../components/NameDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RowMenu } from '../components/RowMenu';
import type { Folder } from '../types';

export function LibraryPage() {
  const { createFolder, renameFolder, deleteFolder } = useAppData();
  const { folders, setsOf, countInFolder } = useLibrary();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Library"
        subtitle="Folders and Study Sets"
        actions={
          folders.length > 0 && (
            <Button icon={<Plus size={16} aria-hidden />} onClick={() => setCreating(true)}>
              <span className="hidden sm:inline">New folder</span>
              <span className="sm:hidden">New</span>
            </Button>
          )
        }
      />

      {folders.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60">
          <EmptyState
            icon={<FolderPlus size={24} />}
            title="No folders yet"
            description="Create your first folder to organize your vocabulary."
            action={
              <Button icon={<Plus size={16} aria-hidden />} onClick={() => setCreating(true)}>
                Create folder
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {folders.map((folder) => {
            const sets = setsOf(folder.id).length;
            const words = countInFolder(folder.id);
            return (
              <li key={folder.id} className="group relative">
                <Link
                  to={`/library/${folder.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 pr-14 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift active:translate-y-0 sm:p-5 sm:pr-14"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <FolderIcon size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">{folder.name}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {sets} Study {sets === 1 ? 'Set' : 'Sets'} · {words} {words === 1 ? 'word' : 'words'}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" aria-hidden />
                </Link>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                  <RowMenu label={folder.name} onRename={() => setRenaming(folder)} onDelete={() => setDeleting(folder)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NameDialog
        open={creating}
        title="New folder"
        label="Folder name"
        placeholder="e.g. IELTS"
        submitLabel="Create folder"
        onSubmit={(name) => {
          createFolder(name);
          toast(`Folder "${name}" created`);
        }}
        onClose={() => setCreating(false)}
      />
      <NameDialog
        open={!!renaming}
        title="Rename folder"
        label="Folder name"
        initialValue={renaming?.name}
        submitLabel="Save"
        onSubmit={(name) => renaming && renameFolder(renaming.id, name)}
        onClose={() => setRenaming(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={
          deleting &&
          `This permanently deletes the folder, its ${setsOf(deleting.id).length} Study Sets and ${countInFolder(deleting.id)} words.`
        }
        confirmLabel="Delete folder"
        onConfirm={() => {
          if (deleting) {
            deleteFolder(deleting.id);
            toast('Folder deleted');
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
