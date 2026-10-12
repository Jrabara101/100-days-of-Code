import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Ensure Pusher is accessible globally for Laravel Echo
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

class EchoService {
  constructor() {
    this.echoInstance = null;
    this.config = {
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY || '',
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
      wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
      wsPort: import.meta.env.VITE_PUSHER_PORT || undefined,
      wssPort: import.meta.env.VITE_PUSHER_PORT || undefined,
      forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
      authEndpoint: import.meta.env.VITE_BROADCAST_AUTH_URL || '/broadcasting/auth',
      bearerToken: import.meta.env.VITE_AUTH_TOKEN || '',
      enableMockEngine: true, // Defaults to simulated engine if no active Pusher key
    };

    this.connectionState = 'connected'; // 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
    this.stateListeners = new Set();
    this.simulatedSubscribers = new Map(); // channelName -> Set of callback maps

    this.init();
  }

  init(customConfig = {}) {
    this.config = { ...this.config, ...customConfig };

    // If a valid key is provided, attempt to instantiate real Laravel Echo + Pusher
    if (this.config.key && this.config.key.trim().length > 0) {
      try {
        this.echoInstance = new Echo({
          broadcaster: 'pusher',
          key: this.config.key,
          cluster: this.config.cluster,
          wsHost: this.config.wsHost,
          wsPort: this.config.wsPort,
          wssPort: this.config.wssPort,
          forceTLS: this.config.forceTLS,
          authEndpoint: this.config.authEndpoint,
          auth: {
            headers: {
              Authorization: `Bearer ${this.config.bearerToken}`,
              Accept: 'application/json',
            },
          },
          enabledTransports: ['ws', 'wss'],
        });

        // Listen to Pusher connection states
        if (this.echoInstance.connector?.pusher?.connection) {
          const connection = this.echoInstance.connector.pusher.connection;
          connection.bind('state_change', (states) => {
            this.setConnectionState(states.current);
          });
        }
        this.config.enableMockEngine = false;
        console.log('[Laravel Echo] Initialized with Pusher broadcaster:', this.config.cluster);
        return;
      } catch (err) {
        console.warn('[Laravel Echo] Real connection failed, falling back to mock engine:', err);
      }
    }

    // Default or fallback mock engine
    this.echoInstance = null;
    this.config.enableMockEngine = true;
  }

  setConnectionState(newState) {
    this.connectionState = newState;
    this.stateListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (e) {
        console.error(e);
      }
    });
  }

  onConnectionStateChange(listener) {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  isRealConnected() {
    return !this.config.enableMockEngine && this.echoInstance !== null;
  }

  /**
   * Subscribe to a private chat channel: private-chat.{conversationId}
   */
  privateChatChannel(conversationId) {
    const channelName = `chat.${conversationId}`;
    if (this.echoInstance && !this.config.enableMockEngine) {
      return this.echoInstance.private(channelName);
    }
    return this.createMockChannel(`private-${channelName}`);
  }

  /**
   * Subscribe to a presence channel: presence-chat.{conversationId}
   */
  presenceChatChannel(conversationId) {
    const channelName = `chat.${conversationId}`;
    if (this.echoInstance && !this.config.enableMockEngine) {
      return this.echoInstance.join(channelName);
    }
    return this.createMockPresenceChannel(`presence-${channelName}`);
  }

  /**
   * Mock Channel Implementation for offline / simulation / demonstration mode
   */
  createMockChannel(fullChannelName) {
    if (!this.simulatedSubscribers.has(fullChannelName)) {
      this.simulatedSubscribers.set(fullChannelName, {
        listeners: new Map(),
        whispers: new Map(),
      });
    }
    const store = this.simulatedSubscribers.get(fullChannelName);

    const channelObj = {
      listen: (event, callback) => {
        if (!store.listeners.has(event)) {
          store.listeners.set(event, new Set());
        }
        store.listeners.get(event).add(callback);
        return channelObj;
      },
      stopListening: (event, callback) => {
        if (store.listeners.has(event)) {
          store.listeners.get(event).delete(callback);
        }
        return channelObj;
      },
      whisper: (eventName, data) => {
        // Broadcast to listeners on this channel after 50ms
        setTimeout(() => {
          if (store.whispers.has(eventName)) {
            store.whispers.get(eventName).forEach((cb) => cb(data));
          }
        }, 50);
        return channelObj;
      },
      listenForWhisper: (eventName, callback) => {
        if (!store.whispers.has(eventName)) {
          store.whispers.set(eventName, new Set());
        }
        store.whispers.get(eventName).add(callback);
        return channelObj;
      },
      stopListeningForWhisper: (eventName, callback) => {
        if (store.whispers.has(eventName)) {
          store.whispers.get(eventName).delete(callback);
        }
        return channelObj;
      },
    };

    return channelObj;
  }

  /**
   * Mock Presence Channel Implementation
   */
  createMockPresenceChannel(fullChannelName) {
    const base = this.createMockChannel(fullChannelName);
    const presenceHandlers = {
      hereCallbacks: new Set(),
      joiningCallbacks: new Set(),
      leavingCallbacks: new Set(),
    };

    const presenceObj = {
      ...base,
      here: (callback) => {
        presenceHandlers.hereCallbacks.add(callback);
        return presenceObj;
      },
      joining: (callback) => {
        presenceHandlers.joiningCallbacks.add(callback);
        return presenceObj;
      },
      leaving: (callback) => {
        presenceHandlers.leavingCallbacks.add(callback);
        return presenceObj;
      },
      // Trigger simulation helpers
      _triggerHere: (users) => {
        presenceHandlers.hereCallbacks.forEach((cb) => cb(users));
      },
      _triggerJoining: (user) => {
        presenceHandlers.joiningCallbacks.forEach((cb) => cb(user));
      },
      _triggerLeaving: (user) => {
        presenceHandlers.leavingCallbacks.forEach((cb) => cb(user));
      },
    };

    return presenceObj;
  }

  /**
   * Helper to dispatch mock broadcast events across the simulated channel
   */
  dispatchSimulatedEvent(channelName, eventName, payload) {
    const store = this.simulatedSubscribers.get(channelName);
    if (store && store.listeners.has(eventName)) {
      store.listeners.get(eventName).forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  dispatchSimulatedWhisper(channelName, whisperName, payload) {
    const store = this.simulatedSubscribers.get(channelName);
    if (store && store.whispers.has(whisperName)) {
      store.whispers.get(whisperName).forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }
}

export const echoService = new EchoService();
