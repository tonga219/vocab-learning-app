import type { AppData } from '../types';

/** Pure cascade helpers shared by the UI store and the local data service. */

export function removeVocabulary(data: AppData, vocabularyId: string): AppData {
  return {
    ...data,
    vocabulary: data.vocabulary.filter((v) => v.id !== vocabularyId),
    reviewHistory: data.reviewHistory.filter((h) => h.vocabularyId !== vocabularyId),
  };
}

export function removeStudySet(data: AppData, studySetId: string): AppData {
  const removed = new Set(data.vocabulary.filter((v) => v.studySetId === studySetId).map((v) => v.id));
  return {
    ...data,
    studySets: data.studySets.filter((s) => s.id !== studySetId),
    vocabulary: data.vocabulary.filter((v) => !removed.has(v.id)),
    reviewHistory: data.reviewHistory.filter((h) => !removed.has(h.vocabularyId)),
  };
}

export function removeFolder(data: AppData, folderId: string): AppData {
  const sets = data.studySets.filter((s) => s.folderId === folderId).map((s) => s.id);
  const withoutSets = sets.reduce(removeStudySet, data);
  return { ...withoutSets, folders: withoutSets.folders.filter((f) => f.id !== folderId) };
}

export const DEMO_PREFIX = 'demo_';

export function hasDemoData(data: AppData): boolean {
  return data.folders.some((f) => f.id.startsWith(DEMO_PREFIX));
}

export function removeDemoData(data: AppData): AppData {
  return data.folders
    .filter((f) => f.id.startsWith(DEMO_PREFIX))
    .map((f) => f.id)
    .reduce(removeFolder, data);
}
