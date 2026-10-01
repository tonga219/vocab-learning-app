import { useEffect, useId, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Vocabulary } from '../types';
import { DIFFICULTY_LABEL } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { formatRelativeDue } from '../utils/date';

interface Props {
  vocab: Vocabulary | null;
  onClose: () => void;
  onSave: (id: string, term: string, definition: string) => void;
  onDelete: (id: string) => void;
}

export const inputClass =
  'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export function EditVocabularyDialog({ vocab, onClose, onSave, onDelete }: Props) {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [confirming, setConfirming] = useState(false);
  const termId = useId();
  const defId = useId();

  useEffect(() => {
    if (vocab) {
      setTerm(vocab.term);
      setDefinition(vocab.definition);
    }
  }, [vocab]);

  const valid = term.trim() && definition.trim();
  const save = () => {
    if (!vocab || !valid) return;
    onSave(vocab.id, term, definition);
    onClose();
  };

  return (
    <>
      <Modal
        open={!!vocab && !confirming}
        onClose={onClose}
        title="Edit vocabulary"
        description={
          vocab && (
            <span className="tabular">
              {DIFFICULTY_LABEL[vocab.difficulty]} · {vocab.reviewStage === 0 ? 'New' : `Stage ${vocab.reviewStage}`} ·{' '}
              {formatRelativeDue(vocab.nextReviewAt)}
            </span>
          )
        }
        footer={
          <>
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto"
              icon={<Trash2 size={15} aria-hidden />}
              onClick={() => setConfirming(true)}
            >
              Delete vocabulary
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!valid}>
              Save
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div>
            <label htmlFor={termId} className="mb-1.5 block text-[13px] font-medium text-slate-600">
              Term
            </label>
            <input id={termId} lang="en" value={term} onChange={(e) => setTerm(e.target.value)} className={inputClass} autoComplete="off" />
          </div>
          <div>
            <label htmlFor={defId} className="mb-1.5 block text-[13px] font-medium text-slate-600">
              Definition
            </label>
            <input id={defId} lang="vi" value={definition} onChange={(e) => setDefinition(e.target.value)} className={inputClass} autoComplete="off" />
          </div>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>
      <ConfirmDialog
        open={confirming}
        title={`Delete "${vocab?.term}"?`}
        description="This word and its review history will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (vocab) onDelete(vocab.id);
        }}
        onClose={() => {
          setConfirming(false);
        }}
      />
    </>
  );
}
