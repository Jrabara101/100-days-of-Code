import { useEffect, useState } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Fallback to default if storage unavailable or corrupted
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [key, state]);

  return [state, setState] as const;
}

