import React, { useState, useEffect, useRef } from 'react';
import { Beatmap, ScoreValidationResult } from './types/game';
import { DEFAULT_SONGS } from './data/defaultSongs';
import { SongSelectDashboard } from './components/dialogs/SongSelectDashboard';
import { RhythmGameController } from './components/game/RhythmGameController';
import { LatencyCalibrationModal } from './components/dialogs/LatencyCalibrationModal';
import { ResultShowcaseModal } from './components/dialogs/ResultShowcaseModal';
import { ChartCreatorModal } from './components/dialogs/ChartCreatorModal';
import { OnlineDuelModal } from './components/dialogs/OnlineDuelModal';

export const App: React.FC = () => {
  // Navigation & Game State
  const [screen, setScreen] = useState<'MENU' | 'PLAYING'>('MENU');
  const [songs, setSongs] = useState<Beatmap[]>(DEFAULT_SONGS);
  const [activeSong, setActiveSong] = useState<Beatmap>(DEFAULT_SONGS[0]);
  const [lastResult, setLastResult] = useState<ScoreValidationResult | null>(null);

  // User Settings with localStorage persistence
  const [audioOffsetMs, setAudioOffsetMs] = useState<number>(() => {
    const saved = localStorage.getItem('cyberbeat_audio_offset');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('cyberbeat_scroll_speed');
    return saved !== null ? parseFloat(saved) : 2.5;
  });

  const [zenMode, setZenMode] = useState<boolean>(false);
  const [ghostDuelEnabled, setGhostDuelEnabled] = useState<boolean>(true);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('cyberbeat_player_name') || 'CYBER_PILOT';
  });
  const [roomId, setRoomId] = useState<string>('ARENA_ALPHA');

  // Modals
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isResultOpen, setIsResultOpen] = useState<boolean>(false);
  const [isChartCreatorOpen, setIsChartCreatorOpen] = useState<boolean>(false);
  const [isOnlineDuelOpen, setIsOnlineDuelOpen] = useState<boolean>(false);

  // WebSocket for Real-time Duels
  const wsRef = useRef<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [opponentData, setOpponentData] = useState<any>(null);

  // Fetch updated songs list from Fastify backend if available
  useEffect(() => {
    fetch('/api/songs')
      .then(r => r.json())
      .then(async (catalog) => {
        if (Array.isArray(catalog) && catalog.length > 0) {
          // Load full chart details for each song
          const fullSongs = await Promise.all(
            catalog.map(async (c) => {
              try {
                const chartRes = await fetch(`/api/songs/${c.id}/chart`);
                if (chartRes.ok) return await chartRes.json();
              } catch (e) {}
              return null;
            })
          );
          const valid = fullSongs.filter(Boolean) as Beatmap[];
          if (valid.length > 0) setSongs(valid);
        }
      })
      .catch(() => {
        console.log('Operating in standalone offline mode with pre-baked high-octane tracks.');
      });
  }, []);

  // Initialize WebSocket connection for room duels
  useEffect(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsWsConnected(true);
        socket.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomId,
          playerName,
        }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ROOM_JOINED' || msg.type === 'OPPONENT_JOINED' || msg.type === 'OPPONENT_LEFT') {
            setPlayerCount(msg.playerCount || 1);
          } else if (msg.type === 'OPPONENT_TELEMETRY') {
            setOpponentData(msg);
          }
        } catch (e) {}
      };

      socket.onclose = () => {
        setIsWsConnected(false);
      };

      wsRef.current = socket;

      return () => {
        socket.close();
      };
    } catch (err) {
      setIsWsConnected(false);
    }
  }, [roomId, playerName]);

  // Persist settings
  const handleSaveOffset = (offset: number) => {
    setAudioOffsetMs(offset);
    localStorage.setItem('cyberbeat_audio_offset', offset.toString());
  };

  const handleSetScrollSpeed = (spd: number) => {
    setScrollSpeed(spd);
    localStorage.setItem('cyberbeat_scroll_speed', spd.toString());
  };

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('cyberbeat_player_name', name);
  };

  // Launch track
  const handleLaunchTrack = (song: Beatmap, options: { ghostEnabled: boolean }) => {
    setActiveSong(song);
    setGhostDuelEnabled(options.ghostEnabled);
    setScreen('PLAYING');
  };

  // Run completed -> open result showcase
  const handleFinishRun = (result: ScoreValidationResult) => {
    setLastResult(result);
    setIsResultOpen(true);
  };

  return (
    <div className="w-full h-screen bg-background text-white select-none overflow-hidden relative">
      {screen === 'MENU' ? (
        <SongSelectDashboard
          songs={songs}
          onSelectSong={handleLaunchTrack}
          scrollSpeed={scrollSpeed}
          onSetScrollSpeed={handleSetScrollSpeed}
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode(!zenMode)}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
          onOpenChartCreator={() => setIsChartCreatorOpen(true)}
          onOpenOnlineDuel={() => setIsOnlineDuelOpen(true)}
        />
      ) : (
        <RhythmGameController
          beatmap={activeSong}
          scrollSpeed={scrollSpeed}
          zenMode={zenMode}
          audioOffsetMs={audioOffsetMs}
          ghostEnabled={ghostDuelEnabled}
          playerName={playerName}
          onFinishRun={handleFinishRun}
          onExitToMenu={() => setScreen('MENU')}
          wsSocket={wsRef.current}
          opponentData={opponentData}
        />
      )}

      {/* Latency Calibration Dialog */}
      <LatencyCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        currentOffsetMs={audioOffsetMs}
        onSaveOffset={handleSaveOffset}
      />

      {/* Result Showcase Dialog */}
      <ResultShowcaseModal
        isOpen={isResultOpen}
        onClose={() => {
          setIsResultOpen(false);
          setScreen('MENU');
        }}
        result={lastResult}
        songTitle={activeSong.title}
        onReplay={() => {
          setIsResultOpen(false);
          setScreen('PLAYING');
        }}
        onSelectTrack={() => {
          setIsResultOpen(false);
          setScreen('MENU');
        }}
      />

      {/* Beatmap Studio & Chart Creator Dialog */}
      <ChartCreatorModal
        isOpen={isChartCreatorOpen}
        onClose={() => setIsChartCreatorOpen(false)}
        onPlayCustomChart={(chart) => {
          setSongs(prev => [chart, ...prev]);
          setActiveSong(chart);
          setScreen('PLAYING');
        }}
      />

      {/* Online Room Duels Dialog */}
      <OnlineDuelModal
        isOpen={isOnlineDuelOpen}
        onClose={() => setIsOnlineDuelOpen(false)}
        playerName={playerName}
        onSetPlayerName={handleSetPlayerName}
        currentRoomId={roomId}
        onSetRoomId={setRoomId}
        isConnected={isWsConnected}
        playerCount={playerCount}
      />
    </div>
  );
};

export default App;
