import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Info } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLibrary } from '../hooks/useLibrary';
import { useToast } from '../hooks/useToast';
import { PageContainer, PageHeader } from '../components/Layout';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { NotFound } from './NotFound';
import { createId } from '../utils/id';
import { cn } from '../utils/cn';

interface Row {
  key: string;
  term: string;
  definition: string;
}

const newRow = (term = '', definition = ''): Row => ({ key: createId(), term, definition });

/** Splits "term | definition", "term<TAB>definition" or "term - definition" lines. */
function parseLines(text: string): { term: string; definition: string }[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2 && !/[|\t]/.test(text)) return null;
  return lines.map((line) => {
    const match = line.split(/\s*\|\s*|\t+|\s+[—–-]\s+/);
    const [term = '', ...rest] = match;
    return { term: term.trim(), definition: rest.join(' / ').trim() };
  });
}

const fieldClass =
  'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export function AddVocabularyPage() {
  const { folderId = '', setId = '' } = useParams();
  const { addVocabulary } = useAppData();
  const { folderById, setById } = useLibrary();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow(), newRow()]);
  const focusKey = useRef<string | null>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    if (focusKey.current) {
      inputs.current.get(focusKey.current)?.focus();
      focusKey.current = null;
    }
  });

  const set = setById.get(setId);
  const folder = folderById.get(folderId);
  if (!set || !folder) return <NotFound what="Study Set" />;
  const back = `/library/${folder.id}/${set.id}`;

  const complete = rows.filter((r) => r.term.trim() && r.definition.trim());
  const partial = rows.filter((r) => !!r.term.trim() !== !!r.definition.trim());

  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = (afterKey?: string) => {
    const row = newRow();
    focusKey.current = `${row.key}:term`;
    setRows((rs) => {
      if (!afterKey) return [...rs, row];
      const i = rs.findIndex((r) => r.key === afterKey);
      return [...rs.slice(0, i + 1), row, ...rs.slice(i + 1)];
    });
  };

  const removeRow = (key: string) => setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((r) => r.key !== key)));

  const onPaste = (e: ClipboardEvent<HTMLInputElement>, key: string) => {
    const parsed = parseLines(e.clipboardData.getData('text'));
    if (!parsed) return;
    e.preventDefault();
    setRows((rs) => {
      const i = rs.findIndex((r) => r.key === key);
      const pasted = parsed.map((p) => newRow(p.term, p.definition));
      const before = rs.slice(0, i);
      const after = rs.slice(i + 1).filter((r) => r.term || r.definition);
      return [...before, ...pasted, ...after];
    });
    toast(`Pasted ${parsed.length} rows`);
  };

  const onDefinitionKey = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (index === rows.length - 1) addRow();
    else {
      focusKey.current = `${rows[index + 1].key}:term`;
      setRows((rs) => [...rs]);
    }
  };

  const save = () => {
    if (!complete.length) return;
    const created = addVocabulary(set.id, complete);
    toast(`Added ${created.length} ${created.length === 1 ? 'word' : 'words'} as Hard`);
    navigate(back);
  };

  return (
    <PageContainer className="max-w-[760px]">
      <PageHeader back={<BackLink to={back} label={set.name} />} title="Add vocabulary" subtitle={`${folder.name} · ${set.name}`} />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-blue-50/70 px-4 py-3 text-[13px] leading-relaxed text-blue-900/80">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden />
        <p>
          New words start as <strong className="font-semibold text-blue-900">Hard</strong> — you can change that later. Tip: paste
          lines like <span className="whitespace-nowrap font-mono text-[12px]">abundant | dồi dào</span> to fill many rows at once.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="hidden grid-cols-[32px_1fr_1fr_40px] gap-3 border-b border-line/70 bg-slate-50/70 px-4 py-2.5 sm:grid">
          <span />
          <span className="eyebrow">Term</span>
          <span className="eyebrow">Definition</span>
          <span />
        </div>
        <ol>
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="grid animate-fade-in grid-cols-[1fr_40px] gap-x-2 gap-y-2 border-b border-line/70 px-4 py-3 last:border-b-0 sm:grid-cols-[32px_1fr_1fr_40px] sm:items-center sm:gap-3"
            >
              <span className="tabular hidden text-right text-xs font-medium text-slate-400 sm:block" aria-hidden>
                {index + 1}
              </span>
              <div className="col-start-1 row-start-1 sm:col-start-auto sm:row-start-auto">
                <label className="sr-only" htmlFor={`${row.key}-term`}>
                  Term {index + 1}
                </label>
                <input
                  id={`${row.key}-term`}
                  ref={(el) => {
                    if (el) inputs.current.set(`${row.key}:term`, el);
                    else inputs.current.delete(`${row.key}:term`);
                  }}
                  lang="en"
                  value={row.term}
                  placeholder={index === 0 ? 'deteriorate' : 'Term'}
                  onChange={(e) => update(row.key, { term: e.target.value })}
                  onPaste={(e) => onPaste(e, row.key)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={fieldClass}
                />
              </div>
              <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
                <label className="sr-only" htmlFor={`${row.key}-def`}>
                  Definition {index + 1}
                </label>
                <input
                  id={`${row.key}-def`}
                  lang="vi"
                  value={row.definition}
                  placeholder={index === 0 ? 'xấu đi / suy giảm' : 'Definition'}
                  onChange={(e) => update(row.key, { definition: e.target.value })}
                  onKeyDown={(e) => onDefinitionKey(e, index)}
                  autoComplete="off"
                  className={cn(fieldClass, 'bg-slate-50/50 sm:bg-white')}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label={`Remove row ${index + 1}`}
                className="col-start-2 row-span-2 row-start-1 inline-flex h-10 w-10 items-center justify-center self-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-ink active:scale-95 sm:col-start-auto sm:row-span-1 sm:row-start-auto"
              >
                <X size={17} />
              </button>
            </li>
          ))}
        </ol>
        <div className="border-t border-line/70 p-2">
          <button
            type="button"
            onClick={() => addRow()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 active:bg-blue-100"
          >
            <Plus size={16} aria-hidden /> Add row
          </button>
        </div>
      </div>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/90 p-3 pl-5 shadow-lift backdrop-blur lg:bottom-6">
        <span className="tabular text-sm text-muted" aria-live="polite">
          {complete.length} {complete.length === 1 ? 'word' : 'words'} ready
          {partial.length > 0 && <span className="text-slate-400"> · {partial.length} incomplete</span>}
        </span>
        <Button onClick={save} disabled={!complete.length}>
          Save vocabulary
        </Button>
      </div>
    </PageContainer>
  );
}
