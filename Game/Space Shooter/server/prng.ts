// Deterministic Mulberry32 Pseudo-Random Number Generator
export function stringToSeed(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return (hash >>> 0);
}

export function createMulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailySeed(dateStr?: string): { seed: number; dateString: string; sectorName: string } {
  const d = dateStr ? new Date(dateStr) : new Date();
  const dateString = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const seed = stringToSeed(`SECTOR-DAILY-${dateString}`);

  const sectorNames = [
    "Aethelgard Core",
    "Nebula Meridian-9",
    "Cerberus Outpost",
    "Zenith Orbital Array",
    "Tartarus Rift",
    "Valhalla Breach",
    "Hyperion Expanse",
    "Vanguard Proving Ground",
    "Orion Terminal",
    "Prometheus Abyss"
  ];
  const rng = createMulberry32(seed);
  const nameIndex = Math.floor(rng() * sectorNames.length);

  return {
    seed,
    dateString,
    sectorName: sectorNames[nameIndex],
  };
}
