import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { soundSynth } from '../utils/audioSynth';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [roomId, setRoomId] = useState('SIGMA-7749');
  const [playerRole, setPlayerRole] = useState('dual'); // 'p1' | 'p2' | 'dual'
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [latency, setLatency] = useState(12);
  const [networkMode, setNetworkMode] = useState('local'); // 'local' | 'p2p'
  const [activePings, setActivePings] = useState([]);

  const broadcastChannelRef = useRef(null);
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const eventListenersRef = useRef([]);

  // Initialize BroadcastChannel whenever roomId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }

      const channel = new BroadcastChannel(`sigma-room-${roomId}`);
      channel.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };
      broadcastChannelRef.current = channel;

      // Announce presence
      channel.postMessage({
        type: 'PEER_ANNOUNCE',
        payload: { role: playerRole, timestamp: Date.now() }
      });
    } catch (e) {
      console.warn('BroadcastChannel not supported or error:', e);
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [roomId, playerRole]);

  // Connect to PeerJS for cross-device P2P
  const connectPeer = (targetPeerId) => {
    if (!peerRef.current) return;
    try {
      const conn = peerRef.current.connect(targetPeerId);
      setupConnection(conn);
    } catch (e) {
      console.error('Peer connect error:', e);
    }
  };

  const setupConnection = (conn) => {
    connRef.current = conn;
    conn.on('open', () => {
      setConnectedPeers(1);
      setNetworkMode('p2p');
      conn.send({
        type: 'PEER_ANNOUNCE',
        payload: { role: playerRole, timestamp: Date.now() }
      });
    });

    conn.on('data', (data) => {
      handleIncomingMessage(data);
    });

    conn.on('close', () => {
      setConnectedPeers(0);
      setNetworkMode('local');
    });
  };

  const handleIncomingMessage = (data) => {
    if (!data || !data.type) return;

    // Latency simulation / calculation
    if (data.payload?.timestamp) {
      const delta = Math.max(8, Math.min(64, Date.now() - data.payload.timestamp));
      setLatency(delta);
    }

    if (data.type === 'PING') {
      const pingObj = {
        id: Math.random().toString(36).substring(2, 9),
        x: data.payload.x,
        y: data.payload.y,
        player: data.payload.player,
        label: data.payload.label,
        timestamp: Date.now()
      };
      setActivePings((prev) => [...prev, pingObj]);
      soundSynth.playPing(data.payload.player === 'p2');
      setTimeout(() => {
        setActivePings((prev) => prev.filter((p) => p.id !== pingObj.id));
      }, 1500);
    }

    // Notify registered event listeners
    eventListenersRef.current.forEach((fn) => fn(data));
  };

  const sendEvent = (type, payload = {}) => {
    const message = {
      type,
      payload: {
        ...payload,
        senderRole: playerRole,
        timestamp: Date.now()
      }
    };

    // 1. BroadcastChannel (local multi-tab)
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(message);
      } catch (e) {
        console.error('BroadcastChannel postMessage error:', e);
      }
    }

    // 2. PeerJS (remote peer)
    if (connRef.current && connRef.current.open) {
      try {
        connRef.current.send(message);
      } catch (e) {
        console.error('Peer send error:', e);
      }
    }
  };

  const addEventListener = (callback) => {
    eventListenersRef.current.push(callback);
    return () => {
      eventListenersRef.current = eventListenersRef.current.filter((fn) => fn !== callback);
    };
  };

  const triggerPing = (e, label = 'RADAR PING') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const pingObj = {
      id: Math.random().toString(36).substring(2, 9),
      x: xPercent,
      y: yPercent,
      player: playerRole === 'p2' ? 'p2' : 'p1',
      label,
      timestamp: Date.now()
    };

    setActivePings((prev) => [...prev, pingObj]);
    soundSynth.playPing(playerRole === 'p2');
    setTimeout(() => {
      setActivePings((prev) => prev.filter((p) => p.id !== pingObj.id));
    }, 1500);

    sendEvent('PING', { x: xPercent, y: yPercent, player: playerRole === 'p2' ? 'p2' : 'p1', label });
  };

  return (
    <NetworkContext.Provider
      value={{
        roomId,
        setRoomId,
        playerRole,
        setPlayerRole,
        connectedPeers,
        latency,
        networkMode,
        activePings,
        triggerPing,
        sendEvent,
        addEventListener,
        connectPeer
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
