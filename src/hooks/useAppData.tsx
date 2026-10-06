import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, Difficulty, Folder, ReviewHistory, ReviewMode, SessionType, Settings, StudySet, Vocabulary } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { dataService, type DataService } from '../services/dataService';
import { changeDifficulty, completeReview, createNewVocabularyFields } from '../utils/spacedRepetition';
import { createId } from '../utils/id';
import * as ops from '../utils/dataOps';
import { createDemoData } from '../data/demoData';

export interface VocabularyInput {
  term: string;
  definition: string;
}

export interface RecordReviewInput {
  vocabularyId: string;
  /** The word as it was when its card was opened. */
  snapshot: Vocabulary;
  reviewMode: ReviewMode;
  isCorrect: boolean | null;
  sessionType: SessionType;
}

interface AppDataContextValue {
  data: AppData;
  ready: boolean;
  createFolder(name: string): Folder;
  renameFolder(id: string, name: string): void;
  deleteFolder(id: string): void;
  createStudySet(folderId: string, name: string): StudySet;
  renameStudySet(id: string, name: string): void;
  deleteStudySet(id: string): void;
  addVocabulary(studySetId: string, rows: VocabularyInput[]): Vocabulary[];
  updateVocabularyText(id: string, input: VocabularyInput): void;
  deleteVocabulary(id: string): void;
  setDifficulty(id: string, difficulty: Difficulty): void;
  recordReview(input: RecordReviewInput): Vocabulary | null;
  updateSettings(patch: Partial<Settings>): void;
  restoreDemoData(): void;
  removeDemoData(): void;
  deleteAllData(): void;
}

const EMPTY: AppData = {
  folders: [],
  studySets: [],
  vocabulary: [],
  reviewHistory: [],
  settings: { ...DEFAULT_SETTINGS },
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function persist(task: Promise<void>) {
  task.catch((error) => console.error('Failed to persist change', error));
}

export function AppDataProvider({ children, service = dataService }: { children: ReactNode; service?: DataService }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  // Mirror of state for synchronous reads inside actions.
  const ref = useRef(data);
  const commit = useCallback((next: AppData) => {
    ref.current = next;
    setData(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    service.loadAll().then((loaded) => {
      if (cancelled) return;
      commit(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [service, commit]);

  const createFolder = useCallback(
    (name: string) => {
      const folder: Folder = { id: createId('folder'), name: name.trim(), createdAt: new Date().toISOString() };
      commit({ ...ref.current, folders: [...ref.current.folders, folder] });
      persist(service.upsertFolder(folder));
      return folder;
    },
    [commit, service],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const folder = ref.current.folders.find((f) => f.id === id);
      if (!folder) return;
      const updated = { ...folder, name: name.trim() };
      commit({ ...ref.current, folders: ref.current.folders.map((f) => (f.id === id ? updated : f)) });
      persist(service.upsertFolder(updated));
    },
    [commit, service],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      commit(ops.removeFolder(ref.current, id));
      persist(service.deleteFolder(id));
    },
    [commit, service],
  );

  const createStudySet = useCallback(
    (folderId: string, name: string) => {
      const set: StudySet = { id: createId('set'), folderId, name: name.trim(), createdAt: new Date().toISOString() };
      commit({ ...ref.current, studySets: [...ref.current.studySets, set] });
      persist(service.upsertStudySet(set));
      return set;
    },
    [commit, service],
  );

  const renameStudySet = useCallback(
    (id: string, name: string) => {
      const set = ref.current.studySets.find((s) => s.id === id);
      if (!set) return;
      const updated = { ...set, name: name.trim() };
      commit({ ...ref.current, studySets: ref.current.studySets.map((s) => (s.id === id ? updated : s)) });
      persist(service.upsertStudySet(updated));
    },
    [commit, service],
  );

  const deleteStudySet = useCallback(
    (id: string) => {
      commit(ops.removeStudySet(ref.current, id));
      persist(service.deleteStudySet(id));
    },
    [commit, service],
  );

  const replaceVocabulary = useCallback(
    (updated: Vocabulary[]) => {
      const byId = new Map(updated.map((v) => [v.id, v]));
      const existing = new Set(ref.current.vocabulary.map((v) => v.id));
      commit({
        ...ref.current,
        vocabulary: [
          ...ref.current.vocabulary.map((v) => byId.get(v.id) ?? v),
          ...updated.filter((v) => !existing.has(v.id)),
        ],
      });
      persist(service.upsertVocabulary(updated));
    },
    [commit, service],
  );

  const addVocabulary = useCallback(
    (studySetId: string, rows: VocabularyInput[]) => {
      const base = Date.now();
      const created = rows
        .map((r) => ({ term: r.term.trim(), definition: r.definition.trim() }))
        .filter((r) => r.term && r.definition)
        .map<Vocabulary>((r, i) => ({
          id: createId('vocab'),
          studySetId,
          term: r.term,
          definition: r.definition,
          // New vocabulary always starts as Hard.
          ...createNewVocabularyFields(new Date(base + i)),
        }));
      if (created.length) replaceVocabulary(created);
      return created;
    },
    [replaceVocabulary],
  );

  const updateVocabularyText = useCallback(
    (id: string, input: VocabularyInput) => {
      const vocab = ref.current.vocabulary.find((v) => v.id === id);
      if (!vocab) return;
      replaceVocabulary([{ ...vocab, term: input.term.trim(), definition: input.definition.trim() }]);
    },
    [replaceVocabulary],
  );

  const deleteVocabulary = useCallback(
    (id: string) => {
      commit(ops.removeVocabulary(ref.current, id));
      persist(service.deleteVocabulary(id));
    },
    [commit, service],
  );

  const setDifficulty = useCallback(
    (id: string, difficulty: Difficulty) => {
      const vocab = ref.current.vocabulary.find((v) => v.id === id);
      if (!vocab || vocab.difficulty === difficulty) return;
      replaceVocabulary([changeDifficulty(vocab, difficulty, new Date())]);
    },
    [replaceVocabulary],
  );

  const recordReview = useCallback(
    (input: RecordReviewInput) => {
      const current = ref.current.vocabulary.find((v) => v.id === input.vocabularyId);
      if (!current) return null;
      const now = new Date();
      const reviewed = completeReview(current, now, {
        snapshot: input.snapshot,
        // Daily Review only contains due words; manual study ahead of schedule
        // should not push a word further out.
        advanceWhenNotDue: input.sessionType === 'daily',
        // A wrong dictation answer means the word was forgotten.
        forgot: input.reviewMode === 'dictation' && input.isCorrect === false,
      });
      const entry: ReviewHistory = {
        id: createId('review'),
        vocabularyId: current.id,
        reviewedAt: now.toISOString(),
        oldDifficulty: input.snapshot.difficulty,
        newDifficulty: current.difficulty,
        reviewMode: input.reviewMode,
        isCorrect: input.reviewMode === 'flashcard' ? null : input.isCorrect,
        sessionType: input.sessionType,
      };
      replaceVocabulary([reviewed]);
      commit({ ...ref.current, reviewHistory: [...ref.current.reviewHistory, entry] });
      persist(service.addReviewHistory(entry));
      return reviewed;
    },
    [commit, replaceVocabulary, service],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const settings = { ...ref.current.settings, ...patch };
      commit({ ...ref.current, settings });
      persist(service.saveSettings(settings));
    },
    [commit, service],
  );

  const replaceAll = useCallback(
    (next: AppData) => {
      commit(next);
      persist(service.replaceAll(next));
    },
    [commit, service],
  );

  const restoreDemoData = useCallback(() => {
    const demo = createDemoData(new Date());
    const withoutDemo = ops.removeDemoData(ref.current);
    replaceAll({
      ...withoutDemo,
      folders: [...demo.folders, ...withoutDemo.folders],
      studySets: [...demo.studySets, ...withoutDemo.studySets],
      vocabulary: [...demo.vocabulary, ...withoutDemo.vocabulary],
    });
  }, [replaceAll]);

  const removeDemoData = useCallback(() => replaceAll(ops.removeDemoData(ref.current)), [replaceAll]);

  const deleteAllData = useCallback(
    () => replaceAll({ ...EMPTY, settings: ref.current.settings }),
    [replaceAll],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      ready,
      createFolder,
      renameFolder,
      deleteFolder,
      createStudySet,
      renameStudySet,
      deleteStudySet,
      addVocabulary,
      updateVocabularyText,
      deleteVocabulary,
      setDifficulty,
      recordReview,
      updateSettings,
      restoreDemoData,
      removeDemoData,
      deleteAllData,
    }),
    [
      data,
      ready,
      createFolder,
      renameFolder,
      deleteFolder,
      createStudySet,
      renameStudySet,
      deleteStudySet,
      addVocabulary,
      updateVocabularyText,
      deleteVocabulary,
      setDifficulty,
      recordReview,
      updateSettings,
      restoreDemoData,
      removeDemoData,
      deleteAllData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
}
