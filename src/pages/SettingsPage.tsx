import { useState, type ReactNode } from 'react';
import { HardDrive, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useToast } from '../hooks/useToast';
import { PageContainer, PageHeader } from '../components/Layout';
import { SegmentedControl } from '../components/SegmentedControl';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { hasDemoData } from '../utils/dataOps';

const LIMITS = ['10', '20', '30', '50', 'unlimited'] as const;
type LimitValue = (typeof LIMITS)[number];

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line/80 py-8 first:pt-0 last:border-b-0 md:grid-cols-[240px_1fr] md:gap-10">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { data, updateSettings, restoreDemoData, removeDemoData, deleteAllData } = useAppData();
  const toast = useToast();
  const [confirm, setConfirm] = useState<'demo' | 'all' | null>(null);
  const demo = hasDemoData(data);
  const limit = data.settings.dailyReviewLimit;
  const value: LimitValue = limit === null ? 'unlimited' : (String(limit) as LimitValue);

  return (
    <PageContainer>
      <PageHeader title="Settings" />

      <Section
        title="Daily review limit"
        description="The most words Today will ask you to review each day. Due words beyond the limit wait for tomorrow."
      >
        <SegmentedControl
          label="Daily review limit"
          size="md"
          tone="solid"
          className="w-full max-w-[460px]"
          value={value}
          onChange={(v) => {
            updateSettings({ dailyReviewLimit: v === 'unlimited' ? null : Number(v) });
          }}
          options={LIMITS.map((l) => ({
            value: l,
            label: l === 'unlimited' ? <span>∞<span className="sr-only">Unlimited</span></span> : l,
            title: l === 'unlimited' ? 'Unlimited' : `${l} words`,
          }))}
        />
        <p className="mt-3 text-[13px] text-muted">
          {limit === null ? 'Unlimited — every due word, every day.' : `${limit} words per day.`}{' '}
          {limit !== 30 && <span className="text-slate-400">30 is recommended.</span>}
          {limit === 30 && <span className="text-slate-400">Recommended.</span>}
        </p>
      </Section>

      <Section
        title="Demo data"
        description="Sample folders (IELTS, Work) that show due, overdue and upcoming reviews."
      >
        {demo ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Trash2 size={16} aria-hidden />} onClick={() => setConfirm('demo')}>
              Remove demo data
            </Button>
            <Button
              variant="ghost"
              icon={<RotateCcw size={16} aria-hidden />}
              onClick={() => {
                restoreDemoData();
                toast('Demo data reset');
              }}
            >
              Reset demo data
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            icon={<Sparkles size={16} aria-hidden />}
            onClick={() => {
              restoreDemoData();
              toast('Demo data added');
            }}
          >
            Add demo data
          </Button>
        )}
      </Section>

      <Section
        title="Your data"
        description={
          <span className="inline-flex items-start gap-1.5">
            <HardDrive size={14} className="mt-0.5 shrink-0" aria-hidden />
            Everything is saved locally in this browser.
          </span>
        }
      >
        <p className="tabular mb-4 text-sm text-slate-600">
          {data.folders.length} folders · {data.studySets.length} Study Sets · {data.vocabulary.length} words ·{' '}
          {data.reviewHistory.length} reviews
        </p>
        <Button variant="danger" icon={<Trash2 size={16} aria-hidden />} onClick={() => setConfirm('all')}>
          Delete all data
        </Button>
      </Section>

      <ConfirmDialog
        open={confirm === 'demo'}
        title="Remove demo data?"
        description="The IELTS and Work demo folders and their words will be deleted. Your own folders stay untouched."
        confirmLabel="Remove demo data"
        onConfirm={() => {
          removeDemoData();
          toast('Demo data removed');
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'all'}
        title="Delete all data?"
        description="All folders, Study Sets, vocabulary and review history will be permanently deleted from this browser."
        confirmLabel="Delete everything"
        onConfirm={() => {
          deleteAllData();
          toast('All data deleted');
        }}
        onClose={() => setConfirm(null)}
      />
    </PageContainer>
  );
}
