import { BarricadeEntity, FloodlightEntity, TripwireEntity } from '../types/game';

export function createInitialBarricades(arenaWidth = 1600, arenaHeight = 1200): BarricadeEntity[] {
  // Strategic defensive choke points around the safe-house bunker in the center
  const cx = arenaWidth / 2;
  const cy = arenaHeight / 2;

  return [
    // Top defensive gate barricade
    {
      id: 'barricade_north_left',
      x: cx - 180,
      y: cy - 160,
      width: 110,
      height: 24,
      health: 250,
      maxHealth: 250,
    },
    {
      id: 'barricade_north_right',
      x: cx + 70,
      y: cy - 160,
      width: 110,
      height: 24,
      health: 250,
      maxHealth: 250,
    },
    // South barricades
    {
      id: 'barricade_south_left',
      x: cx - 180,
      y: cy + 160,
      width: 110,
      height: 24,
      health: 250,
      maxHealth: 250,
    },
    {
      id: 'barricade_south_right',
      x: cx + 70,
      y: cy + 160,
      width: 110,
      height: 24,
      health: 250,
      maxHealth: 250,
    },
    // West window
    {
      id: 'barricade_west',
      x: cx - 240,
      y: cy - 40,
      width: 24,
      height: 80,
      health: 220,
      maxHealth: 220,
    },
    // East window
    {
      id: 'barricade_east',
      x: cx + 240,
      y: cy - 40,
      width: 24,
      height: 80,
      health: 220,
      maxHealth: 220,
    },
  ];
}

export function createInitialFloodlights(arenaWidth = 1600, arenaHeight = 1200): FloodlightEntity[] {
  const cx = arenaWidth / 2;
  const cy = arenaHeight / 2;

  return [
    {
      id: 'floodlight_north',
      x: cx,
      y: cy - 220,
      radius: 180,
      angle: -Math.PI / 2,
      fov: Math.PI,
      active: true,
    },
    {
      id: 'floodlight_south',
      x: cx,
      y: cy + 220,
      radius: 180,
      angle: Math.PI / 2,
      fov: Math.PI,
      active: true,
    },
  ];
}
