import { useMemo, useCallback } from 'react';
import { useStore, AlchemyTagWeight } from '../lib/store';

export interface AlchemyPreset {
  id: string;
  name: string;
  tags: AlchemyTagWeight[];
  excludeTags: string[];
}

export const ALCHEMY_PRESETS: AlchemyPreset[] = [
  {
    id: 'tactical-roguelike',
    name: 'Tactical Roguelike',
    tags: [
      { name: 'Tactical', weight: 60 },
      { name: 'Roguelike', weight: 40 },
    ],
    excludeTags: ['Microtransactions'],
  },
  {
    id: 'cozy-builder',
    name: 'Cozy Base-Builder',
    tags: [
      { name: 'Cozy', weight: 65 },
      { name: 'Base-Builder', weight: 35 },
    ],
    excludeTags: ['Microtransactions', 'PvP'],
  },
  {
    id: 'dark-souls-metroid',
    name: 'Grim Soulslike',
    tags: [
      { name: 'Soulslike', weight: 70 },
      { name: 'Difficult', weight: 30 },
    ],
    excludeTags: ['Microtransactions'],
  },
  {
    id: 'space-automation',
    name: 'Deep Automation',
    tags: [
      { name: 'Automation', weight: 60 },
      { name: 'Sci-Fi', weight: 40 },
    ],
    excludeTags: ['Microtransactions'],
  },
  {
    id: 'poker-gambit',
    name: 'Card Rogue Synergy',
    tags: [
      { name: 'Deckbuilder', weight: 70 },
      { name: 'Roguelike', weight: 30 },
    ],
    excludeTags: ['Microtransactions', 'Early Access'],
  },
];

export function useGenreAlchemy() {
  const alchemyTags = useStore((s) => s.alchemyTags);
  const setAlchemyTags = useStore((s) => s.setAlchemyTags);
  const updateAlchemyTag = useStore((s) => s.updateAlchemyTag);
  const addAlchemyTag = useStore((s) => s.addAlchemyTag);
  const removeAlchemyTag = useStore((s) => s.removeAlchemyTag);
  const excludeTags = useStore((s) => s.excludeTags);
  const toggleExcludeTag = useStore((s) => s.toggleExcludeTag);

  const totalWeight = useMemo(() => {
    return alchemyTags.reduce((sum, t) => sum + t.weight, 0);
  }, [alchemyTags]);

  const applyPreset = useCallback(
    (presetId: string) => {
      const found = ALCHEMY_PRESETS.find((p) => p.id === presetId);
      if (found) {
        setAlchemyTags(found.tags);
        // Replace exclude tags with preset defaults
        found.excludeTags.forEach((tag) => {
          if (!excludeTags.includes(tag)) {
            toggleExcludeTag(tag);
          }
        });
      }
    },
    [setAlchemyTags, excludeTags, toggleExcludeTag]
  );

  const resetAlchemy = useCallback(() => {
    setAlchemyTags([
      { name: 'Tactical', weight: 60 },
      { name: 'Roguelike', weight: 40 },
    ]);
  }, [setAlchemyTags]);

  return {
    alchemyTags,
    excludeTags,
    totalWeight,
    setAlchemyTags,
    updateAlchemyTag,
    addAlchemyTag,
    removeAlchemyTag,
    toggleExcludeTag,
    applyPreset,
    resetAlchemy,
    presets: ALCHEMY_PRESETS,
  };
}
