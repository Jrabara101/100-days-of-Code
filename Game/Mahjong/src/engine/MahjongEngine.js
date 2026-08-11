// Headless 3D Spatial Occlusion & Matching Engine for Mahjong Solitaire
export class MahjongEngine {
    constructor() {
        this.tileWidth = 1.0;
        this.tileHeight = 1.35;
        this.tileDepth = 0.42;

        this.tilesMap = new Map(); // Key: "x,y,z" -> Tile Record
        this.meshToTileMap = new Map(); // Three.js Mesh -> Tile Record
        this.selectedTile = null;
        this.historyStack = [];
        this.hintedTiles = [];
    }

    // Standard Solvable Turtle / Pyramid Layout (104 to 144 tiles)
    buildTurtleLayout() {
        this.tilesMap.clear();
        this.meshToTileMap.clear();
        this.historyStack = [];
        this.selectedTile = null;
        this.hintedTiles = [];

        const layoutCoords = [];

        // Layer 0: Base 12x8 layout
        for (let r = -3.5; r <= 3.5; r += 1) {
            for (let c = -5.5; c <= 5.5; c += 1) {
                if (Math.abs(r) === 3.5 && Math.abs(c) >= 4.5) continue;
                layoutCoords.push({ x: c * 1.02, y: r * 1.38, z: 0 });
            }
        }
        // Wing extensions at Layer 0
        layoutCoords.push({ x: -6.52, y: 0, z: 0 });
        layoutCoords.push({ x: 6.52, y: 0, z: 0 });

        // Layer 1: 6x4 mid platform
        for (let r = -1.5; r <= 1.5; r += 1) {
            for (let c = -2.5; c <= 2.5; c += 1) {
                layoutCoords.push({ x: c * 1.02, y: r * 1.38, z: 1 });
            }
        }

        // Layer 2: 4x2 upper platform
        for (let r = -0.5; r <= 0.5; r += 1) {
            for (let c = -1.5; c <= 1.5; c += 1) {
                layoutCoords.push({ x: c * 1.02, y: r * 1.38, z: 2 });
            }
        }

        // Layer 3: 2x2 upper peak
        for (let r = -0.5; r <= 0.5; r += 1) {
            for (let c = -0.5; c <= 0.5; c += 1) {
                layoutCoords.push({ x: c * 1.02, y: r * 1.38, z: 3 });
            }
        }

        // Layer 4: Top central tile
        layoutCoords.push({ x: 0, y: 0, z: 4 });

        // Ensure total tiles count is an even number
        let totalTiles = layoutCoords.length;
        if (totalTiles % 2 !== 0) {
            layoutCoords.pop();
            totalTiles = layoutCoords.length;
        }

        // Generate Tile Identities in Pairs
        const tilePool = [];
        const suits = [
            { name: 'BAMBOO', maxVal: 9 },
            { name: 'CHARACTER', maxVal: 9 },
            { name: 'DOTS', maxVal: 9 },
            { name: 'DRAGON', maxVal: 3 },
            { name: 'WIND', maxVal: 4 }
        ];

        let pairCount = totalTiles / 2;
        let suitIdx = 0;
        let val = 1;

        for (let i = 0; i < pairCount; i++) {
            const currentSuit = suits[suitIdx];
            const tileID = `${currentSuit.name}_${val}`;
            tilePool.push(tileID, tileID); // Push matching pair

            val++;
            if (val > currentSuit.maxVal) {
                val = 1;
                suitIdx = (suitIdx + 1) % suits.length;
            }
        }

        // Shuffle Tile IDs across layout positions
        for (let i = tilePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
        }

        // Populate Tiles Spatial Map
        layoutCoords.forEach((coord, idx) => {
            const key = `${coord.x.toFixed(2)},${coord.y.toFixed(2)},${coord.z}`;
            const tileRecord = {
                id: `tile_${idx}`,
                key: key,
                tileID: tilePool[idx],
                x: coord.x,
                y: coord.y,
                z: coord.z,
                mesh: null,
                active: true
            };
            this.tilesMap.set(key, tileRecord);
        });
    }

    // --- 3D SPATIAL OCCLUSION GATE ---
    // A tile is free IF NO tile is directly above (z+1) AND (NO left neighbor OR NO right neighbor)
    isTileSelectable(tile) {
        if (!tile || !tile.active) return false;

        const w = this.tileWidth * 0.88;
        const h = this.tileHeight * 0.88;

        let blockedTop = false;
        let blockedLeft = false;
        let blockedRight = false;

        for (const other of this.tilesMap.values()) {
            if (!other.active || other.id === tile.id) continue;

            // 1. Check Top Block (Z + 1)
            if (other.z === tile.z + 1) {
                if (Math.abs(other.x - tile.x) < w && Math.abs(other.y - tile.y) < h) {
                    blockedTop = true;
                    break;
                }
            }

            // 2. Check Lateral Side Blocks (Same Z)
            if (other.z === tile.z && Math.abs(other.y - tile.y) < h) {
                if (other.x < tile.x && (tile.x - other.x) <= w * 1.15) {
                    blockedLeft = true;
                }
                if (other.x > tile.x && (other.x - tile.x) <= w * 1.15) {
                    blockedRight = true;
                }
            }
        }

        return !blockedTop && (!blockedLeft || !blockedRight);
    }

    // Find all currently selectable matching pairs
    getSelectablePairs() {
        const selectableTiles = Array.from(this.tilesMap.values()).filter(t => t.active && this.isTileSelectable(t));
        const pairs = [];
        for (let i = 0; i < selectableTiles.length; i++) {
            for (let j = i + 1; j < selectableTiles.length; j++) {
                if (selectableTiles[i].tileID === selectableTiles[j].tileID) {
                    pairs.push([selectableTiles[i], selectableTiles[j]]);
                }
            }
        }
        return pairs;
    }

    // Shuffle active tile values while maintaining position structure
    shuffleActiveTiles() {
        const activeTiles = Array.from(this.tilesMap.values()).filter(t => t.active);
        const activeIDs = activeTiles.map(t => t.tileID);

        for (let i = activeIDs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activeIDs[i], activeIDs[j]] = [activeIDs[j], activeIDs[i]];
        }

        activeTiles.forEach((tile, i) => {
            tile.tileID = activeIDs[i];
        });
    }
}
