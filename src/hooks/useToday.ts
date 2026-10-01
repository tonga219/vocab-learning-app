import { useEffect, useState } from 'react';
import { isSameDay } from '../utils/date';

/** Current date that refreshes when the calendar day changes or the tab regains focus. */
export function useToday(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () =>
      setNow((prev) => {
        const next = new Date();
        return isSameDay(prev, next) ? prev : next;
      });
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return now;
}
