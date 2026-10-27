import { HardwareProfile } from '../../src/types/game';

export const HARDWARE_PROFILES: HardwareProfile[] = [
  {
    id: 'steam-deck-oled',
    name: 'Steam Deck OLED',
    category: 'handheld',
    resolution: '1280x800 @ 90Hz',
    badgeLabel: 'Deck OLED'
  },
  {
    id: 'rog-ally',
    name: 'ASUS ROG Ally',
    category: 'handheld',
    resolution: '1920x1080 @ 120Hz',
    badgeLabel: 'ROG Ally (Z1E)'
  },
  {
    id: 'rtx-4060-laptop',
    name: 'RTX 4060 Laptop',
    category: 'laptop',
    resolution: '2560x1440 @ 144Hz',
    badgeLabel: 'RTX 4060 (1440p)'
  },
  {
    id: 'rtx-4090-desktop',
    name: 'RTX 4090 Enthusiast',
    category: 'desktop',
    resolution: '3840x2160 (4K Ultra)',
    badgeLabel: 'RTX 4090 (4K Ultra)'
  },
  {
    id: 'intel-integrated',
    name: 'Intel Iris Xe / Integrated',
    category: 'integrated',
    resolution: '1280x720 / 1080p Low',
    badgeLabel: 'Integrated Xe'
  }
];
