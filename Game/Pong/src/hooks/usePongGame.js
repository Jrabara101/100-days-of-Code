import { useState, useEffect, useRef, useCallback } from 'react';
import { PongSimulationEngine } from '../engine/PongSimulationEngine';
import { BotAI } from '../engine/BotAI';
import { WebRTCManager } from '../network/WebRTCManager';
import { BinaryProtocol, MSG_TYPE } from '../network/BinaryProtocol';
import { soundFx } from '../audio/AudioEngine';
import { THEMES } from '../styles/themes';

export function usePongGame() {
  // Game Setup & Modes
  const [gameMode, setGameMode] = useState('VS_AI'); // 'VS_AI' | 'LOCAL_2P' | 'WEBRTC_P2P'
  const [role, setRole] = useState(null); // 'HOST' | 'CLIENT' | null
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [scoreLimit, setScoreLimit] = useState(11);
  const [theme, setTheme] = useState(THEMES.CYBERPUNK);
  const [isCRTEnabled, setIsCRTEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);

  // Live Match State
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [matchState, setMatchState] = useState('READY'); // 'READY' | 'PLAYING' | 'POINT_PAUSE' | 'GAME_OVER'
  const [winner, setWinner] = useState(null);
  const [rallyCount, setRallyCount] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(5.5);
  const [screenShake, setScreenShake] = useState(false);

  // Signaling & Tokens
  const [generatedToken, setGeneratedToken] = useState('');
  const [tokenType, setTokenType] = useState(''); // 'OFFER' | 'ANSWER' | ''
  const [debugLogs, setDebugLogs] = useState([]);
  const [telemetry, setTelemetry] = useState({
    rtt: 0,
    smoothedRtt: 0,
    jitter: 0,
    clockOffset: 0,
    packetRate: 0,
    packetsSent: 0,
    packetsReceived: 0,
    history: []
  });

  // Engine & System Refs
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const botAiRef = useRef(new BotAI('MEDIUM'));
  const rtcManagerRef = useRef(null);
  const keysPressed = useRef({ w: false, s: false, up: false, down: false });
  const clientInputVector = useRef(0);
  const inputSeq = useRef(0);

  const addLog = useCallback((msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev.slice(-40), `[${timestamp}] ${msg}`]);
  }, []);

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  // Event handler from authoritative physics engine
  const handleEngineEvent = useCallback((eventName, data) => {
    if (eventName === 'PADDLE_HIT') {
      soundFx.playPaddleHit(data.offset);
      if (data.speed >= 10.0) triggerScreenShake();
      // If Host, broadcast event packet
      if (rtcManagerRef.current && rtcManagerRef.current.role === 'HOST') {
        const eventBuf = BinaryProtocol.encodeEvent(1.0, data.player, data.offset);
        rtcManagerRef.current.sendRaw(eventBuf);
      }
    } else if (eventName === 'WALL_HIT') {
      soundFx.playWallHit();
      if (rtcManagerRef.current && rtcManagerRef.current.role === 'HOST') {
        const eventBuf = BinaryProtocol.encodeEvent(2.0, data.x, data.y);
        rtcManagerRef.current.sendRaw(eventBuf);
      }
    } else if (eventName === 'SCORE') {
      soundFx.playScore();
      triggerScreenShake();
      setScores({ p1: data.score1, p2: data.score2 });
      if (rtcManagerRef.current && rtcManagerRef.current.role === 'HOST') {
        const eventBuf = BinaryProtocol.encodeEvent(3.0, data.scoringPlayer, 0);
        rtcManagerRef.current.sendRaw(eventBuf);
      }
    } else if (eventName === 'GAME_OVER') {
      const isWinner = (rtcManagerRef.current?.role === 'CLIENT' && data.winner === 2) ||
                       (rtcManagerRef.current?.role !== 'CLIENT' && data.winner === 1);
      soundFx.playGameOver(isWinner);
      setWinner(data.winner);
      setMatchState('GAME_OVER');
      if (rtcManagerRef.current && rtcManagerRef.current.role === 'HOST') {
        const eventBuf = BinaryProtocol.encodeEvent(4.0, data.winner, 0);
        rtcManagerRef.current.sendRaw(eventBuf);
      }
    }
  }, [triggerScreenShake]);

  // Initialize Engine
  useEffect(() => {
    const engine = new PongSimulationEngine(800, 500, {
      scoreLimit,
      onEvent: handleEngineEvent
    });
    engineRef.current = engine;
    addLog('SYSTEM_BOOT: Headless Physics Simulation & CCD Engine initialized.');
  }, [handleEngineEvent, scoreLimit, addLog]);

  // Update Bot difficulty & Score limits
  useEffect(() => {
    if (botAiRef.current) {
      botAiRef.current.setDifficulty(aiDifficulty);
    }
  }, [aiDifficulty]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setScoreLimit(scoreLimit);
    }
  }, [scoreLimit]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'w' || e.key === 'W') keysPressed.current.w = true;
      if (e.key === 's' || e.key === 'S') keysPressed.current.s = true;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        keysPressed.current.up = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        keysPressed.current.down = true;
      }
      if (e.code === 'Space' && (matchState === 'READY' || matchState === 'GAME_OVER')) {
        engineRef.current?.resetGame();
        setMatchState('PLAYING');
        setWinner(null);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'w' || e.key === 'W') keysPressed.current.w = false;
      if (e.key === 's' || e.key === 'S') keysPressed.current.s = false;
      if (e.key === 'ArrowUp') keysPressed.current.up = false;
      if (e.key === 'ArrowDown') keysPressed.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [matchState]);

  // WebRTC Initializer & Message Router
  useEffect(() => {
    const rtc = new WebRTCManager({
      onStateChange: (state, r) => {
        setConnectionStatus(state);
        setRole(r);
        if (state === 'CONNECTED') {
          soundFx.playConnect();
          addLog(`WebRTC DataChannel connected as ${r}!`);
        }
      },
      onLog: (msg) => addLog(msg),
      onError: (err) => addLog(`ERROR: ${err}`),
      onMessage: (msg) => {
        const engine = engineRef.current;
        if (!engine) return;

        if (msg.type === 'INPUT' && rtc.role === 'HOST') {
          // Host integrates client input
          clientInputVector.current = msg.inputVector;
        } else if (msg.type === 'SNAPSHOT' && rtc.role === 'CLIENT') {
          // Client snaps / reconciles remote state
          engine.ballX = msg.ballX;
          engine.ballY = msg.ballY;
          engine.ballVx = msg.ballVx;
          engine.ballVy = msg.ballVy;
          engine.p1Y = msg.p1Y;
          // Remote P1 position updated, P2 updated via prediction
          engine.score1 = msg.score1;
          engine.score2 = msg.score2;
          engine.state = msg.state;
          engine.rallyCount = msg.rallyCount;

          setScores({ p1: msg.score1, p2: msg.score2 });
          setMatchState(msg.state);
          setRallyCount(msg.rallyCount);
          setCurrentSpeed(Math.hypot(msg.ballVx, msg.ballVy));
        } else if (msg.type === 'EVENT' && rtc.role === 'CLIENT') {
          if (msg.eventCode === 1.0) { // PADDLE_HIT
            soundFx.playPaddleHit(msg.param2);
          } else if (msg.eventCode === 2.0) { // WALL_HIT
            soundFx.playWallHit();
          } else if (msg.eventCode === 3.0) { // SCORE
            soundFx.playScore();
            triggerScreenShake();
          } else if (msg.eventCode === 4.0) { // GAME_OVER
            const isClientWinner = msg.param1 === 2.0;
            soundFx.playGameOver(isClientWinner);
            setWinner(msg.param1);
            setMatchState('GAME_OVER');
          }
        }
      }
    });

    rtcManagerRef.current = rtc;
    return () => {
      rtc.disconnect();
    };
  }, [addLog, triggerScreenShake]);

  // Telemetry Poller
  useEffect(() => {
    const interval = setInterval(() => {
      if (rtcManagerRef.current) {
        setTelemetry(rtcManagerRef.current.clockSync.getMetrics());
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Handshake Actions
  const handleHostMatch = async () => {
    setGameMode('WEBRTC_P2P');
    setRole('HOST');
    try {
      const offer = await rtcManagerRef.current.createHostOffer();
      setGeneratedToken(offer);
      setTokenType('OFFER');
      addLog('Host Offer SDP generated. Share with Player 2.');
    } catch (e) {
      addLog(`Failed to create Host offer: ${e.message}`);
    }
  };

  const handleJoinOffer = async (offerToken) => {
    setGameMode('WEBRTC_P2P');
    setRole('CLIENT');
    try {
      const answer = await rtcManagerRef.current.acceptOfferAndCreateAnswer(offerToken);
      setGeneratedToken(answer);
      setTokenType('ANSWER');
      addLog('Client Answer SDP generated. Return this to Host.');
    } catch (e) {
      addLog(`Failed to process Host offer: ${e.message}`);
    }
  };

  const handleAcceptAnswer = async (answerToken) => {
    try {
      await rtcManagerRef.current.acceptAnswer(answerToken);
      addLog('Client Answer accepted. Establishing P2P link...');
    } catch (e) {
      addLog(`Failed to apply Answer: ${e.message}`);
    }
  };

  const handleResetPeer = () => {
    rtcManagerRef.current?.disconnect();
    setRole(null);
    setConnectionStatus('DISCONNECTED');
    setGeneratedToken('');
    setTokenType('');
    addLog('WebRTC Peer Connection terminated.');
  };

  const handleRestartMatch = () => {
    engineRef.current?.resetGame();
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    setMatchState('PLAYING');
    addLog('Match restarted.');
  };

  // Main Canvas Render & Physics Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;

    const renderLoop = (time) => {
      const engine = engineRef.current;
      if (!engine) return;

      // 1. Gather Input
      let p1Input = 0;
      let p2Input = 0;

      if (gameMode === 'VS_AI') {
        // Human on W/S or Arrows, Bot on P2
        if (keysPressed.current.w || keysPressed.current.up) p1Input -= 1;
        if (keysPressed.current.s || keysPressed.current.down) p1Input += 1;
        p2Input = botAiRef.current.computeInput(engine, time);
      } else if (gameMode === 'LOCAL_2P') {
        // P1: W/S, P2: Up/Down
        if (keysPressed.current.w) p1Input -= 1;
        if (keysPressed.current.s) p1Input += 1;
        if (keysPressed.current.up) p2Input -= 1;
        if (keysPressed.current.down) p2Input += 1;
      } else if (gameMode === 'WEBRTC_P2P') {
        if (role === 'HOST') {
          if (keysPressed.current.w || keysPressed.current.up) p1Input -= 1;
          if (keysPressed.current.s || keysPressed.current.down) p1Input += 1;
          p2Input = clientInputVector.current;
        } else if (role === 'CLIENT') {
          // Client controls P2 with prediction
          let localVector = 0;
          if (keysPressed.current.w || keysPressed.current.up) localVector -= 1;
          if (keysPressed.current.s || keysPressed.current.down) localVector += 1;
          p2Input = localVector;

          // Stream input packet to host over WebRTC DataChannel (60 Hz)
          if (rtcManagerRef.current && rtcManagerRef.current.dataChannel?.readyState === 'open') {
            inputSeq.current++;
            const inputBuf = BinaryProtocol.encodeInput(localVector, inputSeq.current, time);
            rtcManagerRef.current.sendRaw(inputBuf);
          }
        }
      }

      // 2. Physics Step
      if (gameMode !== 'WEBRTC_P2P' || role === 'HOST') {
        engine.stepAuthoritative(p1Input, p2Input);

        setScores({ p1: engine.score1, p2: engine.score2 });
        setMatchState(engine.state);
        setRallyCount(engine.rallyCount);
        setCurrentSpeed(Math.hypot(engine.ballVx, engine.ballVy));

        // Host broadcasts state snapshot at 60 Hz
        if (gameMode === 'WEBRTC_P2P' && role === 'HOST' && rtcManagerRef.current?.dataChannel?.readyState === 'open') {
          const snapBuf = BinaryProtocol.encodeSnapshot(engine, time);
          rtcManagerRef.current.sendRaw(snapBuf);
        }
      } else if (gameMode === 'WEBRTC_P2P' && role === 'CLIENT') {
        // Client-side prediction for Player 2 paddle
        const halfH = engine.paddleHeight / 2;
        engine.p2Y = Math.max(halfH, Math.min(engine.height - halfH, engine.p2Y + p2Input * engine.paddleSpeed));
        engine.updateParticles();
        engine.updateTrail();
      }

      // 3. Clear Canvas Frame
      ctx.fillStyle = theme.boardBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center Divider Net
      ctx.strokeStyle = theme.netColor;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Score Overlays on Field
      ctx.font = 'bold 80px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.scoreP1Color;
      ctx.fillText(String(engine.score1).padStart(2, '0'), canvas.width / 4, 110);
      ctx.fillStyle = theme.scoreP2Color;
      ctx.fillText(String(engine.score2).padStart(2, '0'), (canvas.width * 3) / 4, 110);

      // Ball Motion Blur Trail
      for (let i = 0; i < engine.trail.length; i++) {
        const point = engine.trail[i];
        const alpha = (1 - i / engine.trail.length) * 0.35;
        const radius = engine.ballRadius * (1 - (i / engine.trail.length) * 0.4);
        ctx.fillStyle = theme.ballColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Paddle 1 (Left Player)
      const p1HalfW = engine.paddleWidth / 2;
      const halfH = engine.paddleHeight / 2;
      ctx.fillStyle = theme.p1Color;
      ctx.shadowColor = theme.p1Glow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(engine.paddle1X - p1HalfW, engine.p1Y - halfH, engine.paddleWidth, engine.paddleHeight, 4);
      ctx.fill();

      // Paddle 2 (Right Player)
      const p2HalfW = engine.paddleWidth / 2;
      ctx.fillStyle = theme.p2Color;
      ctx.shadowColor = theme.p2Glow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(engine.paddle2X - p2HalfW, engine.p2Y - halfH, engine.paddleWidth, engine.paddleHeight, 4);
      ctx.fill();

      // Ball (Glowing Disc)
      ctx.fillStyle = theme.ballColor;
      ctx.shadowColor = theme.ballGlow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(engine.ballX, engine.ballY, engine.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Particles / Sparks
      for (let i = 0; i < engine.particles.length; i++) {
        const p = engine.particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // Ready or Game Over Canvas Overlay Banner
      if (engine.state === 'READY') {
        ctx.fillStyle = 'rgba(5, 8, 17, 0.7)';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillStyle = theme.accent;
        ctx.textAlign = 'center';
        ctx.fillText('PRESS [SPACE] OR START MATCH TO SERVE', canvas.width / 2, canvas.height / 2 + 7);
      } else if (engine.state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(5, 8, 17, 0.85)';
        ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
        ctx.font = 'bold 28px "Sora", sans-serif';
        const isP1Winner = engine.winner === 1;
        ctx.fillStyle = isP1Winner ? theme.p1Color : theme.p2Color;
        ctx.textAlign = 'center';
        const winnerName = isP1Winner ? 'PLAYER 1 (NODE_A)' : 'PLAYER 2 (NODE_B)';
        ctx.fillText(`VICTORY: ${winnerName}`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('PRESS [SPACE] OR RESTART TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 25);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameMode, role, theme]);

  return {
    canvasRef,
    gameMode,
    setGameMode,
    role,
    connectionStatus,
    scores,
    matchState,
    winner,
    rallyCount,
    currentSpeed,
    aiDifficulty,
    setAiDifficulty,
    scoreLimit,
    setScoreLimit,
    theme,
    setTheme: (tKey) => setTheme(THEMES[tKey] || THEMES.CYBERPUNK),
    isCRTEnabled,
    setIsCRTEnabled,
    isMuted,
    toggleSound: () => {
      const muted = soundFx.toggleMute();
      setIsMuted(muted);
    },
    volume,
    setVolume: (v) => {
      soundFx.setVolume(v);
      setVolume(v);
    },
    screenShake,
    telemetry,
    debugLogs,
    generatedToken,
    tokenType,
    handleHostMatch,
    handleJoinOffer,
    handleAcceptAnswer,
    handleResetPeer,
    handleRestartMatch,
  };
}
