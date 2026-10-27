import { MultiplayerClient } from './MultiplayerClient';

export interface VoicePeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  analyser?: AnalyserNode;
  isSpeaking: boolean;
  peerId: string;
}

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'muted' | 'error' | 'denied';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class VoiceChatManager {
  private client: MultiplayerClient;
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private peers: Map<string, VoicePeerConnection> = new Map();

  // Settings
  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private isPushToTalk: boolean = false;
  private isPushKeyDown: boolean = false;
  private status: VoiceStatus = 'idle';
  private errorMessage: string | null = null;

  // Speaking state detection
  private speakingThreshold = 0.05;
  private myVolumeLevel = 0;
  private isSpeaking = false;
  private meterInterval: number | null = null;

  // Callbacks
  public onStatusChange?: (status: VoiceStatus, error?: string | null) => void;
  public onVolumeMeter?: (level: number, isSpeaking: boolean) => void;
  public onPeerSpeaking?: (peerId: string, isSpeaking: boolean) => void;

  constructor(client: MultiplayerClient) {
    this.client = client;
    this.setupSignaling();
    this.setupPushToTalkListeners();
  }

  private setupSignaling() {
    this.client.onVoiceSignal = async (fromPeerId, _fromPeerName, signal) => {
      try {
        if (signal.type === 'offer') {
          await this.handleOffer(fromPeerId, signal.sdp);
        } else if (signal.type === 'answer') {
          await this.handleAnswer(fromPeerId, signal.sdp);
        } else if (signal.type === 'candidate' && signal.candidate) {
          await this.handleCandidate(fromPeerId, signal.candidate);
        }
      } catch (e) {
        console.warn('Voice signaling error:', e);
      }
    };
  }

  private setupPushToTalkListeners() {
    window.addEventListener('keydown', (e) => {
      // Space or 'T' key for push-to-talk when input not focused
      if (
        this.isPushToTalk &&
        (e.code === 'KeyT' || (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT'))
      ) {
        if (!this.isPushKeyDown) {
          this.isPushKeyDown = true;
          this.applyTrackMute();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (
        this.isPushToTalk &&
        (e.code === 'KeyT' || e.code === 'Space')
      ) {
        if (this.isPushKeyDown) {
          this.isPushKeyDown = false;
          this.applyTrackMute();
        }
      }
    });
  }

  /**
   * Request microphone and initialize voice chat in room
   */
  public async joinVoice(targetPeers: string[] = []): Promise<boolean> {
    try {
      this.status = 'connecting';
      this.onStatusChange?.(this.status);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.status = 'error';
        this.errorMessage = 'MediaDevices API not supported in this browser.';
        this.onStatusChange?.(this.status, this.errorMessage);
        return false;
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.initLocalAudioMeter();
      this.status = 'connected';
      this.onStatusChange?.(this.status);

      // Connect to other peers in room
      for (const peerId of targetPeers) {
        if (peerId !== this.client.getMyPeerId()) {
          this.initiateCall(peerId);
        }
      }

      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.status = 'denied';
        this.errorMessage = 'Microphone permission denied. You can still listen and play!';
      } else {
        this.status = 'error';
        this.errorMessage = err.message || 'Microphone error.';
      }
      this.onStatusChange?.(this.status, this.errorMessage);
      return false;
    }
  }

  private initLocalAudioMeter() {
    if (!this.localStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.localStream);
      this.localAnalyser = this.audioCtx.createAnalyser();
      this.localAnalyser.fftSize = 256;
      source.connect(this.localAnalyser);

      const buffer = new Uint8Array(this.localAnalyser.frequencyBinCount);

      if (this.meterInterval) clearInterval(this.meterInterval);
      this.meterInterval = window.setInterval(() => {
        if (!this.localAnalyser || this.isMuted) {
          this.myVolumeLevel = 0;
          this.isSpeaking = false;
          this.onVolumeMeter?.(0, false);
          return;
        }

        this.localAnalyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length / 255;
        this.myVolumeLevel = avg;
        const speakingNow = avg > this.speakingThreshold;
        if (speakingNow !== this.isSpeaking) {
          this.isSpeaking = speakingNow;
        }
        this.onVolumeMeter?.(avg, speakingNow);
      }, 80);
    } catch (e) {
      console.warn('Audio meter init error:', e);
    }
  }

  public initiateCall(targetPeerId: string) {
    if (this.peers.has(targetPeerId)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const audioEl = new Audio();
    audioEl.autoplay = true;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.client.sendVoiceSignal(targetPeerId, {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
    };

    this.peers.set(targetPeerId, {
      pc,
      audioEl,
      isSpeaking: false,
      peerId: targetPeerId,
    });

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        this.client.sendVoiceSignal(targetPeerId, {
          type: 'offer',
          sdp: pc.localDescription,
        });
      })
      .catch((e) => console.warn('Create offer error:', e));
  }

  private async handleOffer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    let peerObj = this.peers.get(fromPeerId);
    if (!peerObj) {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const audioEl = new Audio();
      audioEl.autoplay = true;

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.client.sendVoiceSignal(fromPeerId, {
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      peerObj = { pc, audioEl, isSpeaking: false, peerId: fromPeerId };
      this.peers.set(fromPeerId, peerObj);
    }

    await peerObj.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peerObj.pc.createAnswer();
    await peerObj.pc.setLocalDescription(answer);

    this.client.sendVoiceSignal(fromPeerId, {
      type: 'answer',
      sdp: peerObj.pc.localDescription,
    });
  }

  private async handleAnswer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    const peerObj = this.peers.get(fromPeerId);
    if (peerObj && peerObj.pc.signalingState !== 'stable') {
      await peerObj.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    const peerObj = this.peers.get(fromPeerId);
    if (peerObj) {
      await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  public removePeer(peerId: string) {
    const peerObj = this.peers.get(peerId);
    if (peerObj) {
      peerObj.pc.close();
      peerObj.audioEl.srcObject = null;
      this.peers.delete(peerId);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.applyTrackMute();
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.applyTrackMute();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    for (const p of this.peers.values()) {
      p.audioEl.muted = this.isDeafened;
    }
    return this.isDeafened;
  }

  public getDeafened(): boolean {
    return this.isDeafened;
  }

  public setPushToTalk(enabled: boolean) {
    this.isPushToTalk = enabled;
    this.applyTrackMute();
  }

  public getPushToTalk(): boolean {
    return this.isPushToTalk;
  }

  private applyTrackMute() {
    if (!this.localStream) return;
    const shouldMute = this.isMuted || (this.isPushToTalk && !this.isPushKeyDown);
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !shouldMute;
    });
  }

  public leaveVoice() {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    for (const p of this.peers.values()) {
      p.pc.close();
      p.audioEl.srcObject = null;
    }
    this.peers.clear();
    this.status = 'idle';
    this.onStatusChange?.(this.status);
  }

  public getStatus(): VoiceStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }
}
