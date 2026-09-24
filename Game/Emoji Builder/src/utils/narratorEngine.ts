import { SceneMood } from '../types';

export type ProseTone = 'comedic' | 'dramatic' | 'noir' | 'kawaii' | 'cyberpunk';

const EMOJI_SEMANTICS: Record<string, { role: string; verb: string; object: string; adjective: string }> = {
  '🤠': { role: 'a solitary star cowboy', verb: 'draws their laser blaster', object: 'the dusty frontier', adjective: 'weathered' },
  '🚀': { role: 'a high-velocity starship', verb: 'launches into hyperspace', object: 'the celestial void', adjective: 'interstellar' },
  '👾': { role: 'an extraterrestrial swarm', verb: 'infiltrates the perimeter', object: 'the planetary shields', adjective: 'alien' },
  '💥': { role: 'a catastrophic shockwave', verb: 'obliterates the horizon', object: 'all silence', adjective: 'deafening' },
  '🐻': { role: 'Chef Teddy Bear', verb: 'whippersnaps a secret recipe', object: 'the bakery kitchen', adjective: 'plush and determined' },
  '🍓': { role: 'a glistening royal strawberry', verb: 'infuses sweet nectar', object: 'the frosted tower', adjective: 'sun-ripened' },
  '🎂': { role: 'a towering three-tier cake', verb: 'steals the entire spotlight', object: 'the grand festival', adjective: 'spectacular' },
  '🧁': { role: 'a fluffy cloud cupcake', verb: 'sparkles with sugar crystals', object: 'the dessert tray', adjective: 'marshmallow-soft' },
  '🍯': { role: 'a jar of golden honey', verb: 'drizzles amber liquid sunshine', object: 'the breakfast banquet', adjective: 'dripping' },
  '🪄': { role: 'an enchanted chef whisk', verb: 'casts pastry enchantments', object: 'the rising batter', adjective: 'sparkling' },
  '🍒': { role: 'the golden cherry topper', verb: 'crowns the ultimate masterpiece', object: 'the pastry summit', adjective: 'gilded' },
  '✨': { role: 'a cascade of glitter dust', verb: 'illuminates the entire room', object: 'every heart in attendance', adjective: 'shimmering' },
  '⭐': { role: 'a fallen celestial star', verb: 'bestows cosmic favor', object: 'the quiet valley', adjective: 'luminous' },
  '🤖': { role: 'a sentient synth unit', verb: 'executes protocol zero', object: 'the neon database', adjective: 'overclocked' },
  '👻': { role: 'a mischievous phantom', verb: 'whispers from the shadows', object: 'the haunted manor', adjective: 'spectral' },
  '🍕': { role: 'the sacred cheese pizza', verb: 'unites conflicting empires', object: 'the feast table', adjective: 'bubbling' },
  '👑': { role: 'the ancestral crown', verb: 'claims rightful heritage', object: 'the empty throne', adjective: 'gilded and perilous' },
  '🗝️': { role: 'the skeleton key', verb: 'unlocks forbidden chambers', object: 'the iron gate', adjective: 'ancient' },
  '🌊': { role: 'the tidal ocean surge', verb: 'sweeps across the coral reef', object: 'the sleeping beach', adjective: 'unstoppable' },
  '🐝': { role: 'the buzzing queen scout', verb: 'delivers nectar coordinates', object: 'the honeycomb hive', adjective: 'industrious' },
};

export function generateProseFromEmojis(
  emojis: string[],
  tone: ProseTone = 'kawaii',
  mood?: SceneMood
): string {
  if (!emojis.length) {
    return 'An empty canvas waits for your imagination to strike...';
  }

  const semantics = emojis.map((e) => EMOJI_SEMANTICS[e] || {
    role: `the curious mystery of ${e}`,
    verb: 'interacts with fate',
    object: 'the unfolding scene',
    adjective: 'unforeseen'
  });

  const lead = semantics[0];
  const secondary = semantics[1] || lead;
  const climax = semantics[semantics.length - 1];

  switch (tone) {
    case 'comedic': {
      if (emojis.includes('🤠') && emojis.includes('🚀') && emojis.includes('👾')) {
        return `A lonely space cowboy discovers an extraterrestrial threat at the edge of the galaxy, only to realize he forgot his lucky hat.`;
      }
      if (emojis.includes('🐻') && emojis.includes('🎂')) {
        return `Chef Teddy spent four hours perfecting a 3-tier masterpiece, yet somehow half the frosting mysteriously vanished into his own belly! 🍓`;
      }
      return `Nobody planned for ${lead.role} to suddenly encounter ${secondary.role}, but here we are—and now ${climax.object} is in complete disarray!`;
    }

    case 'dramatic': {
      if (emojis.includes('🤠') && emojis.includes('🚀') && emojis.includes('💥')) {
        return `A lonely space cowboy discovers an extraterrestrial threat at the edge of the galaxy. When the blast erupts, the void echoes with vengeance.`;
      }
      return `Beneath a tense, stormy sky, ${lead.role} stood firm. As ${secondary.verb}, ${climax.role} ignited a clash that would alter the realm forever.`;
    }

    case 'noir': {
      return `The rain hammered the pavement like cold bullets. ${lead.role} pulled their collar up against the chill, watching ${secondary.role} disappear into the mist. Some secrets were never meant to be unlocked.`;
    }

    case 'cyberpunk': {
      return `Neon rain drenched Sector 9. Data packets flickered as ${lead.role} hard-jacked into ${secondary.object}. Alert klaxons flared: ${climax.role} just breached the firewall.`;
    }

    case 'kawaii':
    default: {
      if (emojis.includes('🐻') && emojis.includes('🍓')) {
        return `"More whip cream on the berry tower before the party begins! 🍓🍰" Chef Teddy adds the golden cherry topper with a cheerful wiggle!`;
      }
      return `With a flutter of sprinkles and warmth, ${lead.role} teamed up with ${secondary.role} to make the sweetest adventure anyone had ever seen! ✨💖`;
    }
  }
}
