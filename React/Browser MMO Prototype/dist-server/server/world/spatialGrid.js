export const CHUNK_SIZE = 480; // 480px per chunk (10 tiles)
export class SpatialHashGrid {
    chunkSize = CHUNK_SIZE;
    // chunkKey 'cx,cy' -> Set of entity IDs
    chunks = new Map();
    // entityId -> chunkKey
    entityToChunk = new Map();
    getChunkKey(x, y) {
        const cx = Math.floor(x / this.chunkSize);
        const cy = Math.floor(y / this.chunkSize);
        return `${cx},${cy}`;
    }
    updateEntity(id, x, y) {
        const newKey = this.getChunkKey(x, y);
        const oldKey = this.entityToChunk.get(id);
        if (oldKey === newKey) {
            return;
        }
        if (oldKey) {
            const oldSet = this.chunks.get(oldKey);
            if (oldSet) {
                oldSet.delete(id);
                if (oldSet.size === 0) {
                    this.chunks.delete(oldKey);
                }
            }
        }
        let newSet = this.chunks.get(newKey);
        if (!newSet) {
            newSet = new Set();
            this.chunks.set(newKey, newSet);
        }
        newSet.add(id);
        this.entityToChunk.set(id, newKey);
    }
    removeEntity(id) {
        const oldKey = this.entityToChunk.get(id);
        if (oldKey) {
            const set = this.chunks.get(oldKey);
            if (set) {
                set.delete(id);
                if (set.size === 0) {
                    this.chunks.delete(oldKey);
                }
            }
            this.entityToChunk.delete(id);
        }
    }
    // Retrieve all entity IDs in adjacent chunks (3x3 grid around player)
    getNeighborEntityIds(x, y) {
        const centerCx = Math.floor(x / this.chunkSize);
        const centerCy = Math.floor(y / this.chunkSize);
        const results = new Set();
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const key = `${centerCx + dx},${centerCy + dy}`;
                const set = this.chunks.get(key);
                if (set) {
                    for (const id of set) {
                        results.add(id);
                    }
                }
            }
        }
        return results;
    }
    // Calculate Euclidean distance between two points
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
