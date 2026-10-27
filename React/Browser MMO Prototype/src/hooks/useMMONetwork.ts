import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  MMOGameState,
  ServerPacket,
  ClientPacket,
  WorldPlayerEntity,
  GroundLootEntity,
  ChatMessage,
  InventoryState,
  ActiveTradeSession,
  Direction,
  EquipSlot,
} from '../types/mmo.js';
import { sound } from '../engine/sound.js';

export interface UseMMONetworkReturn {
  state: MMOGameState;
  stateRef: React.MutableRefObject<{
    myPlayerId: string;
    players: Record<string, WorldPlayerEntity>;
    groundLoot: Record<string, GroundLootEntity>;
    lastProcessedSeq: number;
    snapshotHistory: { timestamp: number; players: Record<string, WorldPlayerEntity> }[];
  }>;
  sendPacket: (packet: ClientPacket) => void;
  sendMoveInput: (seq: number, dt: number, dx: number, dy: number, facing: Direction) => void;
  sendChat: (channel: string, content: string, recipientId?: string) => void;
  sendEmote: (emoji: string) => void;
  sendItemMove: (uid: string, toX: number, toY: number, rotate?: boolean) => void;
  sendItemEquip: (uid: string, slot?: EquipSlot) => void;
  sendItemUnequip: (slot: EquipSlot, toX?: number, toY?: number) => void;
  sendItemDrop: (uid: string) => void;
  sendItemPickup: (lootId: string) => void;
  sendItemUse: (uid: string) => void;
  sendItemSort: () => void;
  sendTradeRequest: (targetPlayerId: string) => void;
  sendTradeRespond: (tradeId: string, accept: boolean) => void;
  sendTradeStageItem: (tradeId: string, itemUid: string) => void;
  sendTradeUnstageItem: (tradeId: string, itemUid: string) => void;
  sendTradeSetGold: (tradeId: string, amount: number) => void;
  sendTradeLock: (tradeId: string, locked: boolean) => void;
  sendTradeConfirm: (tradeId: string) => void;
  sendTradeCancel: (tradeId: string) => void;
  selectTarget: (playerId: string | null) => void;
  switchShard: (newShardId: string) => void;
  systemAlert: { message: string; alertType: string; timestamp: number } | null;
}

export function useMMONetwork(
  initialShardId = 'REALM',
  username = '',
  avatarColor?: string
): UseMMONetworkReturn {
  const [shardId, setShardId] = useState(initialShardId);
  const [systemAlert, setSystemAlert] = useState<{ message: string; alertType: string; timestamp: number } | null>(null);

  const [state, setState] = useState<MMOGameState>({
    connectionStatus: 'CONNECTING',
    shardId,
    pingMs: 18,
    myPlayerId: '',
    players: {},
    groundLoot: {},
    inventory: {
      cols: 8,
      rows: 5,
      slots: [],
      equipped: {},
      gold: 0,
    },
    chatHistory: [
      {
        id: 'sys_welcome',
        senderId: 'SYSTEM',
        senderName: 'Realm Herald',
        channel: 'SYSTEM',
        content: `Welcome to Aetherial Frontier! Use WASD or Click to roam. Press [I] for Inventory, [Enter] to chat.`,
        timestamp: Date.now(),
      },
    ],
    selectedTargetId: null,
    activeTrade: null,
    tradeInvite: null,
  });

  // Decoupled mutable state ref for 60fps canvas engine
  const stateRef = useRef<{
    myPlayerId: string;
    players: Record<string, WorldPlayerEntity>;
    groundLoot: Record<string, GroundLootEntity>;
    lastProcessedSeq: number;
    snapshotHistory: { timestamp: number; players: Record<string, WorldPlayerEntity> }[];
  }>({
    myPlayerId: '',
    players: {},
    groundLoot: {},
    lastProcessedSeq: 0,
    snapshotHistory: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send packet utility
  const sendPacket = useCallback((packet: ClientPacket) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setState(s => ({ ...s, connectionStatus: 'CONNECTING', shardId }));

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, Vite proxies /ws to server port 3009
      const wsUrl = `${protocol}//${window.location.host}/ws?shard=${shardId}&name=${encodeURIComponent(
        username || 'Adventurer'
      )}&color=${encodeURIComponent(avatarColor || '#38BDF8')}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setState(s => ({ ...s, connectionStatus: 'CONNECTED' }));
          // Explicit JOIN packet
          sendPacket({
            type: 'JOIN',
            shardId,
            username: username || 'Adventurer',
            avatarColor,
          });

          // Start ping heartbeat
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              sendPacket({ type: 'PING', clientTimestamp: Date.now() });
            }
          }, 2000);
        };

        let pingInterval: NodeJS.Timeout | null = null;

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const packet = JSON.parse(event.data) as ServerPacket;
            handleServerPacket(packet);
          } catch (e) {
            console.error('Failed to parse server packet', e);
          }
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (!isMounted) return;
          setState(s => ({ ...s, connectionStatus: 'DISCONNECTED' }));
          // Auto-reconnect after 2 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 2000);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) ws.close();
        };
      } catch (err) {
        console.warn('WebSocket connection error, will retry...', err);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, 2500);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [shardId, username, avatarColor, sendPacket]);

  // Handle incoming server packet
  const handleServerPacket = useCallback((packet: ServerPacket) => {
    switch (packet.type) {
      case 'INIT_STATE': {
        stateRef.current.myPlayerId = packet.myPlayerId;
        stateRef.current.players = packet.players;
        stateRef.current.groundLoot = packet.groundLoot;

        setState(s => ({
          ...s,
          myPlayerId: packet.myPlayerId,
          shardId: packet.shardId,
          inventory: packet.inventory,
          players: packet.players,
          groundLoot: packet.groundLoot,
        }));
        break;
      }

      case 'TICK_SNAPSHOT': {
        // Record in snapshot history for remote interpolation
        stateRef.current.snapshotHistory.push({
          timestamp: packet.timestamp,
          players: packet.players,
        });
        if (stateRef.current.snapshotHistory.length > 20) {
          stateRef.current.snapshotHistory.shift();
        }

        // Update last processed sequence number for reconciliation
        const myId = stateRef.current.myPlayerId;
        if (myId && packet.lastProcessedSeqs[myId] !== undefined) {
          stateRef.current.lastProcessedSeq = packet.lastProcessedSeqs[myId];
        }

        // Update ground loot if deltas provided
        if (packet.groundLootDeltas?.added) {
          for (const item of packet.groundLootDeltas.added) {
            stateRef.current.groundLoot[item.id] = item;
          }
        }
        if (packet.groundLootDeltas?.removed) {
          for (const id of packet.groundLootDeltas.removed) {
            delete stateRef.current.groundLoot[id];
          }
        }

        // Update remote players in ref
        for (const [id, remoteP] of Object.entries(packet.players)) {
          if (id !== myId) {
            stateRef.current.players[id] = remoteP;
          }
        }
        break;
      }

      case 'INVENTORY_UPDATE': {
        setState(s => ({ ...s, inventory: packet.inventory }));
        break;
      }

      case 'CHAT_MESSAGE': {
        setState(s => ({
          ...s,
          chatHistory: [...s.chatHistory.slice(-50), packet.message],
        }));
        sound.playChatPop();
        break;
      }

      case 'CHAT_BUBBLE': {
        // Diegetic overhead bubble
        const p = stateRef.current.players[packet.playerId];
        if (p) {
          p.activeChatBubble = {
            text: packet.text,
            expiresAt: packet.expiresAt,
          };
        }
        sound.playChatPop();
        break;
      }

      case 'EMOTE_POP': {
        const p = stateRef.current.players[packet.playerId];
        if (p) {
          p.activeEmote = {
            emoji: packet.emoji,
            expiresAt: packet.expiresAt,
          };
        }
        break;
      }

      case 'LOOT_SPAWNED': {
        stateRef.current.groundLoot[packet.loot.id] = packet.loot;
        setState(s => ({
          ...s,
          groundLoot: { ...s.groundLoot, [packet.loot.id]: packet.loot },
        }));
        sound.playDrop();
        break;
      }

      case 'LOOT_DESPAWNED': {
        delete stateRef.current.groundLoot[packet.lootId];
        setState(s => {
          const updated = { ...s.groundLoot };
          delete updated[packet.lootId];
          return { ...s, groundLoot: updated };
        });
        if (packet.pickedUpBy === stateRef.current.myPlayerId) {
          sound.playPickup();
        }
        break;
      }

      case 'TRADE_INVITE': {
        setState(s => ({
          ...s,
          tradeInvite: {
            tradeId: packet.tradeId,
            initiatorId: packet.initiatorId,
            initiatorName: packet.initiatorName,
          },
        }));
        sound.playChatPop();
        break;
      }

      case 'TRADE_UPDATE': {
        setState(s => ({
          ...s,
          activeTrade: packet.trade,
          tradeInvite: null,
        }));
        if (packet.trade?.stage === 'COUNTDOWN') {
          sound.playTradeLock();
        } else if (packet.trade?.stage === 'CONFIRMED') {
          sound.playTradeSuccess();
        }
        if (packet.errorReason) {
          setSystemAlert({ message: packet.errorReason, alertType: 'warning', timestamp: Date.now() });
        }
        break;
      }

      case 'PONG': {
        const rtt = Date.now() - packet.clientTimestamp;
        setState(s => ({ ...s, pingMs: Math.max(1, Math.round(rtt)) }));
        break;
      }

      case 'SYSTEM_ALERT': {
        setSystemAlert({ message: packet.message, alertType: packet.alertType || 'info', timestamp: Date.now() });
        setState(s => ({
          ...s,
          chatHistory: [
            ...s.chatHistory.slice(-50),
            {
              id: `alert_${Date.now()}`,
              senderId: 'SYSTEM',
              senderName: 'Realm',
              channel: 'SYSTEM',
              content: packet.message,
              timestamp: Date.now(),
            },
          ],
        }));
        break;
      }
    }
  }, []);

  // Action dispatches
  const sendMoveInput = useCallback(
    (seq: number, dt: number, dx: number, dy: number, facing: Direction) => {
      sendPacket({
        type: 'MOVE_INPUT',
        seq,
        dt,
        inputVector: { dx, dy },
        facing,
      });
    },
    [sendPacket]
  );

  const sendChat = useCallback(
    (channel: string, content: string, recipientId?: string) => {
      sendPacket({
        type: 'CHAT',
        channel: channel as any,
        content,
        recipientId,
      });
    },
    [sendPacket]
  );

  const sendEmote = useCallback(
    (emoji: string) => {
      sendPacket({ type: 'EMOTE', emoji });
    },
    [sendPacket]
  );

  const sendItemMove = useCallback(
    (uid: string, toX: number, toY: number, rotate?: boolean) => {
      sendPacket({ type: 'ITEM_MOVE', uid, toGridX: toX, toGridY: toY, rotate });
    },
    [sendPacket]
  );

  const sendItemEquip = useCallback(
    (uid: string, slot?: EquipSlot) => {
      sendPacket({ type: 'ITEM_EQUIP', uid, targetSlot: slot });
      sound.playEquip();
    },
    [sendPacket]
  );

  const sendItemUnequip = useCallback(
    (slot: EquipSlot, toX?: number, toY?: number) => {
      sendPacket({ type: 'ITEM_UNEQUIP', slot, toGridX: toX, toGridY: toY });
      sound.playEquip();
    },
    [sendPacket]
  );

  const sendItemDrop = useCallback(
    (uid: string) => {
      sendPacket({ type: 'ITEM_DROP', uid });
    },
    [sendPacket]
  );

  const sendItemPickup = useCallback(
    (lootId: string) => {
      sendPacket({ type: 'ITEM_PICKUP', lootId });
    },
    [sendPacket]
  );

  const sendItemUse = useCallback(
    (uid: string) => {
      sendPacket({ type: 'ITEM_USE', uid });
    },
    [sendPacket]
  );

  const sendItemSort = useCallback(() => {
    sendPacket({ type: 'ITEM_SORT' });
    sound.playEquip();
  }, [sendPacket]);

  const sendTradeRequest = useCallback(
    (targetPlayerId: string) => {
      sendPacket({ type: 'TRADE_REQUEST', targetPlayerId });
    },
    [sendPacket]
  );

  const sendTradeRespond = useCallback(
    (tradeId: string, accept: boolean) => {
      sendPacket({ type: 'TRADE_RESPOND', tradeId, accept });
      setState(s => ({ ...s, tradeInvite: null }));
    },
    [sendPacket]
  );

  const sendTradeStageItem = useCallback(
    (tradeId: string, itemUid: string) => {
      sendPacket({ type: 'TRADE_STAGE_ITEM', tradeId, itemUid });
      sound.playEquip();
    },
    [sendPacket]
  );

  const sendTradeUnstageItem = useCallback(
    (tradeId: string, itemUid: string) => {
      sendPacket({ type: 'TRADE_UNSTAGE_ITEM', tradeId, itemUid });
      sound.playEquip();
    },
    [sendPacket]
  );

  const sendTradeSetGold = useCallback(
    (tradeId: string, amount: number) => {
      sendPacket({ type: 'TRADE_SET_GOLD', tradeId, amount });
    },
    [sendPacket]
  );

  const sendTradeLock = useCallback(
    (tradeId: string, locked: boolean) => {
      sendPacket({ type: 'TRADE_LOCK', tradeId, locked });
      sound.playTradeLock();
    },
    [sendPacket]
  );

  const sendTradeConfirm = useCallback(
    (tradeId: string) => {
      sendPacket({ type: 'TRADE_CONFIRM', tradeId });
    },
    [sendPacket]
  );

  const sendTradeCancel = useCallback(
    (tradeId: string) => {
      sendPacket({ type: 'TRADE_CANCEL', tradeId });
      setState(s => ({ ...s, activeTrade: null }));
    },
    [sendPacket]
  );

  const selectTarget = useCallback((playerId: string | null) => {
    setState(s => ({ ...s, selectedTargetId: playerId }));
  }, []);

  const switchShard = useCallback((newShardId: string) => {
    setShardId(newShardId.toUpperCase().trim());
  }, []);

  return {
    state,
    stateRef,
    sendPacket,
    sendMoveInput,
    sendChat,
    sendEmote,
    sendItemMove,
    sendItemEquip,
    sendItemUnequip,
    sendItemDrop,
    sendItemPickup,
    sendItemUse,
    sendItemSort,
    sendTradeRequest,
    sendTradeRespond,
    sendTradeStageItem,
    sendTradeUnstageItem,
    sendTradeSetGold,
    sendTradeLock,
    sendTradeConfirm,
    sendTradeCancel,
    selectTarget,
    switchShard,
    systemAlert,
  };
}
