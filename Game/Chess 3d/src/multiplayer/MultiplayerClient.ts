export interface PlayerInfo {
  id: string;
  name: string;
  role: 'white' | 'black' | 'spectator' | null;
}

export interface RoomData {
  id: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  spectators: string[];
  players: PlayerInfo[];
  fen: string;
  history: string[];
  timeWhite: number;
  timeBlack: number;
  lastMoveTimestamp: number | null;
  turn: 'w' | 'b';
  timeControl: { base: number; increment: number };
  status: 'waiting' | 'active' | 'checkmate' | 'draw' | 'resigned' | 'timeout';
  winner: 'w' | 'b' | 'draw' | null;
}

export interface ChatMessage {
  sender: string;
  senderRole: 'white' | 'black' | 'spectator' | null;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ReactionItem {
  id: string;
  sender: string;
  emoji: string;
  x: number;
  y: number;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private myPeerId: string | null = null;
  private currentRoomId: string | null = null;
  private isConnecting: boolean = false;

  // Callbacks
  public onConnectionChange?: (connected: boolean) => void;
  public onRoomJoined?: (room: RoomData, yourRole: 'white' | 'black' | 'spectator', yourId: string) => void;
  public onPeerJoined?: (peer: PlayerInfo, room: RoomData) => void;
  public onPeerLeft?: (peerId: string, role: string, room: RoomData) => void;
  public onMoveMade?: (data: {
    move: { from: string; to: string; promotion?: string };
    san: string;
    fen: string;
    turn: 'w' | 'b';
    timeWhite: number;
    timeBlack: number;
    history: string[];
    status: string;
    winner: string | null;
  }) => void;
  public onGameRestarted?: (room: RoomData) => void;
  public onPlayerResigned?: (data: { resignedRole: string; winner: string; status: string }) => void;
  public onChatMessage?: (message: ChatMessage) => void;
  public onReaction?: (reaction: ReactionItem) => void;
  public onVoiceSignal?: (fromPeerId: string, fromPeerName: string, signal: any) => void;
  public onRolesUpdated?: (players: PlayerInfo[], room: RoomData) => void;

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.onConnectionChange?.(true);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.onConnectionChange?.(false);
        // Attempt reconnect after delay
        setTimeout(() => {
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.connect();
          }
        }, 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket warning:', err);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.onConnectionChange?.(false);
    }
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'connected':
        this.myPeerId = msg.peerId;
        break;
      case 'room_joined':
        this.currentRoomId = msg.room.id;
        this.onRoomJoined?.(msg.room, msg.yourRole, msg.yourId);
        break;
      case 'peer_joined':
        this.onPeerJoined?.(msg.peer, msg.room);
        break;
      case 'peer_left':
        this.onPeerLeft?.(msg.peerId, msg.role, msg.room);
        break;
      case 'move_made':
        this.onMoveMade?.(msg);
        break;
      case 'game_restarted':
        this.onGameRestarted?.(msg.room);
        break;
      case 'player_resigned':
        this.onPlayerResigned?.(msg);
        break;
      case 'chat_message':
        this.onChatMessage?.(msg);
        break;
      case 'reaction_burst':
        this.onReaction?.({
          id: Math.random().toString(),
          sender: msg.sender,
          emoji: msg.emoji,
          x: msg.x ?? Math.random() * 80 + 10,
          y: msg.y ?? 60,
        });
        break;
      case 'voice_signal':
        this.onVoiceSignal?.(msg.fromPeerId, msg.fromPeerName, msg.signal);
        break;
      case 'roles_updated':
        this.onRolesUpdated?.(msg.players, msg.room);
        break;
    }
  }

  public joinRoom(roomId: string, playerName: string, rolePreference: 'white' | 'black' | 'spectator' | 'auto' = 'auto') {
    this.send({
      type: 'join_room',
      roomId,
      playerName,
      rolePreference,
    });
  }

  public sendMove(data: {
    move: { from: string; to: string; promotion?: string };
    san?: string;
    fen: string;
    timeWhite?: number;
    timeBlack?: number;
    isCheckmate?: boolean;
    isDraw?: boolean;
  }) {
    this.send({
      type: 'move',
      ...data,
    });
  }

  public sendRestart(baseTime: number = 600, increment: number = 5) {
    this.send({
      type: 'restart_game',
      baseTime,
      increment,
    });
  }

  public sendResign() {
    this.send({
      type: 'resign',
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat',
      text,
    });
  }

  public sendReaction(emoji: string, x?: number, y?: number) {
    this.send({
      type: 'reaction',
      emoji,
      x,
      y,
    });
  }

  public sendVoiceSignal(toPeerId: string, signal: any) {
    this.send({
      type: 'voice_signal',
      toPeerId,
      signal,
    });
  }

  public switchRole(role: 'white' | 'black' | 'spectator') {
    this.send({
      type: 'switch_role',
      role,
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public getMyPeerId(): string | null {
    return this.myPeerId;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
