import { useMemo } from 'react';
import { useAppData } from './useAppData';
import type { Folder, StudySet, Vocabulary } from '../types';

/** Derived lookups for the Library hierarchy. */
export function useLibrary() {
  const { data } = useAppData();
  return useMemo(() => {
    const setsByFolder = new Map<string, StudySet[]>();
    const vocabBySet = new Map<string, Vocabulary[]>();
    const folderById = new Map<string, Folder>(data.folders.map((f) => [f.id, f]));
    const setById = new Map<string, StudySet>(data.studySets.map((s) => [s.id, s]));
    for (const s of data.studySets) {
      const list = setsByFolder.get(s.folderId) ?? [];
      list.push(s);
      setsByFolder.set(s.folderId, list);
    }
    for (const v of data.vocabulary) {
      const list = vocabBySet.get(v.studySetId) ?? [];
      list.push(v);
      vocabBySet.set(v.studySetId, list);
    }
    for (const list of vocabBySet.values()) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const sourceLabel = (vocab: Vocabulary) => {
      const set = setById.get(vocab.studySetId);
      const folder = set ? folderById.get(set.folderId) : undefined;
      return [folder?.name, set?.name].filter(Boolean).join(' · ');
    };

    return {
      folders: data.folders,
      folderById,
      setById,
      setsOf: (folderId: string) => setsByFolder.get(folderId) ?? [],
      vocabOf: (setId: string) => vocabBySet.get(setId) ?? [],
      countInFolder: (folderId: string) =>
        (setsByFolder.get(folderId) ?? []).reduce((n, s) => n + (vocabBySet.get(s.id)?.length ?? 0), 0),
      sourceLabel,
    };
  }, [data.folders, data.studySets, data.vocabulary]);
}
