import { describe, expect, it } from 'vitest';
import type { AppData, Vocabulary } from '../types';
import { createDemoData } from '../data/demoData';
import { DEFAULT_SETTINGS } from '../types';
import { LocalDataService } from './dataService';
import { MemoryStorageAdapter } from './storage';
import { SyncEngine, type AuthClient, type AuthUser, type RemoteStore } from './sync';
import type { SyncRecord } from '../utils/syncRecords';
import { changeDifficulty, completeReview } from '../utils/spacedRepetition';

/** In-memory stand-in for the Supabase `records` table + trigger. */
class FakeServer implements RemoteStore {
  rows = new Map<string, SyncRecord & { serverTime: number }>();
  private clock = 1_000_000;
  offline = false;

  async pull(userId: string, since: string | null) {
    if (this.offline) throw new Error('Failed to fetch');
    const after = since ? Date.parse(since) : -Infinity;
    const rows = [...this.rows.entries()]
      .filter(([k, r]) => k.startsWith(userId + '|') && r.serverTime > after)
      .map(([, r]) => r)
      .sort((a, b) => a.serverTime - b.serverTime);
    const max = rows.length ? new Date(rows[rows.length - 1].serverTime).toISOString() : null;
    return { records: rows.map(({ serverTime: _s, ...r }) => r), maxServerTime: max };
  }

  async push(userId: string, records: SyncRecord[]) {
    if (this.offline) throw new Error('Failed to fetch');
    for (const r of records) {
      const key = `${userId}|${r.kind}:${r.id}`;
      const old = this.rows.get(key);
      // Same rule as the SQL trigger: an older edit never replaces a newer one.
      if (old && Date.parse(r.updatedAt) < Date.parse(old.updatedAt)) continue;
      this.clock += 10 * 60 * 1000; // far apart, so the pull overlap window is irrelevant
      this.rows.set(key, { ...structuredClone(r), serverTime: this.clock });
    }
  }
}

class FakeAuth implements AuthClient {
  user: AuthUser | null = null;
  async getUser() {
    return this.user;
  }
  async signIn(email: string) {
    this.user = { id: 'user-1', email };
    return this.user;
  }
  async signUp(email: string) {
    return this.signIn(email);
  }
  async signOut() {
    this.user = null;
  }
  onChange() {
    return () => {};
  }
}

let tick = Date.parse('2026-10-09T08:00:00Z');
const clock = () => new Date((tick += 1000));

function device(server: FakeServer, initial: AppData) {
  const storage = new MemoryStorageAdapter();
  storage.write('cadence.data.v1', { version: 1, ...initial });
  const store = new LocalDataService(storage);
  const engine = new SyncEngine(store, server, new FakeAuth(), storage, clock);
  return { store, engine };
}

const empty = (): AppData => ({ folders: [], studySets: [], vocabulary: [], reviewHistory: [], settings: { ...DEFAULT_SETTINGS } });
const word = (d: AppData, term: string) => d.vocabulary.find((v) => v.term === term) as Vocabulary;

describe('SyncEngine', () => {
  it('merges two devices that each have their own words', async () => {
    const server = new FakeServer();
    const phone = device(server, createDemoData(new Date('2026-10-01T09:00:00')));
    const laptop = device(server, empty());

    // Laptop has its own folder before ever syncing.
    await laptop.store.upsertFolder({ id: 'folder_laptop', name: 'Laptop words', createdAt: '2026-10-05T00:00:00Z' });
    await laptop.store.upsertStudySet({ id: 'set_laptop', folderId: 'folder_laptop', name: 'Set', createdAt: '2026-10-05T00:00:00Z' });

    await phone.engine.signIn('me@example.com', 'pw');
    await laptop.engine.signIn('me@example.com', 'pw');
    await phone.engine.sync();

    for (const d of [phone, laptop]) {
      const data = d.store.getSnapshot();
      expect(data.folders.map((f) => f.name).sort()).toEqual(['IELTS', 'Laptop words', 'Work']);
      expect(data.vocabulary).toHaveLength(48);
    }
    expect(phone.engine.getState().status).toBe('synced');
    expect(phone.engine.getState().pending).toBe(0);
  });

  it('syncs reviews, edits and deletions both ways, newest edit wins', async () => {
    const server = new FakeServer();
    const demo = createDemoData(new Date('2026-10-01T09:00:00'));
    const phone = device(server, demo);
    const laptop = device(server, structuredClone(demo));
    await phone.engine.signIn('me@example.com', 'pw');
    await laptop.engine.signIn('me@example.com', 'pw');

    // Phone reviews a word and changes another's level.
    const p = phone.store.getSnapshot();
    const reviewed = completeReview(word(p, 'liquidity'), new Date('2026-10-09T10:00:00'));
    await phone.store.upsertVocabulary([reviewed, changeDifficulty(word(p, 'abundant'), 'easy')]);
    await phone.store.addReviewHistory({
      id: 'review_1',
      vocabularyId: reviewed.id,
      reviewedAt: '2026-10-09T10:00:00Z',
      oldDifficulty: 'hard',
      newDifficulty: 'hard',
      reviewMode: 'flashcard',
      isCorrect: null,
      sessionType: 'daily',
    });
    // Laptop deletes a word and edits a definition.
    const l = laptop.store.getSnapshot();
    await laptop.store.deleteVocabulary(word(l, 'pollution').id);
    await laptop.store.upsertVocabulary([{ ...word(l, 'mortgage'), definition: 'thế chấp (edited)' }]);

    await phone.engine.sync();
    await laptop.engine.sync();
    await phone.engine.sync();

    for (const d of [phone, laptop]) {
      const data = d.store.getSnapshot();
      expect(word(data, 'liquidity').reviewStage).toBe(reviewed.reviewStage);
      expect(word(data, 'abundant').difficulty).toBe('easy');
      expect(data.reviewHistory.map((h) => h.id)).toContain('review_1');
      expect(word(data, 'pollution')).toBeUndefined();
      expect(word(data, 'mortgage').definition).toBe('thế chấp (edited)');
    }
  });

  it('keeps changes made offline and pushes them later', async () => {
    const server = new FakeServer();
    const phone = device(server, empty());
    const laptop = device(server, empty());
    await phone.engine.signIn('me@example.com', 'pw');
    await laptop.engine.signIn('me@example.com', 'pw');

    server.offline = true;
    await phone.store.upsertFolder({ id: 'f1', name: 'Offline folder', createdAt: '2026-10-09T00:00:00Z' });
    await phone.engine.sync();
    expect(phone.engine.getState().pending).toBe(1);
    expect(['offline', 'error']).toContain(phone.engine.getState().status);

    server.offline = false;
    await phone.engine.sync();
    await laptop.engine.sync();
    expect(laptop.store.getSnapshot().folders.map((f) => f.name)).toEqual(['Offline folder']);
  });

  it('does not let a stale copy on a new device overwrite newer progress', async () => {
    const server = new FakeServer();
    const demo = createDemoData(new Date('2026-10-01T09:00:00'));
    const phone = device(server, demo);
    await phone.engine.signIn('me@example.com', 'pw');
    const reviewed = completeReview(word(phone.store.getSnapshot(), 'deteriorate'), new Date('2026-10-09T10:00:00'));
    await phone.store.upsertVocabulary([reviewed]);
    await phone.engine.sync();

    // A device with the original demo copy signs in later.
    const tablet = device(server, structuredClone(demo));
    await tablet.engine.signIn('me@example.com', 'pw');
    expect(word(tablet.store.getSnapshot(), 'deteriorate').reviewStage).toBe(reviewed.reviewStage);
  });
});
