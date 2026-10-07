import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { 
  JamState, 
  JamPhase, 
  AnnouncementItem, 
  JammerProfile, 
  SubmissionData 
} from '../src/types/jam';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Initial state
const now = Date.now();
// Default to 120 seconds for demo reveal, or 48 hours for active
let currentPhase: JamPhase = 'COUNTDOWN_TO_REVEAL';
let targetEndTime: number = now + 1000 * 60 * 3; // 3 minutes until reveal

let themeRevealed = false;
const themeKeyword = 'ASYMMETRIC VELOCITY';
const themeTagline = 'Speed is your greatest weapon, but control is your only currency.';

const defaultWildcards: string[] = [
  '⚡ Reverse Thrust: Movement controls invert every 10 seconds with a glitch warning.',
  '🎨 Monochromatic Pulse: High-contrast 2-bit palette with exactly ONE reactive neon accent.',
  '🔊 Kitchen Foley: All game SFX must be synthesized procedurally or made from household objects.',
  '🌀 Gravitational Pivot: Gravity rotates 90° clockwise whenever the player scores or takes damage.'
];

let wildcardRules = [...defaultWildcards];

let announcements: AnnouncementItem[] = [
  {
    id: 'ann-1',
    timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
    priority: 'critical',
    title: '🚨 ZERO-HOUR PROTOCOL INITIATED',
    content: 'Global server synchronization is locked. The secret theme vault unmasks automatically at countdown zero. Stand by audio monitors!',
    actionUrl: '#theme-reveal'
  },
  {
    id: 'ann-2',
    timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
    priority: 'important',
    title: '🎙️ KEYNOTE STREAM: ARCHITECTURE OF JUICE',
    content: 'Lead technical artist Vera Drake is live on Twitch breaking down 60FPS particle pipelines in Godot 4.3 & Bevy 0.14.',
    actionUrl: 'https://twitch.tv'
  },
  {
    id: 'ann-3',
    timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
    priority: 'wildcard',
    title: '🎲 WILDCARD PACK A LOCKED IN',
    content: 'Four experimental gameplay mutators have been encrypted into the submission air-lock. Unlocked upon theme release.',
    actionUrl: '#wildcards'
  },
  {
    id: 'ann-4',
    timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
    priority: 'info',
    title: '🛠️ ASSET FORGE V2.4 DEPLOYED',
    content: 'In-browser poster & banner studio upgraded with A3 print layout templates and vector SVG export pipelines.',
    actionUrl: '#poster-forge'
  }
];

let participantCount = 1482;

const jammerBeacons: JammerProfile[] = [
  {
    id: 'jam-1',
    handle: 'Kaelen_0x',
    avatarSeed: 'kael',
    roles: ['Code', 'Game Design'],
    engines: ['Godot', 'Bevy'],
    bio: 'Rust & GDScript addict. 7 jam veteran. Seeking a 2D animator & synth composer for high-speed arcade action.',
    lookingForTeam: true,
    discord: 'kaelen#9041',
    timezone: 'UTC-5 (EST)'
  },
  {
    id: 'jam-2',
    handle: 'NeonValkyrie',
    avatarSeed: 'valk',
    roles: ['Audio/OST'],
    engines: ['Godot', 'Unity', 'WebGL'],
    bio: 'Chiptune, darksynth & dynamic interactive stem systems. Wrote OSTs for 4 featured itch.io jam winners.',
    sampleSynthType: 'synthwave',
    lookingForTeam: true,
    discord: 'valk_audio#4412',
    timezone: 'UTC+1 (CET)'
  },
  {
    id: 'jam-3',
    handle: 'VectorGhost',
    avatarSeed: 'ghost',
    roles: ['2D Art', '3D Art'],
    engines: ['Unity', 'WebGL'],
    bio: 'Low-poly PSX aesthetics & cyberpunk pixel sprites. Fast turnaround on character sheets & UI mockups.',
    lookingForTeam: false,
    teamName: 'Team Void-Riders',
    discord: 'ghost_draws#1190',
    timezone: 'UTC-8 (PST)'
  },
  {
    id: 'jam-4',
    handle: 'PixelBard',
    avatarSeed: 'bard',
    roles: ['Audio/OST', 'Narrative'],
    engines: ['Godot', 'PICO-8'],
    bio: 'FM-synthesis wizard & worldbuilder. Can deliver atmospheric loops and punchy sound design in under 6 hours.',
    sampleSynthType: 'chiptune',
    lookingForTeam: true,
    discord: 'pixelbard#3382',
    timezone: 'UTC+0 (GMT)'
  },
  {
    id: 'jam-5',
    handle: 'CortexRider',
    avatarSeed: 'cortex',
    roles: ['Code', '3D Art'],
    engines: ['Unreal', 'WebGL'],
    bio: 'Shader programming & juice-heavy physics controllers. Looking for level designer and audio producer.',
    lookingForTeam: true,
    discord: 'cortex_r#7781',
    timezone: 'UTC+9 (JST)'
  }
];

const submissions: SubmissionData[] = [];

// Helper to get state
function getJamState(): JamState {
  return {
    jamId: 'CYBER-JAM-2026',
    jamName: 'NEO-SPARK GLOBAL GAME JAM 2026',
    currentPhase,
    targetEndTime,
    themeRevealed,
    themeKeyword: themeRevealed ? themeKeyword : 'ENCRYPTED // STAND BY',
    themeTagline: themeRevealed ? themeTagline : 'Theme classified until Zero-Hour Bell unmasking.',
    wildcardRules: themeRevealed ? wildcardRules : ['[ENCRYPTED MODIFIER #1]', '[ENCRYPTED MODIFIER #2]', '[ENCRYPTED MODIFIER #3]', '[ENCRYPTED MODIFIER #4]'],
    announcements,
    participantCount,
    serverTime: Date.now()
  };
}

// HTTP Server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getJamState()));
    return;
  }

  if (req.url === '/api/jammers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(jammerBeacons));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcast(data: object) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  // Send initial full snapshot
  ws.send(JSON.stringify({
    type: 'STATE_SNAPSHOT',
    state: getJamState(),
    jammers: jammerBeacons,
    submissionsCount: submissions.length
  }));

  ws.on('message', (messageBuffer) => {
    try {
      const msg = JSON.parse(messageBuffer.toString());

      // 1. NTP Ping-Pong Time Synchronization
      if (msg.type === 'NTP_PING') {
        const serverNow = Date.now();
        ws.send(JSON.stringify({
          type: 'NTP_PONG',
          t0: msg.t0, // Client sent time
          t1: serverNow, // Server received time
          t2: serverNow  // Server sent time
        }));
        return;
      }

      // 2. Organizer: Change Jam Phase
      if (msg.type === 'ORGANIZER_SET_PHASE') {
        currentPhase = msg.phase as JamPhase;
        if (msg.targetEndTime) {
          targetEndTime = msg.targetEndTime;
        } else {
          // Set sensible defaults based on phase
          if (currentPhase === 'COUNTDOWN_TO_REVEAL') {
            targetEndTime = Date.now() + 1000 * 60 * 2; // 2 minutes
            themeRevealed = false;
          } else if (currentPhase === 'THEME_REVEAL') {
            targetEndTime = Date.now() + 1000 * 60 * 15; // 15 mins
            themeRevealed = true;
          } else if (currentPhase === 'JAM_ACTIVE') {
            targetEndTime = Date.now() + 1000 * 60 * 60 * 48; // 48 hours
            themeRevealed = true;
          } else if (currentPhase === 'SUBMISSION_BUFFER') {
            targetEndTime = Date.now() + 1000 * 60 * 30; // 30 mins grace
            themeRevealed = true;
          } else {
            targetEndTime = Date.now() + 1000 * 60 * 60 * 24;
          }
        }

        broadcast({
          type: 'PHASE_CHANGED',
          state: getJamState()
        });
      }

      // 3. Organizer: Reveal Theme Trigger
      if (msg.type === 'ORGANIZER_REVEAL_THEME') {
        themeRevealed = true;
        currentPhase = 'JAM_ACTIVE';
        targetEndTime = Date.now() + 1000 * 60 * 60 * 48; // 48h hacking

        // Auto-push reveal announcement
        announcements.unshift({
          id: `ann-${Date.now()}`,
          timestamp: new Date().toISOString(),
          priority: 'critical',
          title: '⚡ SECRET THEME UNMASKED: ASYMMETRIC VELOCITY',
          content: 'The Bell has rung! Speed is your greatest weapon, but control is your only currency. 48 hours on the clock. Godspeed, jammers!',
          actionUrl: '#theme-reveal'
        });

        broadcast({
          type: 'THEME_UNVEILED',
          state: getJamState(),
          fanfareTrigger: true
        });
      }

      // 4. Organizer: Push Emergency Broadcast
      if (msg.type === 'ORGANIZER_BROADCAST') {
        const newAnn: AnnouncementItem = {
          id: `ann-${Date.now()}`,
          timestamp: new Date().toISOString(),
          priority: msg.priority || 'important',
          title: msg.title || 'ORGANIZER BULLETIN',
          content: msg.content || '',
          actionUrl: msg.actionUrl
        };
        announcements.unshift(newAnn);

        broadcast({
          type: 'NEW_BROADCAST',
          announcement: newAnn,
          state: getJamState(),
          isCritical: msg.priority === 'critical'
        });
      }

      // 5. Organizer: Add / Randomize Wildcard
      if (msg.type === 'ORGANIZER_NEW_WILDCARD') {
        if (msg.rule) {
          wildcardRules.push(msg.rule);
        }
        broadcast({
          type: 'WILDCARDS_UPDATED',
          state: getJamState()
        });
      }

      // 6. Jammer Radar: Create Beacon
      if (msg.type === 'JAMMER_CREATE_BEACON') {
        const beacon: JammerProfile = {
          id: `jam-${Date.now()}`,
          handle: msg.handle || 'Anonymous_Jammer',
          avatarSeed: msg.handle?.slice(0, 4) || 'user',
          roles: msg.roles || ['Code'],
          engines: msg.engines || ['Godot'],
          bio: msg.bio || 'Ready to hack!',
          sampleSynthType: msg.sampleSynthType,
          lookingForTeam: true,
          discord: msg.discord || 'discord#0000',
          timezone: msg.timezone || 'UTC'
        };
        jammerBeacons.unshift(beacon);
        participantCount++;

        broadcast({
          type: 'JAMMER_BEACON_ADDED',
          beacon,
          jammers: jammerBeacons,
          participantCount
        });
      }

      // 7. Submission Air-Lock: Submit Entry
      if (msg.type === 'AIRLOCK_SUBMIT') {
        const subData: SubmissionData = {
          ...msg.submission,
          submittedAt: Date.now(),
          submissionToken: `NEO-LOCK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        };
        submissions.push(subData);

        ws.send(JSON.stringify({
          type: 'AIRLOCK_SUCCESS',
          submission: subData
        }));

        // Push submission siren bulletin
        announcements.unshift({
          id: `ann-sub-${Date.now()}`,
          timestamp: new Date().toISOString(),
          priority: 'info',
          title: `🚀 SUBMISSION VERIFIED: "${subData.gameTitle}"`,
          content: `Team ${subData.teamName} locked in with SHA256 [${subData.sha256Checksum.slice(0, 10)}...]. Total entries: ${submissions.length}.`
        });

        broadcast({
          type: 'NEW_BROADCAST',
          state: getJamState(),
          submissionsCount: submissions.length
        });
      }

    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });
});

// Periodic heartbeat & monotonic drift sync pulse
setInterval(() => {
  broadcast({
    type: 'HEARTBEAT_TIME_SYNC',
    serverTime: Date.now(),
    participantCount
  });
}, 5000);

server.listen(PORT, () => {
  console.log(`[JamServer] Monotonic Fast Event Server listening on http://localhost:${PORT}`);
  console.log(`[JamServer] WebSocket real-time pipeline established on ws://localhost:${PORT}`);
});
