import type { AppData } from '../types';
import { applyRecords, diffData, recordKey, snapshotRecords, type SyncRecord } from '../utils/syncRecords';
import type { StorageAdapter } from './storage';

/** Remote table of sync records (Supabase in production, in-memory in tests). */
export interface RemoteStore {
  /** Records changed on the server after `since` (server time), oldest first. */
  pull(userId: string, since: string | null): Promise<{ records: SyncRecord[]; maxServerTime: string | null }>;
  /** Upserts records; the server keeps whichever version has the newer updatedAt. */
  push(userId: string, records: SyncRecord[]): Promise<void>;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthClient {
  getUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onChange(listener: (user: AuthUser | null) => void): () => void;
}

/** The local store the engine keeps in sync. */
export interface SyncableStore {
  getSnapshot(): AppData;
  /** Replace local data with merged remote data without reporting it as a local change. */
  applyRemote(data: AppData): void;
  onLocalChange(listener: (prev: AppData, next: AppData) => void): () => void;
}

export type SyncStatus = 'loading' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  user: AuthUser | null;
  pending: number;
  lastSyncedAt: string | null;
  error: string | null;
}

interface Meta {
  userId: string;
  cursor: string | null;
}

const QUEUE_KEY = 'cadence.sync.queue.v1';
const META_KEY = 'cadence.sync.meta.v1';
const PUSH_DELAY_MS = 1500;
/** Re-read a little before the last cursor so slow concurrent writes are not missed. */
const CURSOR_OVERLAP_MS = 2 * 60 * 1000;

const isNewer = (a: string, b: string) => Date.parse(a) > Date.parse(b);

/**
 * Keeps local data and the account in sync.
 * - Local edits are diffed into records and queued (persisted, so they survive
 *   reloads and offline periods), then pushed shortly after.
 * - Pulls fetch records changed since the last pull. For each record, the
 *   newer of the remote and any queued local change wins.
 */
export class SyncEngine {
  private state: SyncState = { status: 'loading', user: null, pending: 0, lastSyncedAt: null, error: null };
  private listeners = new Set<(state: SyncState) => void>();
  private queue: Map<string, SyncRecord>;
  private meta: Meta | null;
  private running: Promise<void> | null = null;
  private again = false;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  constructor(
    private readonly store: SyncableStore,
    private readonly remote: RemoteStore,
    private readonly auth: AuthClient,
    private readonly storage: StorageAdapter,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.queue = new Map(Object.entries(storage.read<Record<string, SyncRecord>>(QUEUE_KEY) ?? {}));
    this.meta = storage.read<Meta>(META_KEY);
    this.state.pending = this.queue.size;
    store.onLocalChange((prev, next) => this.onLocalChange(prev, next));
  }

  getState = () => this.state;

  subscribe = (listener: (state: SyncState) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Restores the session and starts syncing. Safe to call more than once. */
  async start() {
    if (this.started) return;
    this.started = true;
    this.auth.onChange((user) => {
      if (!user && this.state.user) this.setSignedOut();
    });
    let user: AuthUser | null = null;
    try {
      user = await this.auth.getUser();
    } catch {
      user = null;
    }
    if (user) await this.attach(user);
    else this.setSignedOut();
  }

  async signIn(email: string, password: string) {
    await this.attach(await this.auth.signIn(email.trim(), password));
  }

  async signUp(email: string, password: string) {
    await this.attach(await this.auth.signUp(email.trim(), password));
  }

  /** Pushes pending changes (best effort), then signs out. Local data stays on this device. */
  async signOut() {
    try {
      await this.sync();
    } catch {
      // Ignore: signing out must always work.
    }
    await this.auth.signOut();
    this.setSignedOut();
  }

  /** Pull then push. Concurrent calls coalesce into one extra run. */
  sync(): Promise<void> {
    if (!this.state.user) return Promise.resolve();
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      try {
        do {
          this.again = false;
          await this.runOnce();
        } while (this.again);
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  }

  private async attach(user: AuthUser) {
    if (this.meta?.userId !== user.id) {
      // First sync of this device with this account: offer everything local,
      // dated by the entities themselves so newer work elsewhere wins.
      this.queue = new Map(snapshotRecords(this.store.getSnapshot()).map((r) => [recordKey(r.kind, r.id), r]));
      this.meta = { userId: user.id, cursor: null };
      this.saveMeta();
      this.saveQueue();
    }
    this.set({ user, error: null, status: 'syncing', pending: this.queue.size });
    await this.sync();
  }

  private async runOnce() {
    const user = this.state.user;
    if (!user || !this.meta) return;
    this.set({ status: 'syncing', error: null });
    try {
      // 1. Pull and merge.
      const { records, maxServerTime } = await this.remote.pull(user.id, this.meta.cursor);
      const winners: SyncRecord[] = [];
      for (const r of records) {
        const key = recordKey(r.kind, r.id);
        const local = this.queue.get(key);
        if (local && !isNewer(r.updatedAt, local.updatedAt)) continue;
        if (local) this.queue.delete(key);
        winners.push(r);
      }
      if (winners.length) this.store.applyRemote(applyRecords(this.store.getSnapshot(), winners));
      if (maxServerTime) {
        this.meta.cursor = new Date(Date.parse(maxServerTime) - CURSOR_OVERLAP_MS).toISOString();
        this.saveMeta();
      }
      this.saveQueue();

      // 2. Push what is left.
      const outgoing = [...this.queue.entries()];
      if (outgoing.length) {
        await this.remote.push(
          user.id,
          outgoing.map(([, r]) => r),
        );
        for (const [key, r] of outgoing) if (this.queue.get(key) === r) this.queue.delete(key);
        this.saveQueue();
      }
      this.set({ status: 'synced', lastSyncedAt: this.now().toISOString(), pending: this.queue.size });
    } catch (error) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      this.set({
        status: offline ? 'offline' : 'error',
        error: offline ? null : error instanceof Error ? error.message : String(error),
        pending: this.queue.size,
      });
    }
  }

  private onLocalChange(prev: AppData, next: AppData) {
    if (!this.state.user) return;
    const changes = diffData(prev, next, this.now().toISOString());
    if (!changes.length) return;
    for (const r of changes) this.queue.set(recordKey(r.kind, r.id), r);
    this.saveQueue();
    this.set({ pending: this.queue.size });
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.sync();
    }, PUSH_DELAY_MS);
  }

  private setSignedOut() {
    this.meta = null;
    this.queue.clear();
    this.storage.remove(META_KEY);
    this.storage.remove(QUEUE_KEY);
    this.set({ status: 'signed-out', user: null, pending: 0, error: null, lastSyncedAt: null });
  }

  private saveQueue() {
    this.storage.write(QUEUE_KEY, Object.fromEntries(this.queue));
  }

  private saveMeta() {
    if (this.meta) this.storage.write(META_KEY, this.meta);
  }

  private set(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }
}
