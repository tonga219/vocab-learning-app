import { useSyncExternalStore } from 'react';
import { localDataService } from '../services/dataService';
import { LocalStorageAdapter } from '../services/storage';
import { SupabaseAuthClient, SupabaseRemoteStore } from '../services/supabase';
import { SyncEngine } from '../services/sync';

let engine: SyncEngine | null = null;

/** The app-wide sync engine (created lazily, started once). */
export function getSyncEngine(): SyncEngine {
  if (!engine) {
    engine = new SyncEngine(localDataService, new SupabaseRemoteStore(), new SupabaseAuthClient(), new LocalStorageAdapter());
    void engine.start();
    const syncSoon = () => {
      if (document.visibilityState === 'visible') void engine?.sync();
    };
    window.addEventListener('focus', syncSoon);
    window.addEventListener('online', syncSoon);
    document.addEventListener('visibilitychange', syncSoon);
    window.setInterval(syncSoon, 60_000);
  }
  return engine;
}

export function useSync() {
  const sync = getSyncEngine();
  const state = useSyncExternalStore(sync.subscribe, sync.getState);
  return { ...state, engine: sync };
}
