/**
 * Multi-Tab / P2P Sync Bus using standard BroadcastChannel API
 * Enables zero-setup real-time synchronization between separate browser tabs/windows.
 */

export class PeerSyncBus {
  constructor(channelName = 'cyber-ttt-channel', tabId = null) {
    this.channelName = channelName;
    this.tabId = tabId || 'tab_' + Math.random().toString(36).substring(2, 9);
    this.channel = null;
    this.listeners = new Set();
    this.sequenceNum = 0;
    this.isConnected = false;
    this.peersCount = 1;

    this.init();
  }

  init() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.warn('BroadcastChannel not supported in this environment.');
      return;
    }

    try {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => this.handleIncoming(event.data);
      this.isConnected = true;

      // Announce arrival to other tabs
      this.broadcast({
        type: 'PEER_ANNOUNCE',
        tabId: this.tabId,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to initialize BroadcastChannel:', err);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in PeerSync listener:', err);
      }
    }
  }

  broadcast(payload) {
    if (!this.channel) return;
    this.sequenceNum++;
    const packet = {
      ...payload,
      senderTabId: this.tabId,
      seq: this.sequenceNum,
      sentAt: Date.now(),
    };

    try {
      this.channel.postMessage(packet);
    } catch (err) {
      console.error('Failed to post message to BroadcastChannel:', err);
    }
  }

  handleIncoming(packet) {
    if (!packet || packet.senderTabId === this.tabId) {
      // Ignore self-broadcasts
      return;
    }

    if (packet.type === 'PEER_ANNOUNCE') {
      this.peersCount++;
      // Acknowledge new peer
      this.broadcast({
        type: 'PEER_ACK',
        tabId: this.tabId,
        timestamp: Date.now(),
      });
      this.notify({ type: 'PEER_CONNECTED', peerId: packet.senderTabId });
      return;
    }

    if (packet.type === 'PEER_ACK') {
      this.peersCount++;
      this.notify({ type: 'PEER_CONNECTED', peerId: packet.senderTabId });
      return;
    }

    this.notify(packet);
  }

  sendMove(cellIndex, playerRole) {
    this.broadcast({
      type: 'SYNC_MOVE',
      cellIndex,
      playerRole,
    });
  }

  sendReset() {
    this.broadcast({
      type: 'SYNC_RESET',
    });
  }

  destroy() {
    if (this.channel) {
      try {
        this.channel.close();
      } catch (e) {}
      this.channel = null;
    }
    this.listeners.clear();
  }
}
