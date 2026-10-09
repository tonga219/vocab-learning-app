import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SyncRecord } from '../utils/syncRecords';
import type { AuthClient, AuthUser, RemoteStore } from './sync';

/**
 * Public project settings. The publishable key is meant to ship in the
 * browser; Row Level Security limits every user to their own rows.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://fvcwqhyvzdfknlhnvibf.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_rWOgYduxAMud-_gGUHfdmw_xKjswVKL';

const PAGE = 1000;
const PUSH_CHUNK = 500;

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'cadence.auth' },
  });
  return client;
}

interface Row {
  kind: SyncRecord['kind'];
  id: string;
  data: unknown;
  deleted: boolean;
  client_updated_at: string;
  server_updated_at: string;
}

/** `records` table (see README for the SQL). */
export class SupabaseRemoteStore implements RemoteStore {
  constructor(private readonly db: SupabaseClient = getSupabase()) {}

  async pull(userId: string, since: string | null) {
    const records: SyncRecord[] = [];
    let maxServerTime: string | null = null;
    for (let from = 0; ; from += PAGE) {
      let query = this.db
        .from('records')
        .select('kind,id,data,deleted,client_updated_at,server_updated_at')
        .eq('user_id', userId)
        .order('server_updated_at')
        .order('kind')
        .order('id')
        .range(from, from + PAGE - 1);
      if (since) query = query.gt('server_updated_at', since);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      for (const row of rows) {
        records.push({ kind: row.kind, id: row.id, data: row.deleted ? null : row.data, updatedAt: row.client_updated_at });
        if (!maxServerTime || Date.parse(row.server_updated_at) > Date.parse(maxServerTime)) maxServerTime = row.server_updated_at;
      }
      if (rows.length < PAGE) break;
    }
    return { records, maxServerTime };
  }

  async push(userId: string, records: SyncRecord[]) {
    for (let i = 0; i < records.length; i += PUSH_CHUNK) {
      const rows = records.slice(i, i + PUSH_CHUNK).map((r) => ({
        user_id: userId,
        kind: r.kind,
        id: r.id,
        data: r.data,
        deleted: r.data === null,
        client_updated_at: r.updatedAt,
      }));
      const { error } = await this.db.from('records').upsert(rows, { onConflict: 'user_id,kind,id' });
      if (error) throw new Error(error.message);
    }
  }
}

const toUser = (u: { id: string; email?: string } | null | undefined): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? '' } : null;

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.';
  if (/already registered|already exists/i.test(message)) return 'This email already has an account. Sign in instead.';
  if (/password should be at least/i.test(message)) return 'Password must be at least 6 characters.';
  if (/email not confirmed/i.test(message)) return 'This email is not confirmed yet. Check your inbox, or turn off "Confirm email" in Supabase.';
  if (/failed to fetch|network/i.test(message)) return 'Can’t reach the sync server. Check your connection.';
  return message;
}

export class SupabaseAuthClient implements AuthClient {
  constructor(private readonly db: SupabaseClient = getSupabase()) {}

  async getUser() {
    const { data } = await this.db.auth.getSession();
    return toUser(data.session?.user);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    return toUser(data.user)!;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.db.auth.signUp({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.session) {
      throw new Error('Account created, but Supabase requires email confirmation. Confirm the email, or turn off "Confirm email", then sign in.');
    }
    return toUser(data.user)!;
  }

  async signOut() {
    await this.db.auth.signOut();
  }

  onChange(listener: (user: AuthUser | null) => void) {
    const { data } = this.db.auth.onAuthStateChange((_event, session) => listener(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  }
}
