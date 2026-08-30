/**
 * Compact Binary Protocol for 60 Hz WebRTC RTCDataChannel (UDP Mode)
 * Uses Float32Array to achieve zero-allocation and zero JSON serialization overhead.
 */

export const MSG_TYPE = {
  INPUT: 1.0,
  SNAPSHOT: 2.0,
  PING: 3.0,
  PONG: 4.0,
  EVENT: 5.0,
  RESET: 6.0,
};

export const EVENT_CODE = {
  PADDLE_HIT: 1.0,
  WALL_HIT: 2.0,
  SCORE: 3.0,
  GAME_OVER: 4.0,
};

export class BinaryProtocol {
  // Pre-allocated buffers to minimize GC churn
  static inputBuffer = new Float32Array(4);
  static snapshotBuffer = new Float32Array(12);
  static pingBuffer = new Float32Array(2);
  static pongBuffer = new Float32Array(3);
  static eventBuffer = new Float32Array(4);

  /**
   * Encodes client vertical input
   * [MSG_TYPE.INPUT, inputVector, seqNumber, clientTimestamp] -> 16 bytes
   */
  static encodeInput(inputVector, seq = 0, timestamp = performance.now()) {
    this.inputBuffer[0] = MSG_TYPE.INPUT;
    this.inputBuffer[1] = inputVector;
    this.inputBuffer[2] = seq;
    this.inputBuffer[3] = timestamp;
    return this.inputBuffer.buffer;
  }

  /**
   * Encodes authoritative server state snapshot
   * [MSG_TYPE.SNAPSHOT, ballX, ballY, ballVx, ballVy, p1Y, p2Y, score1, score2, stateCode, rallyCount, timestamp] -> 48 bytes
   */
  static encodeSnapshot(engine, timestamp = performance.now()) {
    let stateCode = 0.0;
    if (engine.state === 'PLAYING') stateCode = 1.0;
    else if (engine.state === 'POINT_PAUSE') stateCode = 2.0;
    else if (engine.state === 'GAME_OVER') stateCode = 3.0;

    this.snapshotBuffer[0] = MSG_TYPE.SNAPSHOT;
    this.snapshotBuffer[1] = engine.ballX;
    this.snapshotBuffer[2] = engine.ballY;
    this.snapshotBuffer[3] = engine.ballVx;
    this.snapshotBuffer[4] = engine.ballVy;
    this.snapshotBuffer[5] = engine.p1Y;
    this.snapshotBuffer[6] = engine.p2Y;
    this.snapshotBuffer[7] = engine.score1;
    this.snapshotBuffer[8] = engine.score2;
    this.snapshotBuffer[9] = stateCode;
    this.snapshotBuffer[10] = engine.rallyCount;
    this.snapshotBuffer[11] = timestamp;
    return this.snapshotBuffer.buffer;
  }

  /**
   * Encodes Ping probe [MSG_TYPE.PING, originTimestamp] -> 8 bytes
   */
  static encodePing(originTimestamp = performance.now()) {
    this.pingBuffer[0] = MSG_TYPE.PING;
    this.pingBuffer[1] = originTimestamp;
    return this.pingBuffer.buffer;
  }

  /**
   * Encodes Pong response [MSG_TYPE.PONG, originTimestamp, hostTimestamp] -> 12 bytes
   */
  static encodePong(originTimestamp, hostTimestamp = performance.now()) {
    this.pongBuffer[0] = MSG_TYPE.PONG;
    this.pongBuffer[1] = originTimestamp;
    this.pongBuffer[2] = hostTimestamp;
    return this.pongBuffer.buffer;
  }

  /**
   * Encodes Audio/Gameplay Event
   */
  static encodeEvent(eventCode, param1 = 0, param2 = 0) {
    this.eventBuffer[0] = MSG_TYPE.EVENT;
    this.eventBuffer[1] = eventCode;
    this.eventBuffer[2] = param1;
    this.eventBuffer[3] = param2;
    return this.eventBuffer.buffer;
  }

  /**
   * Decodes incoming ArrayBuffer packet into a parsed message object
   */
  static decode(arrayBuffer) {
    const view = new Float32Array(arrayBuffer);
    const type = view[0];

    switch (type) {
      case MSG_TYPE.INPUT:
        return {
          type: 'INPUT',
          inputVector: view[1],
          seq: view[2],
          timestamp: view[3],
        };

      case MSG_TYPE.SNAPSHOT:
        return {
          type: 'SNAPSHOT',
          ballX: view[1],
          ballY: view[2],
          ballVx: view[3],
          ballVy: view[4],
          p1Y: view[5],
          p2Y: view[6],
          score1: Math.round(view[7]),
          score2: Math.round(view[8]),
          state: view[9] === 1.0 ? 'PLAYING' : view[9] === 2.0 ? 'POINT_PAUSE' : view[9] === 3.0 ? 'GAME_OVER' : 'READY',
          rallyCount: Math.round(view[10]),
          timestamp: view[11],
        };

      case MSG_TYPE.PING:
        return {
          type: 'PING',
          originTimestamp: view[1],
        };

      case MSG_TYPE.PONG:
        return {
          type: 'PONG',
          originTimestamp: view[1],
          hostTimestamp: view[2],
        };

      case MSG_TYPE.EVENT:
        return {
          type: 'EVENT',
          eventCode: view[1],
          param1: view[2],
          param2: view[3],
        };

      case MSG_TYPE.RESET:
        return {
          type: 'RESET',
        };

      default:
        return null;
    }
  }
}
