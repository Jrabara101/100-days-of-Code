/**
 * Grandmaster 3D - Interactive 3D Chess Game
 * Features: Three.js PBR rendering, Real-time Multiplayer, WebRTC Voice Chat, Customizable Skins, AI Engine.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager, CameraPreset } from './chess3d/SceneManager';
import { BoardSkin, getSkinById, getAvailableSkins } from './chess3d/Skins';
import { ChessGame, CapturedPieces, TacticalAnalysis } from './chess/ChessEngine';
import { MultiplayerClient, ChatMessage, ReactionItem, RoomData } from './multiplayer/MultiplayerClient';
import { VoiceChatManager, VoiceStatus } from './multiplayer/VoiceChat';
import { sounds } from './audio/SoundEffects';
import { TitleScreen, GameMode } from './components/TitleScreen';
import { BottomControlDock } from './components/BottomControlDock';
import { PerimeterHUD } from './components/PerimeterHUD';
import { ChatAndReactions } from './components/ChatAndReactions';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { RulesAndPieceGuideModal } from './components/RulesAndPieceGuideModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const gameRef = useRef<ChessGame>(new ChessGame());
  const multiplayerRef = useRef<MultiplayerClient | null>(null);
  const voiceChatRef = useRef<VoiceChatManager | null>(null);

  const handleSquareInteractionRef = useRef<((sq: string) => void) | null>(null);
  const handlePieceDropRef = useRef<((from: string, to: string) => void) | null>(null);
  const canDragPieceRef = useRef<((sq: string) => boolean) | null>(null);
  const getLegalMovesRef = useRef<((sq: string) => string[]) | null>(null);

  // Game Lifecycle State
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'novice' | 'apprentice' | 'master'>('apprentice');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Player & Room State
  const [myPlayerName, setMyPlayerName] = useState('Grandmaster');
  const [whitePlayerName, setWhitePlayerName] = useState('White');
  const [blackPlayerName, setBlackPlayerName] = useState('Black');
  const [myRole, setMyRole] = useState<'white' | 'black' | 'spectator'>('white');
  const [roomId, setRoomId] = useState('');
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);

  // Board & Skin State
  const [activeSkin, setActiveSkin] = useState<BoardSkin>(() => getSkinById('heritage'));
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('white');

  // Chess Game State
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [winner, setWinner] = useState<'w' | 'b' | 'draw' | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ w: [], b: [], scoreDiff: 0 });
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  // Pawn Promotion State
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);

  // Audio & Voice State
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [whiteIsSpeaking, setWhiteIsSpeaking] = useState(false);
  const [blackIsSpeaking, setBlackIsSpeaking] = useState(false);

  // Chat & Reactions & UI Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeReactions, setActiveReactions] = useState<ReactionItem[]>([]);

  // Best Move Tactical Analysis & Piece Rules Guide
  const [analysis, setAnalysis] = useState<TacticalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // 1. Initialize Multiplayer and Voice Manager once
  useEffect(() => {
    const mp = new MultiplayerClient();
    multiplayerRef.current = mp;

    const vc = new VoiceChatManager(mp);
    voiceChatRef.current = vc;

    mp.onConnectionChange = (connected) => {
      setIsOnlineConnected(connected);
    };

    vc.onStatusChange = (status) => {
      setVoiceStatus(status);
    };

    vc.onVolumeMeter = (level, isSpeaking) => {
      setAudioLevel(level);
      if (myRole === 'white') {
        setWhiteIsSpeaking(isSpeaking);
      } else if (myRole === 'black') {
        setBlackIsSpeaking(isSpeaking);
      }
    };

    vc.onPeerSpeaking = (_peerId, isSpeaking) => {
      if (myRole === 'white') {
        setBlackIsSpeaking(isSpeaking);
      } else {
        setWhiteIsSpeaking(isSpeaking);
      }
    };

    return () => {
      vc.leaveVoice();
    };
  }, [myRole]);

  // 2. Initialize Three.js SceneManager once
  useEffect(() => {
    if (!mountRef.current) return;

    const sm = new SceneManager({
      container: mountRef.current,
      initialSkinId: activeSkin.id,
      onSquareClick: (sq) => {
        handleSquareInteractionRef.current?.(sq);
      },
      onPieceDrop: (from, to) => {
        handlePieceDropRef.current?.(from, to);
      },
      canDragPiece: (sq) => {
        return canDragPieceRef.current?.(sq) ?? false;
      },
      getLegalMoves: (sq) => {
        return getLegalMovesRef.current?.(sq) ?? [];
      },
    });
    sceneManagerRef.current = sm;

    // Load initial board pieces
    sm.syncFromFen(gameRef.current.getFen());
    sm.setCameraPreset('cinematic'); // Cinematic orbit on title screen

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // 3. Setup Multiplayer Callbacks
  useEffect(() => {
    const mp = multiplayerRef.current;
    if (!mp) return;

    mp.onRoomJoined = (room, yourRole, yourId) => {
      setMyRole(yourRole);
      setWhitePlayerName(
        room.players.find((p) => p.role === 'white')?.name || 'White'
      );
      setBlackPlayerName(
        room.players.find((p) => p.role === 'black')?.name || 'Black'
      );
      setWhiteTime(room.timeWhite);
      setBlackTime(room.timeBlack);
      setTurn(room.turn);
      setMoveHistory(room.history);

      gameRef.current.loadFen(room.fen);
      sceneManagerRef.current?.syncFromFen(room.fen);

      // Set camera to player's color
      if (yourRole === 'black') {
        sceneManagerRef.current?.setCameraPreset('black');
        setCameraPreset('black');
      } else {
        sceneManagerRef.current?.setCameraPreset('white');
        setCameraPreset('white');
      }

      // Automatically join voice room if other peers are present
      const peerIds = room.players.filter((p) => p.id !== yourId).map((p) => p.id);
      voiceChatRef.current?.joinVoice(peerIds);
    };

    mp.onPeerJoined = (peer, room) => {
      if (peer.role === 'white') setWhitePlayerName(peer.name);
      if (peer.role === 'black') setBlackPlayerName(peer.name);

      // Connect WebRTC voice
      voiceChatRef.current?.initiateCall(peer.id);
    };

    mp.onPeerLeft = (peerId, _role, room) => {
      voiceChatRef.current?.removePeer(peerId);
      setWhitePlayerName(
        room.players.find((p) => p.role === 'white')?.name || 'Waiting...'
      );
      setBlackPlayerName(
        room.players.find((p) => p.role === 'black')?.name || 'Waiting...'
      );
    };

    mp.onMoveMade = (data) => {
      const from = data.move.from;
      const to = data.move.to;

      // Make move on internal chess instance
      gameRef.current.makeMove(from, to, data.move.promotion);
      sceneManagerRef.current?.animateMove(from, to, () => {
        sounds.playMove();
        sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
      });

      sceneManagerRef.current?.setLastMove(from, to);
      sceneManagerRef.current?.setSelection(null, []);
      setSelectedSquare(null);

      setTurn(data.turn);
      setWhiteTime(data.timeWhite);
      setBlackTime(data.timeBlack);
      setMoveHistory(data.history);

      const check = gameRef.current.isCheck();
      setIsCheck(check);
      const kingSq = gameRef.current.getKingSquare(data.turn);
      sceneManagerRef.current?.setCheckSquare(check ? kingSq : null);

      if (data.status === 'checkmate') {
        setIsCheckmate(true);
        setIsGameOver(true);
        setWinner(data.winner as any);
        setGameOverReason('Checkmate');
        sounds.playVictory();
      } else if (data.status === 'draw') {
        setIsGameOver(true);
        setWinner('draw');
        setGameOverReason('Draw Agreement');
      }

      setCapturedPieces(gameRef.current.getCapturedPieces());
    };

    mp.onGameRestarted = (room) => {
      gameRef.current.reset();
      sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
      sceneManagerRef.current?.setSelection(null, []);
      sceneManagerRef.current?.setLastMove(null, null);
      sceneManagerRef.current?.setCheckSquare(null);

      setTurn('w');
      setWhiteTime(room.timeWhite);
      setBlackTime(room.timeBlack);
      setMoveHistory([]);
      setIsCheck(false);
      setIsCheckmate(false);
      setIsGameOver(false);
      setWinner(null);
      setCapturedPieces(gameRef.current.getCapturedPieces());
    };

    mp.onPlayerResigned = (data) => {
      setIsGameOver(true);
      setWinner(data.winner as any);
      setGameOverReason(`Resignation by ${data.resignedRole === 'white' ? 'White' : 'Black'}`);
      sounds.playVictory();
    };

    mp.onChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    mp.onReaction = (reaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    };
  }, []);

  // 4. Timer loop for active game
  useEffect(() => {
    if (!inGame || isGameOver) return;

    const timer = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((t) => {
          if (t <= 1) {
            handleTimeout('w');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            handleTimeout('b');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [inGame, isGameOver, turn]);

  const handleTimeout = (timedOutColor: 'w' | 'b') => {
    setIsGameOver(true);
    const win = timedOutColor === 'w' ? 'b' : 'w';
    setWinner(win);
    setGameOverReason(`${timedOutColor === 'w' ? 'White' : 'Black'} ran out of time!`);
    sounds.playVictory();
  };

  // 5. Piece & Square Interaction Logic
  const handleSquareInteraction = useCallback(
    (clickedSquare: string) => {
      if (isGameOver || isAiThinking) return;

      // Online role check: you can only move your own pieces
      if (gameMode === 'online') {
        if (myRole === 'spectator') return;
        if (myRole === 'white' && turn !== 'w') return;
        if (myRole === 'black' && turn !== 'b') return;
      }

      // If user clicked the already selected square, deselect it
      if (selectedSquare === clickedSquare) {
        setSelectedSquare(null);
        sceneManagerRef.current?.setSelection(null, []);
        return;
      }

      // If user has not selected a piece yet:
      if (!selectedSquare) {
        const piece = gameRef.current.getPiece(clickedSquare);
        if (!piece) return;

        // Check if piece belongs to current turn player
        if (piece.color !== turn) return;

        // In AI mode, player is White
        if (gameMode === 'ai' && piece.color !== 'w') return;

        // Select piece
        const legals = gameRef.current.getLegalMovesForSquare(clickedSquare);
        setSelectedSquare(clickedSquare);
        sceneManagerRef.current?.setSelection(clickedSquare, legals);
        sounds.playSelect();
      } else {
        // User clicked a second square: check if it's a legal move
        const legals = gameRef.current.getLegalMovesForSquare(selectedSquare);

        if (legals.includes(clickedSquare)) {
          // Check if it's a pawn promotion move
          if (gameRef.current.isPromotionMove(selectedSquare, clickedSquare)) {
            setPendingPromotion({ from: selectedSquare, to: clickedSquare });
            return;
          }

          // Execute move
          executeMove(selectedSquare, clickedSquare, 'q');
        } else {
          // Deselect or select new friendly piece
          const piece = gameRef.current.getPiece(clickedSquare);
          if (piece && piece.color === turn && (gameMode !== 'ai' || piece.color === 'w')) {
            const newLegals = gameRef.current.getLegalMovesForSquare(clickedSquare);
            setSelectedSquare(clickedSquare);
            sceneManagerRef.current?.setSelection(clickedSquare, newLegals);
            sounds.playSelect();
          } else {
            setSelectedSquare(null);
            sceneManagerRef.current?.setSelection(null, []);
          }
        }
      }
    },
    [selectedSquare, turn, isGameOver, isAiThinking, gameMode, myRole]
  );

  const handlePieceDrop = useCallback(
    (from: string, to: string) => {
      if (isGameOver || isAiThinking) return;

      if (gameMode === 'online') {
        if (myRole === 'spectator') return;
        if (myRole === 'white' && turn !== 'w') return;
        if (myRole === 'black' && turn !== 'b') return;
      }

      const piece = gameRef.current.getPiece(from);
      if (!piece || piece.color !== turn) return;
      if (gameMode === 'ai' && piece.color !== 'w') return;

      const legals = gameRef.current.getLegalMovesForSquare(from);
      if (legals.includes(to)) {
        if (gameRef.current.isPromotionMove(from, to)) {
          setPendingPromotion({ from, to });
          return;
        }
        executeMove(from, to, 'q');
      } else {
        sounds.playIllegal();
      }
    },
    [isGameOver, isAiThinking, gameMode, myRole, turn]
  );

  const canDragPiece = useCallback(
    (square: string): boolean => {
      if (isGameOver || isAiThinking) return false;
      if (gameMode === 'online') {
        if (myRole === 'spectator') return false;
        if (myRole === 'white' && turn !== 'w') return false;
        if (myRole === 'black' && turn !== 'b') return false;
      }
      const piece = gameRef.current.getPiece(square);
      if (!piece || piece.color !== turn) return false;
      if (gameMode === 'ai' && piece.color !== 'w') return false;
      return true;
    },
    [isGameOver, isAiThinking, gameMode, myRole, turn]
  );

  const getLegalMoves = useCallback((square: string): string[] => {
    return gameRef.current.getLegalMovesForSquare(square);
  }, []);

  // Update refs to ensure callbacks are always fresh and never suffer from stale closures
  handleSquareInteractionRef.current = handleSquareInteraction;
  handlePieceDropRef.current = handlePieceDrop;
  canDragPieceRef.current = canDragPiece;
  getLegalMovesRef.current = getLegalMoves;

  const executeMove = (from: string, to: string, promotion: string = 'q') => {
    const isCapture = !!gameRef.current.getPiece(to);
    const result = gameRef.current.makeMove(from, to, promotion);

    if (!result.success) {
      sounds.playIllegal();
      return;
    }

    // Parabolic move animation
    sceneManagerRef.current?.animateMove(from, to, () => {
      if (isCapture) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }
      // Re-sync entire 3D board to guarantee complete fidelity for castling, en passant, promotions
      sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
    });

    sceneManagerRef.current?.setLastMove(from, to);
    sceneManagerRef.current?.setSelection(null, []);
    sceneManagerRef.current?.clearSuggestedMove();
    setAnalysis(null);
    setSelectedSquare(null);

    const nextTurn = gameRef.current.getTurn();
    setTurn(nextTurn);
    setMoveHistory(gameRef.current.getHistory());
    setCapturedPieces(gameRef.current.getCapturedPieces());

    const check = gameRef.current.isCheck();
    setIsCheck(check);
    const kingSq = gameRef.current.getKingSquare(nextTurn);
    sceneManagerRef.current?.setCheckSquare(check ? kingSq : null);

    if (result.isCheckmate) {
      setIsCheckmate(true);
      setIsGameOver(true);
      const win = result.color === 'w' ? 'w' : 'b';
      setWinner(win);
      setGameOverReason('Checkmate');
      sounds.playVictory();
    } else if (result.isDraw || result.isStalemate) {
      setIsGameOver(true);
      setWinner('draw');
      setGameOverReason(result.isStalemate ? 'Stalemate' : 'Draw');
    } else if (check) {
      sounds.playCheck();
    }

    // Sync over WebSocket if Online
    if (gameMode === 'online') {
      multiplayerRef.current?.sendMove({
        move: { from, to, promotion },
        san: result.san,
        fen: gameRef.current.getFen(),
        timeWhite: whiteTime,
        timeBlack: blackTime,
        isCheckmate: result.isCheckmate,
        isDraw: result.isDraw || result.isStalemate,
      });
    }

    // Trigger AI move if in AI Mode and it's Black's turn
    if (gameMode === 'ai' && nextTurn === 'b' && !result.isCheckmate && !result.isDraw) {
      triggerAIMove();
    }
  };

  const triggerAIMove = () => {
    setIsAiThinking(true);
    // Realistic cognitive pause (400-800ms)
    setTimeout(() => {
      const bestMove = gameRef.current.getBestAIMove(aiDifficulty);
      if (bestMove) {
        const isCapture = !!gameRef.current.getPiece(bestMove.to);
        const result = gameRef.current.makeMove(bestMove.from, bestMove.to, bestMove.promotion || 'q');

        if (result.success) {
          sceneManagerRef.current?.animateMove(bestMove.from, bestMove.to, () => {
            if (isCapture) {
              sounds.playCapture();
            } else {
              sounds.playMove();
            }
            sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
          });

          sceneManagerRef.current?.setLastMove(bestMove.from, bestMove.to);
          setTurn('w');
          setMoveHistory(gameRef.current.getHistory());
          setCapturedPieces(gameRef.current.getCapturedPieces());

          const check = gameRef.current.isCheck();
          setIsCheck(check);
          const kingSq = gameRef.current.getKingSquare('w');
          sceneManagerRef.current?.setCheckSquare(check ? kingSq : null);

          if (result.isCheckmate) {
            setIsCheckmate(true);
            setIsGameOver(true);
            setWinner('b');
            setGameOverReason('Checkmate by AI');
            sounds.playVictory();
          } else if (result.isDraw || result.isStalemate) {
            setIsGameOver(true);
            setWinner('draw');
            setGameOverReason('Draw');
          } else if (check) {
            sounds.playCheck();
          }
        }
      }
      setIsAiThinking(false);
    }, 600);
  };

  // 6. Start Match from Title Screen
  const handleStartGame = (config: {
    mode: GameMode;
    skinId: string;
    aiDifficulty: 'novice' | 'apprentice' | 'master';
    playerName: string;
    roomId: string;
    isCreatingRoom: boolean;
    rolePreference: 'white' | 'black' | 'auto';
  }) => {
    setGameMode(config.mode);
    setAiDifficulty(config.aiDifficulty);
    setMyPlayerName(config.playerName);
    setRoomId(config.roomId);

    // Apply chosen skin
    const skin = getSkinById(config.skinId);
    setActiveSkin(skin);
    sceneManagerRef.current?.setSkin(skin);

    // Reset game state
    gameRef.current.reset();
    sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
    sceneManagerRef.current?.setSelection(null, []);
    sceneManagerRef.current?.setLastMove(null, null);
    sceneManagerRef.current?.setCheckSquare(null);

    setTurn('w');
    setWhiteTime(600);
    setBlackTime(600);
    setMoveHistory([]);
    setIsCheck(false);
    setIsCheckmate(false);
    setIsGameOver(false);
    setWinner(null);
    setCapturedPieces(gameRef.current.getCapturedPieces());

    if (config.mode === 'online') {
      multiplayerRef.current?.joinRoom(
        config.roomId,
        config.playerName,
        config.rolePreference
      );
    } else if (config.mode === 'ai') {
      setMyRole('white');
      setWhitePlayerName(config.playerName);
      setBlackPlayerName(`AI Engine (${config.aiDifficulty.toUpperCase()})`);
      sceneManagerRef.current?.setCameraPreset('white');
      setCameraPreset('white');
    } else {
      // Pass & Play
      setWhitePlayerName('Player 1 (White)');
      setBlackPlayerName('Player 2 (Black)');
      sceneManagerRef.current?.setCameraPreset('white');
      setCameraPreset('white');
    }

    setInGame(true);
  };

  // 7. Dock & In-Game Actions
  const handleSkinChange = (skin: BoardSkin) => {
    setActiveSkin(skin);
    sceneManagerRef.current?.setSkin(skin);
  };

  const handleCameraChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  };

  const handleToggleSoundMute = () => {
    const muted = sounds.toggleMute();
    setIsSoundMuted(muted);
  };

  const handleToggleVoiceMute = () => {
    const muted = voiceChatRef.current?.toggleMute() ?? false;
    setIsVoiceMuted(muted);
  };

  const handleToggleDeafen = () => {
    const deaf = voiceChatRef.current?.toggleDeafen() ?? false;
    setIsDeafened(deaf);
  };

  const handleTogglePushToTalk = () => {
    const ptt = !(voiceChatRef.current?.getPushToTalk() ?? false);
    voiceChatRef.current?.setPushToTalk(ptt);
    setIsPushToTalk(ptt);
  };

  const handleJoinVoice = async () => {
    const success = await voiceChatRef.current?.joinVoice();
    if (success) {
      sounds.playVoiceConnect();
    }
  };

  const handleResign = () => {
    if (isGameOver) return;
    if (gameMode === 'online') {
      multiplayerRef.current?.sendResign();
    } else {
      const win = turn === 'w' ? 'b' : 'w';
      setIsGameOver(true);
      setWinner(win);
      setGameOverReason(`${turn === 'w' ? 'White' : 'Black'} Resigned`);
      sounds.playVictory();
    }
  };

  const handleRestart = () => {
    if (gameMode === 'online') {
      multiplayerRef.current?.sendRestart(600, 5);
    } else {
      gameRef.current.reset();
      sceneManagerRef.current?.syncFromFen(gameRef.current.getFen());
      sceneManagerRef.current?.setSelection(null, []);
      sceneManagerRef.current?.setLastMove(null, null);
      sceneManagerRef.current?.setCheckSquare(null);
      setTurn('w');
      setWhiteTime(600);
      setBlackTime(600);
      setMoveHistory([]);
      setIsCheck(false);
      setIsCheckmate(false);
      setIsGameOver(false);
      setWinner(null);
      setCapturedPieces(gameRef.current.getCapturedPieces());
    }
  };

  const handleExitToMenu = () => {
    setInGame(false);
    sceneManagerRef.current?.setCameraPreset('cinematic');
    setCameraPreset('cinematic');
  };

  const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  };

  const handleSendMessage = (text: string) => {
    if (gameMode === 'online') {
      multiplayerRef.current?.sendChat(text);
    }
    // Local copy
    setMessages((prev) => [
      ...prev,
      {
        sender: myPlayerName,
        senderRole: myRole,
        senderId: 'me',
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSendReaction = (emoji: string) => {
    if (gameMode === 'online') {
      multiplayerRef.current?.sendReaction(emoji);
    }
    // Trigger locally
    const reaction: ReactionItem = {
      id: Math.random().toString(),
      sender: myPlayerName,
      emoji,
      x: Math.random() * 60 + 20,
      y: 65,
    };
    setActiveReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2500);
  };

  const handleRunAnalysis = () => {
    if (isGameOver) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = gameRef.current.analyzePosition();
      setAnalysis(result);
      setIsAnalyzing(false);
      if (result) {
        sceneManagerRef.current?.showSuggestedMove(result.bestMove.from, result.bestMove.to);
        sounds.playSelect();
      }
    }, 200);
  };

  const handleShowMoveOnBoard = (from: string, to: string) => {
    sceneManagerRef.current?.showSuggestedMove(from, to);
  };

  const handleApplySuggestedMove = (from: string, to: string, promotion: string = 'q') => {
    executeMove(from, to, promotion);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060912] font-sans">
      {/* 1. Isolated 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. Title Screen / Match Setup Modal */}
      {!inGame && (
        <TitleScreen
          onStartGame={handleStartGame}
          selectedSkinId={activeSkin.id}
          onSkinSelect={handleSkinChange}
          isMuted={isSoundMuted}
          onToggleMute={handleToggleSoundMute}
        />
      )}

      {/* 3. In-Game HUD: Perimeter Clocks & Players (>85% unobstructed viewport) */}
      {inGame && (
        <>
          <PerimeterHUD
            whiteName={whitePlayerName}
            blackName={blackPlayerName}
            whiteTime={whiteTime}
            blackTime={blackTime}
            turn={turn}
            capturedPieces={capturedPieces}
            isCheck={isCheck}
            isCheckmate={isCheckmate}
            gameStatusText={
              isAiThinking
                ? 'AI is calculating move...'
                : gameMode === 'online'
                ? `Online Room: ${roomId}`
                : undefined
            }
            isOnline={gameMode === 'online'}
            roomId={roomId}
            whiteIsSpeaking={whiteIsSpeaking}
            blackIsSpeaking={blackIsSpeaking}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
          />

          {/* 4. Unified Collapsible Bottom Control Dock (Three.js Directive #5) */}
          <BottomControlDock
            activeSkin={activeSkin}
            onSkinChange={handleSkinChange}
            cameraPreset={cameraPreset}
            onCameraChange={handleCameraChange}
            isSoundMuted={isSoundMuted}
            onToggleSoundMute={handleToggleSoundMute}
            voiceStatus={voiceStatus}
            isVoiceMuted={isVoiceMuted}
            isDeafened={isDeafened}
            isPushToTalk={isPushToTalk}
            audioLevel={audioLevel}
            onToggleVoiceMute={handleToggleVoiceMute}
            onToggleDeafen={handleToggleDeafen}
            onTogglePushToTalk={handleTogglePushToTalk}
            onJoinVoice={handleJoinVoice}
            onResign={handleResign}
            onRestart={handleRestart}
            onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            onOpenRules={() => setIsRulesOpen(true)}
            onExitToMenu={handleExitToMenu}
            isOnline={gameMode === 'online'}
            isGameOver={isGameOver}
          />

          {/* 5. Chat & Floating Reaction Bursts & Move History with Best Move Analysis */}
          <ChatAndReactions
            isChatOpen={isChatOpen}
            onCloseChat={() => setIsChatOpen(false)}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
            activeReactions={activeReactions}
            isOnline={gameMode === 'online'}
            moveHistory={moveHistory}
            isHistoryOpen={isHistoryOpen}
            onCloseHistory={() => setIsHistoryOpen(false)}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onRunAnalysis={handleRunAnalysis}
            onShowMoveOnBoard={handleShowMoveOnBoard}
            onApplySuggestedMove={handleApplySuggestedMove}
            canExecuteMove={!isGameOver && (gameMode !== 'online' || (myRole === 'white' && turn === 'w') || (myRole === 'black' && turn === 'b'))}
          />
        </>
      )}

      {/* 6. Pawn Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={turn}
          onSelectPiece={handlePromotionSelect}
        />
      )}

      {/* 7. Game Over / Victory Modal */}
      {isGameOver && (
        <GameOverModal
          winner={winner}
          reason={gameOverReason}
          whiteName={whitePlayerName}
          blackName={blackPlayerName}
          onRematch={handleRestart}
          onExitToMenu={handleExitToMenu}
        />
      )}

      {/* 8. Rules & Piece Movement Guide Modal */}
      <RulesAndPieceGuideModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
