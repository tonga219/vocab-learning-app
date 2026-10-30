import { LocalStorageAdapter } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Kept per device (not synced): a phone can be dark while a laptop is light. */
const KEY = 'cadence.theme';
const storage = new LocalStorageAdapter();
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePreference(): ThemePreference {
  const value = storage.read<ThemePreference>(KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function isDark(preference: ThemePreference = getThemePreference()): boolean {
  return preference === 'dark' || (preference === 'system' && media().matches);
}

/** Applies the theme to <html> (the `dark` class switches every color token). */
export function applyTheme(preference: ThemePreference = getThemePreference()) {
  const dark = isDark(preference);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1120' : '#F8FAFC');
}

export function setThemePreference(preference: ThemePreference) {
  if (preference === 'system') storage.remove(KEY);
  else storage.write(KEY, preference);
  applyTheme(preference);
}

/** Follows the system setting while the preference is "system". */
export function watchSystemTheme(): () => void {
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  const query = media();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
