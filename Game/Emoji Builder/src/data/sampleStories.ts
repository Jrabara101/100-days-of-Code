import { EmojiStoryState } from '../types';

export const DEFAULT_STORY: EmojiStoryState = {
  storyId: 'strawberry-bake-off',
  title: 'Adventure 06: The Great Strawberry Bake-off 🐻🍓🎂',
  author: 'Chef Teddy & Friends',
  theme: 'berry_patisserie',
  bgMode: 'styled_pattern',
  aspectRatio: '16:9',
  activePanelId: 'panel-3',
  selectedStickerId: 'sticker-bear',
  selectedBubbleId: null,
  playback: {
    isPlaying: false,
    currentIndex: 2,
    speedMultiplier: 1.0,
    loop: true,
  },
  gameMode: 'creator',
  targetSecretPlot: 'The Great Strawberry Bake-off',
  guesserState: {
    guesses: [],
    isSolved: false,
    hintsRevealed: 0,
  },
  panels: [
    {
      id: 'panel-1',
      title: '#1 Flour Sift',
      caption: 'Gathering golden morning grains and sweet mountain cream for the annual patisserie tournament.',
      mood: 'playful',
      backgroundGradient: 'from-amber-50 to-orange-50',
      durationMs: 2200,
      soundEffect: 'pop',
      stickers: [
        { id: 'p1-1', char: '🌾', x: 25, y: 55, scale: 1.8, rotation: -6, animation: 'float' },
        { id: 'p1-2', char: '🥛', x: 50, y: 50, scale: 1.6, rotation: 4, animation: 'bounce' },
        { id: 'p1-3', char: '🍯', x: 75, y: 55, scale: 1.7, rotation: -3, animation: 'wobble' },
      ],
      speechBubbles: [
        {
          id: 'b1',
          text: 'First step: Fresh milk and pure sweet honey! 🌾🍯',
          x: 38,
          y: 20,
          type: 'speech',
          tailDirection: 'bottom-left',
        },
      ],
    },
    {
      id: 'panel-2',
      title: '#2 Berry Jam',
      caption: 'Simmering sun-ripened ruby strawberries into a thick, shimmering glaze with a wave of the star whisk.',
      mood: 'playful',
      backgroundGradient: 'from-rose-50 to-pink-50',
      durationMs: 2500,
      soundEffect: 'squish',
      stickers: [
        { id: 'p2-1', char: '🍓', x: 30, y: 50, scale: 2.2, rotation: -8, animation: 'bounce' },
        { id: 'p2-2', char: '🪄', x: 55, y: 35, scale: 1.9, rotation: 25, animation: 'float' },
        { id: 'p2-3', char: '✨', x: 68, y: 25, scale: 1.4, rotation: 10, animation: 'pulse' },
        { id: 'p2-4', char: '🫖', x: 78, y: 60, scale: 1.8, rotation: 0 },
      ],
      speechBubbles: [
        {
          id: 'b2',
          text: 'A pinch of magic whisk sparkles makes the glaze shine! ✨',
          x: 50,
          y: 18,
          type: 'thought',
          tailDirection: 'bottom-right',
        },
      ],
    },
    {
      id: 'panel-3',
      title: '#3 Bake-off Climax',
      caption: 'More whip cream on the berry tower before the party begins! 🍓🍰 Chef Teddy adds the golden cherry topper!',
      mood: 'playful',
      backgroundGradient: 'from-[#FFFDFB] to-[#FFF5EE]',
      durationMs: 3800,
      soundEffect: 'ding',
      choices: [
        {
          id: 'c1',
          labelEmoji: '🍓',
          label: 'Drizzle Extra Glaze',
          targetPanelId: 'panel-4',
        },
        {
          id: 'c2',
          labelEmoji: '🐻',
          label: 'Taste Test First!',
          targetPanelId: 'panel-4',
        },
      ],
      stickers: [
        {
          id: 'sticker-bear',
          char: '🐻',
          name: 'Chef Teddy',
          x: 20,
          y: 50,
          scale: 2.5,
          rotation: 0,
          animation: 'wobble',
        },
        {
          id: 'sticker-whisk',
          char: '🪄',
          name: 'Magic Whisk',
          x: 29,
          y: 62,
          scale: 1.6,
          rotation: 18,
          animation: 'pulse',
        },
        {
          id: 'sticker-honey',
          char: '🍯',
          name: 'Honey Jar',
          x: 36,
          y: 68,
          scale: 1.4,
          rotation: -10,
        },
        {
          id: 'sticker-cake',
          char: '🎂',
          name: 'Grand 3-Tier Cake',
          x: 52,
          y: 48,
          scale: 3.0,
          rotation: 0,
          animation: 'bounce',
        },
        {
          id: 'sticker-cherry',
          char: '🍒',
          name: 'Golden Cherry Topper',
          x: 80,
          y: 35,
          scale: 2.2,
          rotation: 5,
          animation: 'float',
        },
        {
          id: 'sticker-sparkles',
          char: '✨',
          name: 'Glitter',
          x: 88,
          y: 28,
          scale: 1.5,
          rotation: 0,
          animation: 'pulse',
        },
      ],
      speechBubbles: [
        {
          id: 'b3',
          text: '"More whip cream on the berry tower before the party begins! 🍓🍰"',
          x: 25,
          y: 18,
          type: 'speech',
          tailDirection: 'bottom-left',
        },
        {
          id: 'b4',
          text: '"Chef Teddy adds the golden cherry topper!" ⭐',
          x: 75,
          y: 15,
          type: 'speech',
          tailDirection: 'bottom-right',
        },
      ],
    },
    {
      id: 'panel-4',
      title: '#4 Cake Feast & Finale',
      caption: 'The entire forest kingdom arrives to taste the masterpiece—crowned champion with a round of cheerful applause!',
      mood: 'romantic',
      backgroundGradient: 'from-pink-50 to-rose-100',
      durationMs: 3000,
      soundEffect: 'chime',
      stickers: [
        { id: 'p4-1', char: '🍰', x: 25, y: 55, scale: 2.0, rotation: -5, animation: 'float' },
        { id: 'p4-2', char: '🥳', x: 48, y: 45, scale: 2.2, rotation: 6, animation: 'bounce' },
        { id: 'p4-3', char: '🎁', x: 70, y: 58, scale: 1.7, rotation: -4, animation: 'pulse' },
        { id: 'p4-4', char: '👑', x: 48, y: 22, scale: 1.6, rotation: 0, animation: 'wobble' },
      ],
      speechBubbles: [
        {
          id: 'b5',
          text: 'Best strawberry cake in the whole toybox! Hooray! 🍰🎉',
          x: 50,
          y: 15,
          type: 'shout',
          tailDirection: 'bottom-left',
        },
      ],
    },
  ],
};

export interface GuesserPuzzle {
  id: string;
  title: string;
  category: 'Movie' | 'Fairy Tale' | 'Pop Culture';
  emojis: string[];
  hints: string[];
  proseMask: string;
}

export const GUESSER_PUZZLES: GuesserPuzzle[] = [
  {
    id: 'star-wars',
    title: 'Star Wars',
    category: 'Movie',
    emojis: ['🌌', '⚔️', '🤖', '🛸', '💥'],
    hints: [
      'Genre: Sci-Fi space opera',
      'Key elements: Laser swords, droids & galaxy battle',
      'First letter: S',
    ],
    proseMask: 'In a galaxy far, far away, an epic confrontation between laser swords and an interstellar empire shakes the universe.',
  },
  {
    id: 'titanic',
    title: 'Titanic',
    category: 'Movie',
    emojis: ['🚢', '🌊', '🧊', '🎻', '💔'],
    hints: [
      'Genre: Romantic Disaster Drama',
      'Key elements: Unsinkable ship meets an icy fate while the violin plays',
      'First letter: T',
    ],
    proseMask: 'The grand luxury liner embarks across the frozen Atlantic, but fate strikes cold as a heart breaks across the waves.',
  },
  {
    id: 'jurassic-park',
    title: 'Jurassic Park',
    category: 'Movie',
    emojis: ['🏝️', '🦖', '🚗', '🧬', '😱'],
    hints: [
      'Genre: Sci-Fi Adventure',
      'Key elements: Ancient amber DNA, tour jeeps & hungry giant reptiles',
      'First letter: J',
    ],
    proseMask: 'Scientists spared no expense resurrecting prehistory on an island retreat, until the electric fences fail during a storm.',
  },
  {
    id: 'cinderella',
    title: 'Cinderella',
    category: 'Fairy Tale',
    emojis: ['🧹', '🎃', '👠', '🏰', '🕛'],
    hints: [
      'Genre: Classic Fairy Tale',
      'Key elements: Midnight curfew, a pumpkin carriage & a glass slipper',
      'First letter: C',
    ],
    proseMask: 'From cleaning the hearth to dancing at the royal ball, one lost shoe changes everything before the clock strikes twelve.',
  },
  {
    id: 'the-matrix',
    title: 'The Matrix',
    category: 'Movie',
    emojis: ['💊', '🕶️', '💻', '🥋', '🟢'],
    hints: [
      'Genre: Cyberpunk Action',
      'Key elements: Choose between the red pill or blue pill; green code cascades',
      'First letter: T',
    ],
    proseMask: 'A computer programmer awakens to discover the world is an elaborate cyber simulation governed by machines.',
  },
];
