import { useCallback, useEffect, useState } from 'react';
import { applyTheme, getThemePreference, setThemePreference, watchSystemTheme, type ThemePreference } from '../services/theme';

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);
  const update = useCallback((next: ThemePreference) => {
    setThemePreference(next);
    setPreference(next);
  }, []);
  return { preference, setPreference: update };
}

/** Applies the saved theme and keeps following the system setting. Call once at the app root. */
export function useApplyTheme() {
  useEffect(() => {
    applyTheme();
    return watchSystemTheme();
  }, []);
}
