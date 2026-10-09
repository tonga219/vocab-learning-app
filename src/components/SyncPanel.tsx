import { useId, useState, type FormEvent } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react';
import { useSync } from '../hooks/useSync';
import { Button } from './Button';
import { inputClass } from './EditVocabularyDialog';
import { cn } from '../utils/cn';

function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString('en-GB');
}

/** One-line description of the sync state, shared by Settings and the nav. */
export function useSyncLabel() {
  const sync = useSync();
  const waiting = sync.pending > 0 ? ` · ${sync.pending} ${sync.pending === 1 ? 'change' : 'changes'} waiting` : '';
  const label =
    sync.status === 'syncing'
      ? 'Syncing…'
      : sync.status === 'synced'
        ? `Synced ${timeAgo(sync.lastSyncedAt)}`
        : sync.status === 'offline'
          ? `Offline${waiting}`
          : sync.status === 'error'
            ? `Couldn’t sync${waiting}`
            : '';
  return { ...sync, label };
}

export function SyncStatusBadge({ className }: { className?: string }) {
  const { status, label } = useSyncLabel();
  if (status === 'loading' || status === 'signed-out') return null;
  const problem = status === 'offline' || status === 'error';
  const Icon = problem ? CloudOff : status === 'syncing' ? RefreshCw : Cloud;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', problem ? 'text-amber-700' : 'text-slate-500', className)} title={label}>
      <Icon size={14} className={cn(status === 'syncing' && 'animate-spin')} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function SyncPanel() {
  const sync = useSyncLabel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'in' | 'up' | 'out' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailId = useId();
  const passwordId = useId();

  const run = async (kind: 'in' | 'up') => {
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'in') await sync.engine.signIn(email, password);
      else await sync.engine.signUp(email, password);
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (sync.status === 'loading') return <p className="text-sm text-muted">Checking your account…</p>;

  if (sync.user) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-[13px] text-muted">Signed in as</div>
          <div className="truncate text-[15px] font-semibold text-ink">{sync.user.email}</div>
          <div className="mt-2">
            <SyncStatusBadge className="text-[13px]" />
          </div>
          {sync.status === 'error' && sync.error && <p className="mt-2 text-[13px] text-red-600">{sync.error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} className={cn(sync.status === 'syncing' && 'animate-spin')} aria-hidden />}
            disabled={sync.status === 'syncing'}
            onClick={() => void sync.engine.sync()}
          >
            Sync now
          </Button>
          <Button
            variant="ghost"
            icon={<LogOut size={16} aria-hidden />}
            disabled={busy === 'out'}
            onClick={async () => {
              setBusy('out');
              await sync.engine.signOut();
              setBusy(null);
            }}
          >
            Sign out
          </Button>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">Signing out keeps your words on this device; it just stops syncing.</p>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run('in');
  };

  return (
    <form onSubmit={submit} className="max-w-[420px] space-y-3">
      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-[13px] font-medium text-slate-600">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="mb-1.5 block text-[13px] font-medium text-slate-600">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 6 characters"
        />
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={!!busy}>
          {busy === 'in' ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button variant="secondary" disabled={!!busy} onClick={() => void run('up')}>
          {busy === 'up' ? 'Creating…' : 'Create account'}
        </Button>
      </div>
      <p className="text-[13px] leading-relaxed text-muted">
        Use the same account on your phone and computer. The words already on this device are merged into your account.
      </p>
    </form>
  );
}
