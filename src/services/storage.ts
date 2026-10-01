/**
 * Low-level key/value persistence. This is the ONLY module that touches
 * window.localStorage. Swap the adapter (or the whole DataService) to move
 * to a remote backend.
 */
export interface StorageAdapter {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  read<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.error(`Failed to read "${key}" from localStorage`, error);
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to write "${key}" to localStorage`, error);
      throw error;
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove "${key}" from localStorage`, error);
    }
  }
}

/** In-memory adapter, useful for tests or when storage is unavailable. */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  read<T>(key: string): T | null {
    const raw = this.store.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  write<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }
  remove(key: string): void {
    this.store.delete(key);
  }
}
