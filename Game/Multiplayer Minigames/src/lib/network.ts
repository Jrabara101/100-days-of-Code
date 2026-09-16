// Hybrid Real-Time Networking: WebRTC (PeerJS) + BroadcastChannel Multi-tab Sync
import Peer, { type DataConnection } from 'peerjs';

export type PlayerRole = 'P1' | 'P2' | 'SPECTATOR';

export interface NetworkPayload {
  type: 
    | 'PLAYER_JOIN'
    | 'PLAYER_ASSIGN'
    | 'READY_TOGGLE'
    | 'GAME_SELECT'
    | 'SYNC_STATE'
    | 'GAME_ACTION'
    | 'PING_DROPPED'
    | 'EMOTE_SENT'
    | 'COMMS_MESSAGE'
    | 'ROUND_RESET';
  sender: PlayerRole;
  payload: any;
  timestamp: number;
}

export type NetworkMessageHandler = (data: NetworkPayload) => void;

class NetworkHub {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: Set<NetworkMessageHandler> = new Set();
  private onConnectionStatusChange: ((connected: boolean, peerId?: string) => void) | null = null;

  public isConnected: boolean = false;
  public activeRoomCode: string = '';
  public currentRole: PlayerRole = 'P1';

  subscribe(handler: NetworkMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  setConnectionCallback(cb: (connected: boolean, peerId?: string) => void) {
    this.onConnectionStatusChange = cb;
  }

  // Initialize a room as Host (P1)
  hostRoom(roomCode: string, onReady: (code: string) => void) {
    this.cleanup();
    this.activeRoomCode = roomCode.toUpperCase().trim();
    this.currentRole = 'P1';

    // Broadcast channel for local same-browser multi-tab
    this.setupBroadcast(this.activeRoomCode);

    const peerId = `hub-room-${this.activeRoomCode}-host`;
    this.peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    this.peer.on('open', () => {
      onReady(this.activeRoomCode);
    });

    this.peer.on('connection', (conn) => {
      this.connection = conn;
      this.setupConnectionEvents(conn);
      this.isConnected = true;
      if (this.onConnectionStatusChange) this.onConnectionStatusChange(true, conn.peer);

      // Welcome message to client assigning P2
      this.send({
        type: 'PLAYER_ASSIGN',
        sender: 'P1',
        payload: { assignedRole: 'P2' },
        timestamp: Date.now(),
      });
    });

    this.peer.on('error', (err) => {
      console.warn('[Host Peer Warning]', err.type, err.message);
      // Even if public peer server is throttled, local multi-tab BroadcastChannel functions seamlessly
      onReady(this.activeRoomCode);
    });
  }

  // Join an existing room as Guest (P2)
  joinRoom(roomCode: string, onConnected: () => void, onError: (err: string) => void) {
    this.cleanup();
    this.activeRoomCode = roomCode.toUpperCase().trim();
    this.currentRole = 'P2';

    this.setupBroadcast(this.activeRoomCode);

    const guestPeerId = `hub-room-${this.activeRoomCode}-guest-${Math.floor(Math.random() * 10000)}`;
    const hostPeerId = `hub-room-${this.activeRoomCode}-host`;

    this.peer = new Peer(guestPeerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    this.peer.on('open', () => {
      try {
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.connection = conn;
        this.setupConnectionEvents(conn);

        conn.on('open', () => {
          this.isConnected = true;
          if (this.onConnectionStatusChange) this.onConnectionStatusChange(true, hostPeerId);
          onConnected();

          // Notify host
          this.send({
            type: 'PLAYER_JOIN',
            sender: 'P2',
            payload: { role: 'P2' },
            timestamp: Date.now(),
          });
        });
      } catch (err: any) {
        onError(err?.message || 'Connection failed');
      }
    });

    this.peer.on('error', (err) => {
      console.warn('[Guest Peer Warning]', err.message);
      // Fallback: Notify via BroadcastChannel for multi-tab testing
      this.send({
        type: 'PLAYER_JOIN',
        sender: 'P2',
        payload: { role: 'P2' },
        timestamp: Date.now(),
      });
      onConnected();
    });
  }

  private setupBroadcast(roomCode: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(`minigame_hub_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkPayload;
        // Ignore messages sent by ourselves
        if (msg && msg.sender !== this.currentRole) {
          this.isConnected = true;
          if (this.onConnectionStatusChange) this.onConnectionStatusChange(true);
          this.dispatch(msg);
        }
      };
    }
  }

  private setupConnectionEvents(conn: DataConnection) {
    conn.on('data', (data) => {
      this.dispatch(data as NetworkPayload);
    });

    conn.on('close', () => {
      this.isConnected = false;
      if (this.onConnectionStatusChange) this.onConnectionStatusChange(false);
    });
  }

  private dispatch(msg: NetworkPayload) {
    this.messageHandlers.forEach((handler) => handler(msg));
  }

  send(msg: NetworkPayload) {
    // 1. Send via WebRTC peer connection
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(msg);
      } catch (e) {
        console.error('[WebRTC Send Error]', e);
      }
    }

    // 2. Send via BroadcastChannel (for same device/multi-tab synchronization)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.error('[BroadcastChannel Error]', e);
      }
    }
  }

  cleanup() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.isConnected = false;
  }
}

export const networkHub = new NetworkHub();
