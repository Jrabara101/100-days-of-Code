export interface EmojiItem {
  char: string;
  name: string;
  category: 'bakery' | 'friends' | 'fantasy' | 'adventure' | 'emotes' | 'objects';
  keywords: string[];
}

export const EMOJI_CATALOG: EmojiItem[] = [
  // Bakery & Sweets
  { char: '🍓', name: 'Strawberry', category: 'bakery', keywords: ['berry', 'fruit', 'sweet', 'red'] },
  { char: '🍰', name: 'Shortcake', category: 'bakery', keywords: ['cake', 'slice', 'pastry', 'dessert'] },
  { char: '🎂', name: 'Tiered Cake', category: 'bakery', keywords: ['birthday', 'celebration', 'sponge'] },
  { char: '🧁', name: 'Cupcake', category: 'bakery', keywords: ['whip', 'frosting', 'sweet', 'muffin'] },
  { char: '🍪', name: 'Cookie', category: 'bakery', keywords: ['chocolate', 'chip', 'biscuit', 'snack'] },
  { char: '🧇', name: 'Waffle', category: 'bakery', keywords: ['breakfast', 'syrup', 'grid', 'pastry'] },
  { char: '🍩', name: 'Donut', category: 'bakery', keywords: ['doughnut', 'glazed', 'sprinkles'] },
  { char: '🥐', name: 'Croissant', category: 'bakery', keywords: ['pastry', 'french', 'butter', 'bread'] },
  { char: '🍯', name: 'Honey Pot', category: 'bakery', keywords: ['honey', 'pot', 'amber', 'sweet', 'jar'] },
  { char: '🍒', name: 'Cherries', category: 'bakery', keywords: ['cherry', 'topper', 'fruit', 'red'] },
  { char: '🥧', name: 'Sugar Pie', category: 'bakery', keywords: ['pie', 'tart', 'baked', 'crust'] },
  { char: '🫖', name: 'Rose Teapot', category: 'bakery', keywords: ['tea', 'pot', 'drink', 'ceramic'] },
  { char: '🥛', name: 'Fresh Milk', category: 'bakery', keywords: ['milk', 'carton', 'dairy', 'drink'] },
  { char: '🥞', name: 'Pancakes', category: 'bakery', keywords: ['stack', 'syrup', 'fluffy', 'breakfast'] },
  { char: '🍫', name: 'Chocolate', category: 'bakery', keywords: ['cocoa', 'bar', 'dark', 'sweet'] },
  { char: '🍬', name: 'Hard Candy', category: 'bakery', keywords: ['sweet', 'sugar', 'wrapper'] },
  { char: '🍮', name: 'Custard Flan', category: 'bakery', keywords: ['pudding', 'caramel', 'custard'] },
  { char: '🍨', name: 'Ice Cream', category: 'bakery', keywords: ['bowl', 'gelato', 'cold', 'scoop'] },

  // Friends & Animals
  { char: '🐻', name: 'Teddy Bear', category: 'friends', keywords: ['bear', 'chef', 'cute', 'animal'] },
  { char: '🐰', name: 'Bunny', category: 'friends', keywords: ['rabbit', 'ears', 'cute', 'white'] },
  { char: '🐱', name: 'Kitty', category: 'friends', keywords: ['cat', 'meow', 'pet', 'whiskers'] },
  { char: '🐶', name: 'Puppy', category: 'friends', keywords: ['dog', 'woof', 'faithful', 'pet'] },
  { char: '🦊', name: 'Fox', category: 'friends', keywords: ['clever', 'orange', 'forest', 'tail'] },
  { char: '🐼', name: 'Panda', category: 'friends', keywords: ['bamboo', 'bear', 'black', 'white'] },
  { char: '🐨', name: 'Koala', category: 'friends', keywords: ['eucalyptus', 'sleepy', 'australia'] },
  { char: '🦄', name: 'Unicorn', category: 'friends', keywords: ['magic', 'horn', 'mythical', 'horse'] },
  { char: '🐸', name: 'Frog', category: 'friends', keywords: ['ribbit', 'green', 'pond', 'hop'] },
  { char: '🐝', name: 'Honey Bee', category: 'friends', keywords: ['buzz', 'pollen', 'stripes', 'insect'] },
  { char: '🦋', name: 'Butterfly', category: 'friends', keywords: ['wings', 'flutter', 'nature', 'pretty'] },
  { char: '🐙', name: 'Octopus', category: 'friends', keywords: ['tentacles', 'ocean', 'sea', 'purple'] },
  { char: '🐧', name: 'Penguin', category: 'friends', keywords: ['antarctic', 'waddle', 'bird', 'tuxedo'] },
  { char: '🦉', name: 'Wise Owl', category: 'friends', keywords: ['night', 'wisdom', 'feathers', 'bird'] },

  // Fantasy & Magic
  { char: '🪄', name: 'Magic Whisk', category: 'fantasy', keywords: ['wand', 'sparkle', 'spell', 'whisk'] },
  { char: '✨', name: 'Sparkles', category: 'fantasy', keywords: ['glitter', 'shine', 'glow', 'star'] },
  { char: '⭐', name: 'Gold Star', category: 'fantasy', keywords: ['star', 'topper', 'yellow', 'night'] },
  { char: '🌟', name: 'Glowing Star', category: 'fantasy', keywords: ['burst', 'bright', 'shine'] },
  { char: '💫', name: 'Dizzy Star', category: 'fantasy', keywords: ['swirl', 'magic', 'orbit'] },
  { char: '🌙', name: 'Crescent Moon', category: 'fantasy', keywords: ['night', 'dream', 'sleep', 'lunar'] },
  { char: '🌈', name: 'Rainbow', category: 'fantasy', keywords: ['colors', 'sky', 'prism', 'weather'] },
  { char: '👑', name: 'Royal Crown', category: 'fantasy', keywords: ['king', 'queen', 'gold', 'monarch'] },
  { char: '🔮', name: 'Crystal Ball', category: 'fantasy', keywords: ['fortune', 'mystic', 'future', 'orb'] },
  { char: '🗝️', name: 'Golden Key', category: 'fantasy', keywords: ['unlock', 'secret', 'mystery', 'door'] },
  { char: '🏰', name: 'Castle', category: 'fantasy', keywords: ['palace', 'kingdom', 'fairytale', 'towers'] },
  { char: '🧚', name: 'Fairy', category: 'fantasy', keywords: ['pixie', 'wings', 'enchanted', 'sprite'] },
  { char: '💎', name: 'Diamond Gem', category: 'fantasy', keywords: ['jewel', 'crystal', 'precious', 'rare'] },
  { char: '🍄', name: 'Magic Mushroom', category: 'fantasy', keywords: ['fungus', 'forest', 'toadstool'] },
  { char: '🌸', name: 'Cherry Blossom', category: 'fantasy', keywords: ['flower', 'spring', 'pink', 'bloom'] },
  { char: '🍀', name: 'Lucky Clover', category: 'fantasy', keywords: ['luck', 'four', 'leaf', 'green'] },

  // Adventure & Action
  { char: '🤠', name: 'Space Cowboy', category: 'adventure', keywords: ['western', 'hat', 'hero', 'adventurer'] },
  { char: '🚀', name: 'Rocket Ship', category: 'adventure', keywords: ['space', 'blast', 'galaxy', 'flight'] },
  { char: '👾', name: 'Alien Invader', category: 'adventure', keywords: ['extraterrestrial', 'monster', 'game', 'pixel'] },
  { char: '💥', name: 'Explosion POW', category: 'adventure', keywords: ['boom', 'comic', 'hit', 'blast'] },
  { char: '⚔️', name: 'Crossed Swords', category: 'adventure', keywords: ['duel', 'battle', 'blade', 'fight'] },
  { char: '🛡️', name: 'Knight Shield', category: 'adventure', keywords: ['defense', 'armor', 'protection'] },
  { char: '🗺️', name: 'Treasure Map', category: 'adventure', keywords: ['quest', 'island', 'navigation', 'x'] },
  { char: '⛵', name: 'Sailboat', category: 'adventure', keywords: ['voyage', 'sea', 'wind', 'ocean'] },
  { char: '🧭', name: 'Compass', category: 'adventure', keywords: ['direction', 'north', 'journey', 'travel'] },
  { char: '🏔️', name: 'Snowy Peak', category: 'adventure', keywords: ['mountain', 'climb', 'summit', 'nature'] },
  { char: '🌋', name: 'Volcano', category: 'adventure', keywords: ['lava', 'eruption', 'fire', 'danger'] },
  { char: '🚗', name: 'Road Cruiser', category: 'adventure', keywords: ['car', 'travel', 'trip', 'drive'] },
  { char: '🛸', name: 'Flying Saucer', category: 'adventure', keywords: ['ufo', 'alien', 'spaceship', 'beam'] },
  { char: '🏹', name: 'Bow & Arrow', category: 'adventure', keywords: ['archer', 'target', 'hunt', 'shoot'] },

  // Emotes & Reactions
  { char: '🥰', name: 'Loving Heart Eyes', category: 'emotes', keywords: ['love', 'sweet', 'warm', 'happy'] },
  { char: '🥳', name: 'Party Popper', category: 'emotes', keywords: ['celebrate', 'horn', 'birthday', 'fun'] },
  { char: '🤩', name: 'Starstruck', category: 'emotes', keywords: ['stars', 'amazed', 'wow', 'excited'] },
  { char: '🧐', name: 'Curious Monocle', category: 'emotes', keywords: ['inspect', 'thinking', 'mystery', 'detective'] },
  { char: '😴', name: 'Sleepy Zzz', category: 'emotes', keywords: ['tired', 'nap', 'bedtime', 'dream'] },
  { char: '😱', name: 'Shock & Gasp', category: 'emotes', keywords: ['surprise', 'terror', 'scared', 'scream'] },
  { char: '😎', name: 'Cool Shades', category: 'emotes', keywords: ['sunglasses', 'confident', 'chill'] },
  { char: '🤖', name: 'Cyber Robot', category: 'emotes', keywords: ['android', 'bot', 'machine', 'tech'] },
  { char: '👻', name: 'Spooky Ghost', category: 'emotes', keywords: ['phantom', 'boo', 'halloween', 'spirit'] },
  { char: '💖', name: 'Sparkle Heart', category: 'emotes', keywords: ['love', 'pink', 'romance', 'affection'] },
  { char: '💔', name: 'Broken Heart', category: 'emotes', keywords: ['crack', 'sad', 'drama', 'grief'] },
  { char: '🔥', name: 'Hot Fire', category: 'emotes', keywords: ['flame', 'burn', 'spicy', 'intense'] },

  // Objects & Decor
  { char: '🔔', name: 'Chime Bell', category: 'objects', keywords: ['ring', 'alarm', 'brass', 'sound'] },
  { char: '🎀', name: 'Patisserie Ribbon', category: 'objects', keywords: ['bow', 'pink', 'gift', 'wrap'] },
  { char: '🎁', name: 'Wrapped Gift', category: 'objects', keywords: ['present', 'surprise', 'box', 'holiday'] },
  { char: '🎈', name: 'Party Balloon', category: 'objects', keywords: ['helium', 'float', 'red', 'celebrate'] },
  { char: '🎨', name: 'Artist Palette', category: 'objects', keywords: ['paint', 'color', 'brush', 'draw'] },
  { char: '📸', name: 'Camera Shutter', category: 'objects', keywords: ['photo', 'snapshot', 'lens', 'picture'] },
  { char: '📚', name: 'Story Books', category: 'objects', keywords: ['read', 'novel', 'pages', 'library'] },
  { char: '🎵', name: 'Musical Note', category: 'objects', keywords: ['song', 'melody', 'tune', 'sound'] },
  { char: '💡', name: 'Lightbulb Idea', category: 'objects', keywords: ['brainstorm', 'bright', 'electric'] },
  { char: '☕', name: 'Warm Mug', category: 'objects', keywords: ['coffee', 'tea', 'steaming', 'relax'] },
];

export const COMPANION_EMOJIS: Record<string, string[]> = {
  '🐻': ['🍓', '🎂', '🍯', '🪄', '🧁', '🎀'],
  '🍓': ['🍰', '🧁', '🥛', '🍒', '✨', '🍪'],
  '🎂': ['🕯️', '🍓', '🍒', '⭐', '🥳', '🎁'],
  '🤠': ['🚀', '👾', '💥', '🛸', '⭐', '🗺️'],
  '🚀': ['👾', '💥', '🌌', '⭐', '🛸', '🤠'],
  '🐝': ['🍯', '🌸', '🌻', '🍀', '✨', '☀️'],
  '🌊': ['⛵', '🐙', '🐚', '🏝️', '🐬', '🪸'],
  '🪄': ['✨', '⭐', '🔮', '👑', '🧚', '🌟'],
  '🧁': ['🍓', '🎀', '☕', '🍒', '✨', '🍪'],
  '🍯': ['🐻', '🐝', '🧇', '🥞', '🥐', '🫖'],
};

export const BAKED_PROP_RECIPES = [
  { name: 'Berry Galaxy Float', combo: ['🍓', '🚀', '✨', '🍦'] },
  { name: 'Honey Knight Vanguard', combo: ['🐻', '🍯', '🛡️', '⚔️'] },
  { name: 'Enchanted Tea Party', combo: ['🫖', '🧁', '🧚', '🌸'] },
  { name: 'Cosmic Alien Cookie', combo: ['🍪', '👾', '🛸', '⭐'] },
  { name: 'Volcano Sundae Blast', combo: ['🌋', '🍨', '💥', '🍒'] },
  { name: 'Secret Garden Key', combo: ['🗝️', '🏰', '🍀', '🦋'] },
];
