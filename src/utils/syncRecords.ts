import type { AppData, Folder, ReviewHistory, Settings, StudySet, Vocabulary } from '../types';
import { DEFAULT_SETTINGS } from '../types';

/**
 * Sync works on flat records: one row per entity, keyed by (kind, id).
 * A deleted entity is kept as a tombstone (`data: null`) so other devices
 * learn about the deletion.
 */
export type RecordKind = 'folder' | 'studySet' | 'vocabulary' | 'review' | 'settings';

export interface SyncRecord {
  kind: RecordKind;
  id: string;
  /** null = deleted */
  data: unknown | null;
  /** When this change was made on the device (ISO). Newer wins. */
  updatedAt: string;
}

export const SETTINGS_ID = 'settings';

export const recordKey = (kind: RecordKind, id: string) => `${kind}:${id}`;

type Entity = Folder | StudySet | Vocabulary | ReviewHistory | Settings;

function entries(data: AppData): Map<string, { kind: RecordKind; id: string; value: Entity }> {
  const map = new Map<string, { kind: RecordKind; id: string; value: Entity }>();
  const add = (kind: RecordKind, list: { id: string }[]) => {
    for (const item of list) map.set(recordKey(kind, item.id), { kind, id: item.id, value: item as Entity });
  };
  add('folder', data.folders);
  add('studySet', data.studySets);
  add('vocabulary', data.vocabulary);
  add('review', data.reviewHistory);
  map.set(recordKey('settings', SETTINGS_ID), { kind: 'settings', id: SETTINGS_ID, value: data.settings });
  return map;
}

/**
 * Records for everything that changed between two snapshots. Entities are
 * immutable, so a changed entity is a different object.
 */
export function diffData(prev: AppData, next: AppData, updatedAt: string): SyncRecord[] {
  const before = entries(prev);
  const after = entries(next);
  const changes: SyncRecord[] = [];
  for (const [key, item] of after) {
    const old = before.get(key);
    // Same object = unchanged. A different object may still be an equal copy
    // (e.g. after a full replace), so compare contents before reporting it.
    const changed = !old || (old.value !== item.value && JSON.stringify(old.value) !== JSON.stringify(item.value));
    if (changed) changes.push({ kind: item.kind, id: item.id, data: item.value, updatedAt });
  }
  for (const [key, item] of before) {
    if (!after.has(key) && item.kind !== 'settings') changes.push({ kind: item.kind, id: item.id, data: null, updatedAt });
  }
  return changes;
}

/**
 * Every local entity as a record, for the first sync of this device with an
 * account. Timestamps come from the entity itself, so newer work elsewhere
 * wins over stale local copies; settings use the epoch so the account's
 * settings win.
 */
export function snapshotRecords(data: AppData): SyncRecord[] {
  const epoch = new Date(0).toISOString();
  return [...entries(data).values()].map(({ kind, id, value }) => {
    let updatedAt = epoch;
    if (kind === 'vocabulary') {
      const v = value as Vocabulary;
      updatedAt = v.lastReviewedAt ?? v.createdAt;
    } else if (kind === 'review') updatedAt = (value as ReviewHistory).reviewedAt;
    else if (kind !== 'settings') updatedAt = (value as Folder | StudySet).createdAt;
    return { kind, id, data: value, updatedAt };
  });
}

/** Applies remote records to local data (records are already the winners). */
export function applyRecords(data: AppData, records: SyncRecord[]): AppData {
  if (!records.length) return data;
  const maps = {
    folder: new Map(data.folders.map((x) => [x.id, x])),
    studySet: new Map(data.studySets.map((x) => [x.id, x])),
    vocabulary: new Map(data.vocabulary.map((x) => [x.id, x])),
    review: new Map(data.reviewHistory.map((x) => [x.id, x])),
  };
  let settings = data.settings;
  for (const r of records) {
    if (r.kind === 'settings') {
      if (r.data) settings = { ...DEFAULT_SETTINGS, ...(r.data as Settings) };
      continue;
    }
    const map = maps[r.kind] as Map<string, unknown>;
    if (r.data === null) map.delete(r.id);
    else map.set(r.id, r.data);
  }
  return {
    folders: [...maps.folder.values()],
    studySets: [...maps.studySet.values()],
    vocabulary: [...maps.vocabulary.values()],
    reviewHistory: [...maps.review.values()].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt)),
    settings,
  };
}
