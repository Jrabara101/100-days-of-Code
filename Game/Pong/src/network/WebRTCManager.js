import { BinaryProtocol, MSG_TYPE } from './BinaryProtocol';
import { ClockSync } from './ClockSync';

/**
 * WebRTC P2P LAN Transport Layer (UDP-equivalent mode)
 * Configures RTCPeerConnection and RTCDataChannel with:
 * ordered: false, maxRetransmits: 0
 */
export class WebRTCManager {
  constructor(options = {}) {
    this.peerConnection = null;
    this.dataChannel = null;
    this.role = null; // 'HOST' | 'CLIENT' | null
    this.connectionState = 'DISCONNECTED'; // 'DISCONNECTED' | 'GENERATING' | 'AWAITING_ANSWER' | 'CONNECTED' | 'ERROR'
    
    this.clockSync = new ClockSync();
    this.pingInterval = null;

    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onLog = options.onLog || (() => {});
    this.onError = options.onError || (() => {});

    // ICE Servers (Local LAN by default with public fallback)
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  setConnectionState(state) {
    this.connectionState = state;
    this.onStateChange(state, this.role);
  }

  log(msg) {
    this.onLog(`[WebRTC] ${msg}`);
  }

  /**
   * Initializes as Host and creates SDP Offer with zero-retransmit data channel
   */
  async createHostOffer() {
    this.disconnect();
    this.role = 'HOST';
    this.setConnectionState('GENERATING');
    this.log('Initializing PeerConnection as Host...');

    try {
      const pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.peerConnection = pc;

      // Create Unordered, Unreliable (UDP-style) DataChannel
      const dc = pc.createDataChannel('pong-sync', {
        ordered: false,
        maxRetransmits: 0,
      });
      dc.binaryType = 'arraybuffer';
      this.setupDataChannel(dc);
      this.dataChannel = dc;

      // Handle ICE Candidate Gathering
      const offerPromise = new Promise((resolve) => {
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            // Gathering complete
            const sdpString = this.encodeSDP(pc.localDescription);
            this.log('ICE gathering completed. Host offer generated.');
            resolve(sdpString);
          }
        };
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Fallback timeout in case ICE gathering takes too long
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (pc.localDescription) {
            resolve(this.encodeSDP(pc.localDescription));
          }
        }, 1500);
      });

      const offerSDP = await Promise.race([offerPromise, timeoutPromise]);
      this.setConnectionState('AWAITING_ANSWER');
      return offerSDP;
    } catch (err) {
      this.log(`Offer generation failed: ${err.message}`);
      this.setConnectionState('ERROR');
      this.onError(err.message);
      throw err;
    }
  }

  /**
   * Initializes as Client, imports Host Offer, and generates SDP Answer
   */
  async acceptOfferAndCreateAnswer(offerToken) {
    this.disconnect();
    this.role = 'CLIENT';
    this.setConnectionState('GENERATING');
    this.log('Parsing Host offer token...');

    try {
      const offerDesc = this.decodeSDP(offerToken);
      const pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.peerConnection = pc;

      pc.ondatachannel = (e) => {
        this.log('Remote DataChannel received from Host.');
        const dc = e.channel;
        dc.binaryType = 'arraybuffer';
        this.setupDataChannel(dc);
        this.dataChannel = dc;
      };

      const answerPromise = new Promise((resolve) => {
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            const sdpString = this.encodeSDP(pc.localDescription);
            this.log('ICE gathering completed. Client answer generated.');
            resolve(sdpString);
          }
        };
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (pc.localDescription) {
            resolve(this.encodeSDP(pc.localDescription));
          }
        }, 1500);
      });

      const answerSDP = await Promise.race([answerPromise, timeoutPromise]);
      return answerSDP;
    } catch (err) {
      this.log(`Answer creation failed: ${err.message}`);
      this.setConnectionState('ERROR');
      this.onError(err.message);
      throw err;
    }
  }

  /**
   * Host accepts Client Answer token
   */
  async acceptAnswer(answerToken) {
    if (!this.peerConnection) {
      throw new Error('Host PeerConnection not active.');
    }
    this.log('Applying Client answer description...');
    try {
      const answerDesc = this.decodeSDP(answerToken);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerDesc));
      this.log('Remote description applied. Awaiting channel open...');
    } catch (err) {
      this.log(`Accept answer failed: ${err.message}`);
      this.onError(err.message);
      throw err;
    }
  }

  setupDataChannel(dc) {
    dc.onopen = () => {
      this.log('🟢 P2P RTCDataChannel OPEN (Unreliable/Unordered UDP Mode)');
      this.setConnectionState('CONNECTED');
      this.startPingLoop();
    };

    dc.onclose = () => {
      this.log('🔴 RTCDataChannel Closed');
      this.setConnectionState('DISCONNECTED');
      this.stopPingLoop();
    };

    dc.onerror = (err) => {
      this.log(`⚠️ DataChannel error: ${err.message || err}`);
    };

    dc.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        this.clockSync.recordPacketReceived(e.data.byteLength);
        const msg = BinaryProtocol.decode(e.data);
        if (!msg) return;

        // Internal Network handling for Ping/Pong
        if (msg.type === 'PING' && this.role === 'HOST') {
          // Echo back Pong with host timestamp
          const pongBuffer = BinaryProtocol.encodePong(msg.originTimestamp, performance.now());
          this.sendRaw(pongBuffer);
        } else if (msg.type === 'PONG' && this.role === 'CLIENT') {
          this.clockSync.processPong(msg.originTimestamp, msg.hostTimestamp, performance.now());
        }

        // Forward decoded message to game hook
        this.onMessage(msg, e.data);
      }
    };
  }

  startPingLoop() {
    this.stopPingLoop();
    // Client sends periodic NTP ping packets every 500ms
    if (this.role === 'CLIENT') {
      this.pingInterval = setInterval(() => {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          const pingBuffer = BinaryProtocol.encodePing(performance.now());
          this.sendRaw(pingBuffer);
        }
      }, 500);
    }
  }

  stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendRaw(arrayBuffer) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(arrayBuffer);
        this.clockSync.recordPacketSent(arrayBuffer.byteLength);
      } catch (err) {
        // Unreliable packets can be dropped on buffer saturation
      }
    }
  }

  encodeSDP(sessionDescription) {
    try {
      const json = JSON.stringify(sessionDescription);
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      return btoa(JSON.stringify(sessionDescription));
    }
  }

  decodeSDP(token) {
    try {
      const json = decodeURIComponent(escape(atob(token.trim())));
      return JSON.parse(json);
    } catch (e) {
      return JSON.parse(atob(token.trim()));
    }
  }

  disconnect() {
    this.stopPingLoop();
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (e) {}
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch (e) {}
      this.peerConnection = null;
    }
    this.role = null;
    this.clockSync.reset();
    this.setConnectionState('DISCONNECTED');
  }
}
