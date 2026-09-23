import { create } from 'zustand';
import {
  GameLobbyState,
  GamePhase,
  ToolType,
  DrawAction,
  ChatMessage,
  WordChoice,
  Player,
} from '@/types/game';
import { evaluateGuessProximity } from '@/hooks/useProximity';

export const DEFAULT_WORD_DECKS: Record<string, WordChoice[]> = {
  'Woodland Studio': [
    { word: 'GIRAFFE', category: 'Woodland Creature', difficulty: 'MEDIUM', points: 250 },
    { word: 'SPARROW', category: 'Woodland Creature', difficulty: 'EASY', points: 100 },
    { word: 'WINDMILL', category: 'Rustic Habitat', difficulty: 'HARD', points: 500 },
    { word: 'TEAPOT', category: 'Atelier Cozy', difficulty: 'EASY', points: 100 },
    { word: 'MUSHROOM', category: 'Forest Flora', difficulty: 'EASY', points: 100 },
    { word: 'SQUIRREL', category: 'Woodland Creature', difficulty: 'MEDIUM', points: 250 },
    { word: 'LIGHTHOUSE', category: 'Coastal Landmark', difficulty: 'HARD', points: 500 },
    { word: 'WATERFALL', category: 'Nature Landscape', difficulty: 'MEDIUM', points: 250 },
  ],
  'Animals & Nature': [
    { word: 'OCTOPUS', category: 'Sea Life', difficulty: 'MEDIUM', points: 250 },
    { word: 'PENGUIN', category: 'Polar Birds', difficulty: 'EASY', points: 100 },
    { word: 'CHAMELEON', category: 'Reptile', difficulty: 'HARD', points: 500 },
    { word: 'ELEPHANT', category: 'Savannah Mammal', difficulty: 'EASY', points: 100 },
    { word: 'FIREFLY', category: 'Insects', difficulty: 'MEDIUM', points: 250 },
  ],
  'Tech & Gadgets': [
    { word: 'LAPTOP', category: 'Electronics', difficulty: 'EASY', points: 100 },
    { word: 'DRONE', category: 'Flight Robotics', difficulty: 'MEDIUM', points: 250 },
    { word: 'SATELLITE', category: 'Space Tech', difficulty: 'HARD', points: 500 },
    { word: 'SMARTPHONE', category: 'Everyday Device', difficulty: 'EASY', points: 100 },
    { word: 'HEADPHONES', category: 'Audio Gear', difficulty: 'EASY', points: 100 },
  ],
  'Foodie Atelier': [
    { word: 'CROISSANT', category: 'French Bakery', difficulty: 'MEDIUM', points: 250 },
    { word: 'PIZZA', category: 'Comfort Food', difficulty: 'EASY', points: 100 },
    { word: 'SUSHI', category: 'Japanese Cuisine', difficulty: 'MEDIUM', points: 250 },
    { word: 'AVOCADO', category: 'Fresh Produce', difficulty: 'EASY', points: 100 },
    { word: 'PANCAKES', category: 'Breakfast Treat', difficulty: 'MEDIUM', points: 250 },
  ],
};

interface GameStore extends GameLobbyState {
  currentTool: ToolType;
  brushColor: string;
  brushSize: number;
  chatMessages: ChatMessage[];
  lastGuesserName?: string;
  timelapsePlaying: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  decrementTime: () => void;
  setCurrentTool: (tool: ToolType) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addCanvasAction: (action: DrawAction) => void;
  undoCanvasAction: () => void;
  clearCanvas: () => void;
  setCanvasActions: (actions: DrawAction[]) => void;
  setTargetWord: (word: string, category: string) => void;
  selectWord: (choice: WordChoice) => void;
  submitGuess: (guessText: string, playerId: string) => { isExact: boolean; isWarm: boolean };
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  toggleBlindfold: () => void;
  toggleOneLine: () => void;
  setActiveDeck: (deckName: string) => void;
  setCustomWords: (words: string[]) => void;
  setViewMode: (mode: 'standard' | 'mobile_stylus' | 'tv_spectator') => void;
  toggleSound: () => void;
  startNextRound: () => void;
  restartGame: () => void;
}

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p_alex',
    username: 'Alex',
    initials: 'AL',
    score: 850,
    hasGuessedCorrectly: false,
    isHost: true,
    isDrawing: true,
  },
  {
    id: 'p_chloe',
    username: 'Chloe',
    initials: 'CH',
    score: 720,
    hasGuessedCorrectly: true,
    isHost: false,
    isDrawing: false,
  },
  {
    id: 'p_liam',
    username: 'Liam',
    initials: 'LM',
    score: 410,
    hasGuessedCorrectly: false,
    isHost: false,
    isDrawing: false,
  },
  {
    id: 'p_maya',
    username: 'Maya',
    initials: 'MY',
    score: 350,
    hasGuessedCorrectly: false,
    isHost: false,
    isDrawing: false,
    isWarm: true,
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'c1',
    senderId: 'system',
    senderName: 'Atelier Den',
    text: 'Round 2 sketch in progress • Alex is at the easel',
    type: 'system',
    timestamp: Date.now() - 30000,
  },
  {
    id: 'c2',
    senderId: 'p_liam',
    senderName: 'Liam',
    text: 'is it a tiny red fox?',
    type: 'normal',
    timestamp: Date.now() - 18000,
  },
  {
    id: 'c3',
    senderId: 'p_maya',
    senderName: 'Maya',
    text: 'fox',
    type: 'warm',
    timestamp: Date.now() - 12000,
  },
  {
    id: 'c4',
    senderId: 'p_chloe',
    senderName: 'Chloe',
    text: 'SOLVED THE RIDDLE! (+250)',
    type: 'correct',
    pointsAwarded: 250,
    timestamp: Date.now() - 6000,
  },
];

export const useGameStore = create<GameStore>((set, get) => ({
  roomId: 'DEN8',
  round: {
    current: 2,
    total: 3,
  },
  phase: 'DRAWING',
  timeLeft: 42,
  maxTime: 60,
  currentArtistId: 'p_alex',
  localPlayerId: 'p_alex',
  targetWord: 'GIRAFFE',
  hiddenWord: '_ _ _ _ _ _ _',
  activeCategory: 'Woodland Creature',
  wordChoices: [
    { word: 'SPARROW', category: 'Woodland Creature', difficulty: 'EASY', points: 100 },
    { word: 'GIRAFFE', category: 'Woodland Creature', difficulty: 'MEDIUM', points: 250 },
    { word: 'WINDMILL', category: 'Rustic Habitat', difficulty: 'HARD', points: 500 },
  ],
  players: INITIAL_PLAYERS,
  canvasState: {
    actions: [],
    backgroundColor: '#F8F4EC',
  },
  modifiers: {
    blindfoldMode: false,
    oneLineOnly: false,
    activeDeck: 'Woodland Studio',
    customWords: [],
  },
  isSoundEnabled: true,
  viewMode: 'standard',
  currentTool: 'brush',
  brushColor: '#1E2638',
  brushSize: 6,
  chatMessages: INITIAL_CHAT,
  timelapsePlaying: false,

  setPhase: (phase) => set({ phase }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  decrementTime: () => {
    const { timeLeft, phase } = get();
    if (timeLeft > 0 && phase === 'DRAWING') {
      set({ timeLeft: timeLeft - 1 });
    } else if (timeLeft <= 0 && phase === 'DRAWING') {
      set({ phase: 'ROUND_RECAP' });
    }
  },

  setCurrentTool: (currentTool) => set({ currentTool }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),

  addCanvasAction: (action) =>
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        actions: [...state.canvasState.actions, action],
      },
    })),

  undoCanvasAction: () =>
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        actions: state.canvasState.actions.slice(0, -1),
      },
    })),

  clearCanvas: () =>
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        actions: [],
      },
    })),

  setCanvasActions: (actions) =>
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        actions,
      },
    })),

  setTargetWord: (word, category) => {
    const masked = word
      .split('')
      .map((c) => (c === ' ' ? '  ' : '_'))
      .join(' ');
    set({
      targetWord: word,
      hiddenWord: masked,
      activeCategory: category,
    });
  },

  selectWord: (choice) => {
    const masked = choice.word
      .split('')
      .map((c) => (c === ' ' ? '  ' : '_'))
      .join(' ');

    set({
      targetWord: choice.word,
      hiddenWord: masked,
      activeCategory: choice.category,
      phase: 'DRAWING',
      timeLeft: 60,
      canvasState: {
        actions: [],
        backgroundColor: '#F8F4EC',
      },
      players: get().players.map((p) => ({
        ...p,
        hasGuessedCorrectly: p.id === get().currentArtistId,
        isWarm: false,
      })),
    });

    get().addChatMessage({
      senderId: 'system',
      senderName: 'Atelier Den',
      text: `New sketch round started! Category: ${choice.category} (${choice.word.length} letters)`,
      type: 'system',
    });
  },

  submitGuess: (guessText, playerId) => {
    const { targetWord, players, currentArtistId } = get();
    const player = players.find((p) => p.id === playerId) || players[0];

    // Artists cannot guess their own drawing
    if (playerId === currentArtistId) {
      get().addChatMessage({
        senderId: 'system',
        senderName: 'Den Keeper',
        text: "You are the current artist! You cannot guess your own prompt.",
        type: 'system',
        isPrivateToUser: true,
      });
      return { isExact: false, isWarm: false };
    }

    if (player.hasGuessedCorrectly) {
      // Send message to solved/spectator channel
      get().addChatMessage({
        senderId: player.id,
        senderName: player.username,
        text: guessText,
        type: 'normal',
      });
      return { isExact: false, isWarm: false };
    }

    const { isExact, isWarm } = evaluateGuessProximity(guessText, targetWord);

    if (isExact) {
      // Correct guess!
      const points = 250;
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId
            ? { ...p, score: p.score + points, hasGuessedCorrectly: true, isWarm: false }
            : p.id === state.currentArtistId
            ? { ...p, score: p.score + 50 } // Artist bonus for good drawing
            : p
        ),
      }));

      // Post victory announcement into chat (Asymmetric Secrecy: do not reveal the exact word!)
      get().addChatMessage({
        senderId: player.id,
        senderName: player.username,
        text: `SOLVED THE RIDDLE! (+${points})`,
        type: 'correct',
        pointsAwarded: points,
      });

      return { isExact: true, isWarm: false };
    }

    if (isWarm) {
      // Warm guess! Provide private feedback or discreet badge
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, isWarm: true } : p
        ),
      }));

      get().addChatMessage({
        senderId: player.id,
        senderName: player.username,
        text: guessText,
        type: 'warm',
      });

      return { isExact: false, isWarm: true };
    }

    // Normal incorrect guess
    get().addChatMessage({
      senderId: player.id,
      senderName: player.username,
      text: guessText,
      type: 'normal',
    });

    return { isExact: false, isWarm: false };
  },

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  toggleBlindfold: () =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        blindfoldMode: !state.modifiers.blindfoldMode,
      },
    })),

  toggleOneLine: () =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        oneLineOnly: !state.modifiers.oneLineOnly,
      },
    })),

  setActiveDeck: (deckName) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        activeDeck: deckName,
      },
    })),

  setCustomWords: (words) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        customWords: words,
      },
    })),

  setViewMode: (viewMode) => set({ viewMode }),
  toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

  startNextRound: () => {
    const { round, players, currentArtistId } = get();
    const nextRoundNumber = round.current + 1;

    if (nextRoundNumber > round.total) {
      set({ phase: 'MATCH_PODIUM' });
      return;
    }

    // Rotate artist
    const currentIndex = players.findIndex((p) => p.id === currentArtistId);
    const nextArtist = players[(currentIndex + 1) % players.length];

    // Pick 3 random words
    const deck = DEFAULT_WORD_DECKS[get().modifiers.activeDeck] || DEFAULT_WORD_DECKS['Woodland Studio'];
    const shuffled = [...deck].sort(() => 0.5 - Math.random()).slice(0, 3);

    set({
      round: { ...round, current: nextRoundNumber },
      currentArtistId: nextArtist.id,
      phase: 'WORD_SELECTION',
      wordChoices: shuffled,
      timeLeft: 10,
      canvasState: { actions: [], backgroundColor: '#F8F4EC' },
      players: players.map((p) => ({
        ...p,
        isDrawing: p.id === nextArtist.id,
        hasGuessedCorrectly: false,
        isWarm: false,
      })),
    });
  },

  restartGame: () => {
    set({
      round: { current: 1, total: 3 },
      phase: 'WORD_SELECTION',
      timeLeft: 10,
      players: INITIAL_PLAYERS.map((p, idx) => ({
        ...p,
        score: 0,
        hasGuessedCorrectly: false,
        isWarm: false,
        isDrawing: idx === 0,
      })),
      currentArtistId: 'p_alex',
      canvasState: { actions: [], backgroundColor: '#F8F4EC' },
      chatMessages: [
        {
          id: 'sys_restart',
          senderId: 'system',
          senderName: 'Atelier Den',
          text: 'A fresh sketchbook session has begun! Select a word to start.',
          type: 'system',
          timestamp: Date.now(),
        },
      ],
    });
  },
}));
