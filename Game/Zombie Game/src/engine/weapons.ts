import { WeaponEntity, ElementalType } from '../types/game';

export const INITIAL_WEAPONS: WeaponEntity[] = [
  {
    id: 'weapon_pistol',
    name: 'Tactical 9mm Sidearm',
    baseDamage: 28,
    fireRateRps: 4.5,
    clipSize: 15,
    currentAmmo: 15,
    reloadTimeMs: 1100,
    piercingCount: 1,
    elemental: 'none',
    tier: 1,
    bulletSpeed: 950,
    spreadAngle: 0.05,
    pelletCount: 1,
    kickback: 2,
    range: 650,
    description: 'Standard issue defense sidearm. High mobility and rapid active reload.',
  },
  {
    id: 'weapon_shotgun',
    name: 'Remington Pump Shotgun',
    baseDamage: 18, // per pellet
    fireRateRps: 1.2,
    clipSize: 8,
    currentAmmo: 8,
    reloadTimeMs: 1800,
    piercingCount: 1,
    elemental: 'none',
    tier: 1,
    bulletSpeed: 800,
    spreadAngle: 0.28,
    pelletCount: 6,
    kickback: 9,
    range: 480,
    description: 'Heavy kinetic scattergun. High stopping power and multi-target cone.',
  },
  {
    id: 'weapon_rifle',
    name: 'Tactical Carbine',
    baseDamage: 32,
    fireRateRps: 7.5,
    clipSize: 30,
    currentAmmo: 30,
    reloadTimeMs: 1600,
    piercingCount: 1,
    elemental: 'none',
    tier: 1,
    bulletSpeed: 1050,
    spreadAngle: 0.09,
    pelletCount: 1,
    kickback: 3,
    range: 750,
    description: 'Fully automatic battle rifle engineered for sustained horde suppression.',
  },
];

export interface WeaponUpgrade {
  id: string;
  name: string;
  type: 'damage' | 'firerate' | 'clip' | 'pierce' | 'elemental';
  elementalType?: ElementalType;
  cost: number;
  description: string;
  badge: string;
}

export const AVAILABLE_UPGRADES: WeaponUpgrade[] = [
  {
    id: 'upg_damage',
    name: 'High-Velocity Hollow Points',
    type: 'damage',
    cost: 150,
    description: '+35% kinetic damage per bullet',
    badge: 'LETHALITY',
  },
  {
    id: 'upg_firerate',
    name: 'Overclocked Bolt Carrier',
    type: 'firerate',
    cost: 180,
    description: '+30% cycling rate of fire',
    badge: 'CADENCE',
  },
  {
    id: 'upg_clip',
    name: 'Extended Drum Magazine',
    type: 'clip',
    cost: 120,
    description: '+50% magazine ammunition capacity',
    badge: 'CAPACITY',
  },
  {
    id: 'upg_pierce',
    name: 'Tungsten Penetrator Core',
    type: 'pierce',
    cost: 220,
    description: '+1 target piercing penetration',
    badge: 'BALLISTICS',
  },
  {
    id: 'upg_incendiary',
    name: 'Thermite Infusion Core',
    type: 'elemental',
    elementalType: 'incendiary',
    cost: 320,
    description: 'Inflicts thermal burn ticks and creates lingering napalm zones',
    badge: 'INCENDIARY',
  },
  {
    id: 'upg_cryo',
    name: 'Sub-Zero Liquid Cryo Cell',
    type: 'elemental',
    elementalType: 'cryo',
    cost: 320,
    description: 'Slows hostiles by 50% and crystallizes targets into shatterable ice',
    badge: 'CRYO',
  },
  {
    id: 'upg_shock',
    name: 'Tesla Induction Coil',
    type: 'elemental',
    elementalType: 'shock',
    cost: 350,
    description: 'Discharges high-voltage arcs chaining between up to 4 nearby hostiles',
    badge: 'TESLA SHOCK',
  },
];

export function applyUpgradeToWeapon(weapon: WeaponEntity, upgrade: WeaponUpgrade): WeaponEntity {
  const updated = { ...weapon };
  updated.tier += 1;

  if (upgrade.type === 'damage') {
    updated.baseDamage = Math.round(updated.baseDamage * 1.35);
  } else if (upgrade.type === 'firerate') {
    updated.fireRateRps = parseFloat((updated.fireRateRps * 1.3).toFixed(2));
  } else if (upgrade.type === 'clip') {
    updated.clipSize = Math.round(updated.clipSize * 1.5);
    updated.currentAmmo = updated.clipSize;
  } else if (upgrade.type === 'pierce') {
    updated.piercingCount += 1;
  } else if (upgrade.type === 'elemental' && upgrade.elementalType) {
    updated.elemental = upgrade.elementalType;
    if (upgrade.elementalType === 'shock') {
      updated.name = `Tesla ${weapon.name.replace(/Tactical|Remington|Combat/, '').trim()}`;
    } else if (upgrade.elementalType === 'incendiary') {
      updated.name = `Incendiary ${weapon.name.replace(/Tactical|Remington|Combat/, '').trim()}`;
    } else if (upgrade.elementalType === 'cryo') {
      updated.name = `Cryo ${weapon.name.replace(/Tactical|Remington|Combat/, '').trim()}`;
    }
  }

  return updated;
}
