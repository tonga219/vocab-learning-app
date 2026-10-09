import type { AppData, Folder, ReviewHistory, Settings, StudySet, Vocabulary } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { createDemoData } from '../data/demoData';
import { LocalStorageAdapter, type StorageAdapter } from './storage';
import * as ops from '../utils/dataOps';
import type { SyncableStore } from './sync';

/**
 * The application's data layer. Every method is async so a remote backend
 * (e.g. Supabase) can implement the same interface without UI changes.
 * Each method maps naturally to a table operation (upsert / delete).
 */
export interface DataService {
  loadAll(): Promise<AppData>;
  upsertFolder(folder: Folder): Promise<void>;
  deleteFolder(folderId: string): Promise<void>;
  upsertStudySet(studySet: StudySet): Promise<void>;
  deleteStudySet(studySetId: string): Promise<void>;
  upsertVocabulary(vocabulary: Vocabulary[]): Promise<void>;
  deleteVocabulary(vocabularyId: string): Promise<void>;
  addReviewHistory(entry: ReviewHistory): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  /** Replace everything (used for loading / removing demo data and resets). */
  replaceAll(data: AppData): Promise<void>;
  /** Notifies when data changes from elsewhere (e.g. sync from another device). */
  subscribe?(listener: (data: AppData) => void): () => void;
}

const STORAGE_KEY = 'cadence.data.v1';

interface StoredData extends AppData {
  version: 1;
}

export class LocalDataService implements DataService, SyncableStore {
  private data: AppData | null = null;
  private localListeners = new Set<(prev: AppData, next: AppData) => void>();
  private remoteListeners = new Set<(data: AppData) => void>();

  constructor(private readonly storage: StorageAdapter = new LocalStorageAdapter()) {}

  async loadAll(): Promise<AppData> {
    return structuredClone(this.ensureLoaded());
  }

  async upsertFolder(folder: Folder) {
    this.mutate((d) => ({ ...d, folders: upsert(d.folders, folder) }));
  }

  async deleteFolder(folderId: string) {
    this.mutate((d) => ops.removeFolder(d, folderId));
  }

  async upsertStudySet(studySet: StudySet) {
    this.mutate((d) => ({ ...d, studySets: upsert(d.studySets, studySet) }));
  }

  async deleteStudySet(studySetId: string) {
    this.mutate((d) => ops.removeStudySet(d, studySetId));
  }

  async upsertVocabulary(vocabulary: Vocabulary[]) {
    this.mutate((d) => ({ ...d, vocabulary: vocabulary.reduce(upsert, d.vocabulary) }));
  }

  async deleteVocabulary(vocabularyId: string) {
    this.mutate((d) => ops.removeVocabulary(d, vocabularyId));
  }

  async addReviewHistory(entry: ReviewHistory) {
    this.mutate((d) => ({ ...d, reviewHistory: [...d.reviewHistory, entry] }));
  }

  async saveSettings(settings: Settings) {
    this.mutate((d) => ({ ...d, settings }));
  }

  async replaceAll(data: AppData) {
    this.mutate(() => data);
  }

  getSnapshot(): AppData {
    return this.ensureLoaded();
  }

  applyRemote(data: AppData) {
    this.data = data;
    this.persist();
    for (const l of this.remoteListeners) l(structuredClone(data));
  }

  onLocalChange(listener: (prev: AppData, next: AppData) => void) {
    this.localListeners.add(listener);
    return () => {
      this.localListeners.delete(listener);
    };
  }

  subscribe(listener: (data: AppData) => void) {
    this.remoteListeners.add(listener);
    return () => {
      this.remoteListeners.delete(listener);
    };
  }

  private ensureLoaded(): AppData {
    if (this.data) return this.data;
    const stored = this.storage.read<StoredData>(STORAGE_KEY);
    if (stored && stored.version === 1) {
      this.data = {
        folders: stored.folders ?? [],
        studySets: stored.studySets ?? [],
        vocabulary: stored.vocabulary ?? [],
        reviewHistory: stored.reviewHistory ?? [],
        settings: { ...DEFAULT_SETTINGS, ...stored.settings },
      };
    } else {
      // First launch: seed demo content so the app is useful immediately.
      this.data = createDemoData(new Date());
      this.persist();
    }
    return this.data;
  }

  private mutate(fn: (data: AppData) => AppData) {
    const prev = this.ensureLoaded();
    this.data = fn(prev);
    this.persist();
    for (const l of this.localListeners) l(prev, this.data);
  }

  private persist() {
    if (!this.data) return;
    const stored: StoredData = { version: 1, ...this.data };
    this.storage.write(STORAGE_KEY, stored);
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  const next = list.slice();
  next[index] = item;
  return next;
}

export const localDataService = new LocalDataService();
export const dataService: DataService = localDataService;
