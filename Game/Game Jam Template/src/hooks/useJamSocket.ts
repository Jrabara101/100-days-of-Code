import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  JamState, 
  JamPhase, 
  AnnouncementItem, 
  JammerProfile, 
  SubmissionData 
} from '../types/jam';
import { soundFx } from '../lib/soundFx';

const DEFAULT_STATE: JamState = {
  jamId: 'CYBER-JAM-2026',
  jamName: 'NEO-SPARK GLOBAL GAME JAM 2026',
  currentPhase: 'COUNTDOWN_TO_REVEAL',
  targetEndTime: Date.now() + 1000 * 60 * 3, // 3 minutes
  themeRevealed: false,
  themeKeyword: 'ASYMMETRIC VELOCITY',
  themeTagline: 'Speed is your greatest weapon, but control is your only currency.',
  wildcardRules: [
    '⚡ Reverse Thrust: Movement controls invert every 10 seconds with a glitch warning.',
    '🎨 Monochromatic Pulse: High-contrast 2-bit palette with exactly ONE reactive neon accent.',
    '🔊 Kitchen Foley: All game SFX must be synthesized procedurally or made from household objects.',
    '🌀 Gravitational Pivot: Gravity rotates 90° clockwise whenever the player scores or takes damage.'
  ],
  announcements: [
    {
      id: 'ann-init-1',
      timestamp: new Date().toISOString(),
      priority: 'critical',
      title: '🚨 ZERO-HOUR PROTOCOL INITIATED',
      content: 'Global server synchronization is locked. The secret theme vault unmasks automatically at countdown zero.',
      actionUrl: '#theme-reveal'
    },
    {
      id: 'ann-init-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      priority: 'important',
      title: '🎙️ KEYNOTE STREAM: JUICE ARCHITECTURE',
      content: 'Lead technical artist Vera Drake is live breaking down 60FPS particle pipelines in Godot & Bevy.',
      actionUrl: 'https://twitch.tv'
    },
    {
      id: 'ann-init-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      priority: 'wildcard',
      title: '🎲 WILDCARDS ENCRYPTED',
      content: 'Four experimental gameplay mutators have been drafted. Will unlock simultaneously with the theme!',
      actionUrl: '#wildcards'
    }
  ],
  participantCount: 1482,
  serverTime: Date.now()
};

const DEFAULT_JAMMERS: JammerProfile[] = [
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

export function useJamSocket() {
  const [jamState, setJamState] = useState<JamState>(DEFAULT_STATE);
  const [jammers, setJammers] = useState<JammerProfile[]>(DEFAULT_JAMMERS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [criticalVignetteActive, setCriticalVignetteActive] = useState<boolean>(false);
  const [lastSubmissionReceipt, setLastSubmissionReceipt] = useState<SubmissionData | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const ntpPongCallbackRef = useRef<((t0: number, t1: number, t2: number) => void) | null>(null);

  // Trigger critical visual and audio alert
  const triggerCriticalAlert = useCallback(() => {
    setCriticalVignetteActive(true);
    soundFx.playCriticalAlertSiren();
    window.setTimeout(() => {
      setCriticalVignetteActive(false);
    }, 4500);
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimeout: number;

    const connect = () => {
      try {
        const wsUrl = `ws://${window.location.hostname}:3001`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'NTP_PONG' && ntpPongCallbackRef.current) {
              ntpPongCallbackRef.current(data.t0, data.t1, data.t2);
              return;
            }

            if (data.type === 'STATE_SNAPSHOT') {
              if (data.state) setJamState(data.state);
              if (data.jammers) setJammers(data.jammers);
            } else if (data.type === 'PHASE_CHANGED') {
              if (data.state) setJamState(data.state);
              soundFx.playUiClick(950);
            } else if (data.type === 'THEME_UNVEILED') {
              if (data.state) setJamState(data.state);
              soundFx.playThemeRevealFanfare();
            } else if (data.type === 'NEW_BROADCAST') {
              if (data.state) setJamState(data.state);
              if (data.isCritical) {
                triggerCriticalAlert();
              } else {
                soundFx.playUiClick(650);
              }
            } else if (data.type === 'WILDCARDS_UPDATED') {
              if (data.state) setJamState(data.state);
            } else if (data.type === 'JAMMER_BEACON_ADDED') {
              if (data.jammers) setJammers(data.jammers);
              soundFx.playRadarPing();
            } else if (data.type === 'AIRLOCK_SUCCESS') {
              if (data.submission) setLastSubmissionReceipt(data.submission);
              soundFx.playThemeRevealFanfare();
            } else if (data.type === 'HEARTBEAT_TIME_SYNC') {
              setJamState(prev => ({
                ...prev,
                serverTime: data.serverTime || prev.serverTime,
                participantCount: data.participantCount || prev.participantCount
              }));
            }
          } catch (e) {
            console.error('[WebSocket] Parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = window.setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };

      } catch {
        setIsConnected(false);
        reconnectTimeout = window.setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      window.clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [triggerCriticalAlert]);

  // Send NTP Ping
  const sendNtpPing = useCallback((t0: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'NTP_PING', t0 }));
    }
  }, []);

  const registerNtpHandler = useCallback((cb: (t0: number, t1: number, t2: number) => void) => {
    ntpPongCallbackRef.current = cb;
  }, []);

  // Dispatch Actions (with local fallback if disconnected)
  const setPhase = useCallback((phase: JamPhase, targetEndTime?: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ORGANIZER_SET_PHASE',
        phase,
        targetEndTime
      }));
    } else {
      // Local fallback simulation
      setJamState(prev => ({
        ...prev,
        currentPhase: phase,
        targetEndTime: targetEndTime || (Date.now() + 1000 * 60 * 60 * 24)
      }));
    }
  }, []);

  const revealTheme = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'ORGANIZER_REVEAL_THEME' }));
    } else {
      soundFx.playThemeRevealFanfare();
      setJamState(prev => ({
        ...prev,
        themeRevealed: true,
        currentPhase: 'JAM_ACTIVE',
        targetEndTime: Date.now() + 1000 * 60 * 60 * 48
      }));
    }
  }, []);

  const broadcastAnnouncement = useCallback((ann: Partial<AnnouncementItem>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ORGANIZER_BROADCAST',
        ...ann
      }));
    } else {
      const newAnn: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        timestamp: new Date().toISOString(),
        priority: ann.priority || 'important',
        title: ann.title || 'ORGANIZER ALERT',
        content: ann.content || '',
        actionUrl: ann.actionUrl
      };
      setJamState(prev => ({
        ...prev,
        announcements: [newAnn, ...prev.announcements]
      }));
      if (ann.priority === 'critical') {
        triggerCriticalAlert();
      }
    }
  }, [triggerCriticalAlert]);

  const addWildcard = useCallback((rule: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ORGANIZER_NEW_WILDCARD',
        rule
      }));
    } else {
      setJamState(prev => ({
        ...prev,
        wildcardRules: [...prev.wildcardRules, rule]
      }));
    }
  }, []);

  const createJammerBeacon = useCallback((beacon: Partial<JammerProfile>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'JAMMER_CREATE_BEACON',
        ...beacon
      }));
    } else {
      const newBeacon: JammerProfile = {
        id: `jam-${Date.now()}`,
        handle: beacon.handle || 'Anonymous_Jammer',
        avatarSeed: beacon.handle || 'user',
        roles: beacon.roles || ['Code'],
        engines: beacon.engines || ['Godot'],
        bio: beacon.bio || 'Ready to hack!',
        sampleSynthType: beacon.sampleSynthType,
        lookingForTeam: true,
        discord: beacon.discord || 'discord#0000',
        timezone: beacon.timezone || 'UTC'
      };
      setJammers(prev => [newBeacon, ...prev]);
      soundFx.playRadarPing();
    }
  }, []);

  const submitToAirlock = useCallback((submission: SubmissionData) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'AIRLOCK_SUBMIT',
        submission
      }));
    } else {
      const stamped: SubmissionData = {
        ...submission,
        submittedAt: Date.now(),
        submissionToken: `NEO-LOCK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      };
      setLastSubmissionReceipt(stamped);
      soundFx.playThemeRevealFanfare();
    }
  }, []);

  return {
    jamState,
    jammers,
    isConnected,
    criticalVignetteActive,
    lastSubmissionReceipt,
    setPhase,
    revealTheme,
    broadcastAnnouncement,
    addWildcard,
    createJammerBeacon,
    submitToAirlock,
    sendNtpPing,
    registerNtpHandler,
    triggerCriticalAlert
  };
}
