import { LeaderboardItem, MatchResult, SeasonInfo, Tier } from '../types/leaderboard';

const PREFIXES = [
  'Vortex', 'Apex', 'Zenith', 'Blaze', 'Cyber', 'Night', 'Ghost', 'Titan',
  'Frost', 'Hyper', 'Nova', 'Shadow', 'Quantum', 'Echo', 'Neon', 'Aero',
  'Pulse', 'Helix', 'Phantom', 'Zero', 'Omega', 'Viper', 'Storm', 'Solar',
  'Lunar', 'Iron', 'Crimson', 'Specter', 'Rogue', 'Raven', 'Strife', 'Valkyrie'
];

const SUFFIXES = [
  '99', 'FX', 'Queen', 'Hawk', 'Protocol', 'Bite', 'Ion', 'Strike',
  'Core', 'Drift', 'X', 'Soul', 'King', 'Prime', 'Blade', 'Master',
  'Pulse', 'Byte', 'Claw', 'Fang', 'Wolf', 'Sniper', 'God', 'Ace'
];

const COUNTRIES = [
  { name: 'United States', region: 'na' as const, flag: '🇺🇸', code: 'US' },
  { name: 'Canada', region: 'na' as const, flag: '🇨🇦', code: 'CA' },
  { name: 'Germany', region: 'eu' as const, flag: '🇩🇪', code: 'DE' },
  { name: 'United Kingdom', region: 'eu' as const, flag: '🇬🇧', code: 'UK' },
  { name: 'France', region: 'eu' as const, flag: '🇫🇷', code: 'FR' },
  { name: 'Sweden', region: 'eu' as const, flag: '🇸🇪', code: 'SE' },
  { name: 'South Korea', region: 'ap' as const, flag: '🇰🇷', code: 'KR' },
  { name: 'Japan', region: 'ap' as const, flag: '🇯🇵', code: 'JP' },
  { name: 'Australia', region: 'ap' as const, flag: '🇦🇺', code: 'AU' },
  { name: 'Brazil', region: 'sa' as const, flag: '🇧🇷', code: 'BR' },
  { name: 'Argentina', region: 'sa' as const, flag: '🇦🇷', code: 'AR' },
];

const AGENTS = ['Jett', 'Reyna', 'Omen', 'Sova', 'Chamber', 'Viper', 'Raze', 'Cypher', 'Killjoy', 'Fade'];
const MAPS = ['Ascent', 'Haven', 'Bind', 'Split', 'Sunset', 'Lotus', 'Breeze', 'Abyss'];
const BADGES_POOL = [
  'Season 3 MVP', 'Winning Streak (8)', 'Verified Pro', 'Headshot Master',
  'First Blood King', 'Clutch Specialist', 'Global Top 100', 'Flawless Victor'
];

// Seeded pseudo-random generator for fast deterministic generation
function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateMockLeaderboard(count = 10000): LeaderboardItem[] {
  const rand = createPRNG(42);
  const items: LeaderboardItem[] = [];

  // Dedicated top elite players from prototype for continuity
  const curatedTopPlayers = [
    { username: 'Vortex_99', tag: '#NA1', country: 'United States', region: 'na' as const, score: 4850, tier: 'master' as Tier, winRate: 78, matches: 342, kd: 1.48, hs: 34.2, agent: 'Jett' },
    { username: 'ApexShadow', tag: '#EUW', country: 'Germany', region: 'eu' as const, score: 4620, tier: 'master' as Tier, winRate: 74, matches: 410, kd: 1.39, hs: 31.8, agent: 'Reyna' },
    { username: 'Zenith', tag: '#KR1', country: 'South Korea', region: 'ap' as const, score: 4490, tier: 'master' as Tier, winRate: 71, matches: 290, kd: 1.35, hs: 29.5, agent: 'Omen' },
    { username: 'Blaze_FX', tag: '#BR1', country: 'Brazil', region: 'sa' as const, score: 4120, tier: 'diamond' as Tier, winRate: 68, matches: 512, kd: 1.28, hs: 27.2, agent: 'Raze' },
    { username: 'Nighthawk', tag: '#NA2', country: 'United States', region: 'na' as const, score: 3980, tier: 'diamond' as Tier, winRate: 67, matches: 380, kd: 1.25, hs: 26.8, agent: 'Sova' },
    { username: 'CyberQueen', tag: '#EUW', country: 'France', region: 'eu' as const, score: 3850, tier: 'diamond' as Tier, winRate: 66, matches: 275, kd: 1.22, hs: 25.4, agent: 'Viper' },
    { username: 'Ghost_Protocol', tag: '#AP1', country: 'Japan', region: 'ap' as const, score: 3720, tier: 'diamond' as Tier, winRate: 65, matches: 460, kd: 1.20, hs: 24.9, agent: 'Cypher' },
    { username: 'Titanium', tag: '#NA3', country: 'Canada', region: 'na' as const, score: 3500, tier: 'gold' as Tier, winRate: 62, matches: 310, kd: 1.15, hs: 23.5, agent: 'Chamber' },
    { username: 'RogueOne', tag: '#EUW', country: 'United Kingdom', region: 'eu' as const, score: 3410, tier: 'gold' as Tier, winRate: 60, matches: 295, kd: 1.12, hs: 22.8, agent: 'Fade' },
    { username: 'Starlight', tag: '#KR2', country: 'South Korea', region: 'ap' as const, score: 3300, tier: 'gold' as Tier, winRate: 59, matches: 420, kd: 1.10, hs: 21.9, agent: 'Killjoy' },
  ];

  for (let i = 0; i < count; i++) {
    const rank = i + 1;
    // Introduce random rank movements (-3 to +4)
    const delta = i < 3 ? (i === 0 ? 0 : (i === 1 ? 1 : -1)) : Math.floor(rand() * 9) - 4;
    const previousRank = Math.max(1, rank + delta);

    if (i < curatedTopPlayers.length) {
      const p = curatedTopPlayers[i];
      const recentMatches = generateRecentMatches(rand, p.agent);
      items.push({
        rank,
        previousRank,
        userId: `user-${i + 1}`,
        username: p.username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}&backgroundColor=0f172a,1e293b`,
        score: p.score,
        tier: p.tier,
        winRate: p.winRate,
        country: p.country,
        tag: p.tag,
        region: p.region,
        matches: p.matches,
        kdRatio: p.kd,
        headshotPct: p.hs,
        favoriteAgent: p.agent,
        streak: 3 + Math.floor(rand() * 6),
        recentMatches,
        badges: [BADGES_POOL[i % BADGES_POOL.length], BADGES_POOL[(i + 2) % BADGES_POOL.length]],
        isFriend: i === 1 || i === 4 || i === 8,
        isBookmarked: i === 0,
        timeframeScores: {
          daily: Math.round(p.score * 0.12),
          weekly: Math.round(p.score * 0.45),
          alltime: p.score,
        },
      });
      continue;
    }

    // Procedural players for bulk 10,000+
    const prefix = PREFIXES[Math.floor(rand() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(rand() * SUFFIXES.length)];
    const username = `${prefix}_${suffix}${i > 500 ? Math.floor(rand() * 999) : ''}`;
    const countryData = COUNTRIES[Math.floor(rand() * COUNTRIES.length)];
    const tagRegion = countryData.region === 'na' ? 'NA' : countryData.region === 'eu' ? 'EUW' : countryData.region === 'ap' ? 'KR' : 'BR';
    const tag = `#${tagRegion}${Math.floor(rand() * 9) + 1}`;

    // Calculate score based on descending curve from 3,250 down to 800
    const baseScore = Math.max(750, Math.round(3250 - (i / count) * 2400 + (rand() * 100 - 50)));
    const tier: Tier =
      baseScore >= 4200 ? 'master' :
      baseScore >= 3600 ? 'diamond' :
      baseScore >= 2800 ? 'gold' :
      baseScore >= 1800 ? 'silver' : 'bronze';

    const winRate = Math.min(85, Math.max(38, Math.round(70 - (i / count) * 28 + (rand() * 8 - 4))));
    const matches = 120 + Math.floor(rand() * 450);
    const agent = AGENTS[Math.floor(rand() * AGENTS.length)];
    const kdRatio = Number((0.85 + (winRate / 100) * 0.9 + (rand() * 0.2 - 0.1)).toFixed(2));
    const headshotPct = Number((16 + (rand() * 20)).toFixed(1));

    items.push({
      rank,
      previousRank,
      userId: `user-${i + 1}`,
      username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=0f172a,1e293b`,
      score: baseScore,
      tier,
      winRate,
      country: countryData.name,
      tag,
      region: countryData.region,
      matches,
      kdRatio,
      headshotPct,
      favoriteAgent: agent,
      streak: Math.floor(rand() * 8),
      recentMatches: generateRecentMatches(rand, agent),
      badges: [BADGES_POOL[Math.floor(rand() * BADGES_POOL.length)]],
      isFriend: i % 45 === 0,
      isBookmarked: false,
      timeframeScores: {
        daily: Math.round(baseScore * 0.1),
        weekly: Math.round(baseScore * 0.4),
        alltime: baseScore,
      },
    });
  }

  // Ensure strict rank order initially
  return items.sort((a, b) => b.score - a.score).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function generateRecentMatches(rand: () => number, defaultAgent: string): MatchResult[] {
  const matches: MatchResult[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const isVictory = rand() > 0.35;
    const myScore = 13;
    const opponentScore = isVictory ? Math.floor(rand() * 11) : 13;
    const scoreText = isVictory ? `13 - ${opponentScore}` : `${Math.floor(rand() * 11)} - 13`;
    const kills = 14 + Math.floor(rand() * 16);
    const deaths = 8 + Math.floor(rand() * 14);
    const assists = 3 + Math.floor(rand() * 9);

    matches.push({
      id: `match-${i}-${Math.random().toString(36).substring(7)}`,
      outcome: isVictory ? 'victory' : 'defeat',
      score: scoreText,
      map: MAPS[Math.floor(rand() * MAPS.length)],
      agent: defaultAgent,
      kda: `${kills}/${deaths}/${assists}`,
      date: i === 0 ? 'Today' : `${i}d ago`,
    });
  }
  return matches;
}

export const HALL_OF_FAME_SEASONS: SeasonInfo[] = [
  {
    id: 3,
    name: 'Season 3: Neon Surge',
    title: 'Pro World Circuit 2025',
    badge: '🏆 Global Champion',
    champion: {
      username: 'Vortex_99',
      tag: '#NA1',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vortex_99&backgroundColor=0f172a',
      country: 'United States',
      finalScore: 5420,
      winRate: 81.4,
      favoriteAgent: 'Jett',
    },
    runnerUp: {
      username: 'Zenith',
      tag: '#KR1',
      finalScore: 5180,
    },
    thirdPlace: {
      username: 'ApexShadow',
      tag: '#EUW',
      finalScore: 4990,
    },
    endDate: 'December 2025',
    totalParticipants: 148200,
  },
  {
    id: 2,
    name: 'Season 2: Apex Protocol',
    title: 'Championship Stage',
    badge: '🎖️ Apex Legend',
    champion: {
      username: 'Zenith',
      tag: '#KR1',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zenith&backgroundColor=0f172a',
      country: 'South Korea',
      finalScore: 5120,
      winRate: 79.2,
      favoriteAgent: 'Omen',
    },
    runnerUp: {
      username: 'CyberQueen',
      tag: '#EUW',
      finalScore: 4890,
    },
    thirdPlace: {
      username: 'Vortex_99',
      tag: '#NA1',
      finalScore: 4780,
    },
    endDate: 'August 2025',
    totalParticipants: 122400,
  },
  {
    id: 1,
    name: 'Season 1: Genesis Cup',
    title: 'Inaugural Masters',
    badge: '⭐ Genesis Champion',
    champion: {
      username: 'ApexShadow',
      tag: '#EUW',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexShadow&backgroundColor=0f172a',
      country: 'Germany',
      finalScore: 4950,
      winRate: 77.8,
      favoriteAgent: 'Reyna',
    },
    runnerUp: {
      username: 'Vortex_99',
      tag: '#NA1',
      finalScore: 4830,
    },
    thirdPlace: {
      username: 'Nighthawk',
      tag: '#NA2',
      finalScore: 4610,
    },
    endDate: 'April 2025',
    totalParticipants: 98500,
  },
];
