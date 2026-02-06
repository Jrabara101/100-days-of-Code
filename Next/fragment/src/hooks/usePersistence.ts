import { useEffect } from 'react';
import { useDocumentStore } from '@/store/useDocumentStore';

export function usePersistence() {
    const dirtyBlockIds = useDocumentStore((state) => state.dirtyBlockIds);
    const clearDirtyIds = useDocumentStore((state) => state.clearDirtyIds);
    const blocks = useDocumentStore((state) => state.blocks);

    useEffect(() => {
        const interval = setInterval(() => {
            if (dirtyBlockIds.size === 0) return;

            const idsToSync = Array.from(dirtyBlockIds);
            const blocksToSync = idsToSync.map(id => blocks[id]).filter(Boolean);

            console.log('Syncing blocks to DB:', blocksToSync);

            // In a real app, you would await an API call here.
            // For now, we assume success immediately.

            clearDirtyIds(idsToSync);

        }, 5000);

        return () => clearInterval(interval);
    }, [dirtyBlockIds, blocks, clearDirtyIds]);
}
