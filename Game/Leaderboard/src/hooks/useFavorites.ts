import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'apex_leaderboard_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites from localStorage', e);
    }
    return new Set<string>(['user-1', 'user-4']);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((userId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((userId: string) => {
    return favorites.has(userId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
