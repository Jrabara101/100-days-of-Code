import { WebSocket } from 'ws';
import { getMonotonicTimeMs, getAuthoritativeUtcMs } from './clockSync.js';
import { DEFAULT_TEMPLATES } from './templates.js';
// Minimum human-possible segment duration in milliseconds (anti-cheat threshold)
const MIN_HUMAN_SEGMENT_MS = 350;
export class RoomManager {
    rooms = new Map();
    roomConnections = new Map();
    completedMatches = [];
    countdownIntervals = new Map();
    ghostIntervals = new Map();
    constructor() {
        // Generate a default demo room for instant access
        this.createInitialDemoRoom();
    }
    createInitialDemoRoom() {
        const template = DEFAULT_TEMPLATES[0]; // Apex Cyber-Runner
        const roomCode = 'NX9Q';
        const roomId = 'room-' + roomCode.toLowerCase();
        const initialHost = {
            playerId: 'runner-kronos',
            username: 'KRONOS_99',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kronos',
            isReady: true,
            hasFinished: false,
            currentSplitIndex: 0,
            completedSplits: [],
            currentRunTimeMs: 0,
            isHost: true,
            currentVelocity: 942,
            currentApm: 420,
        };
        const initialRival = {
            playerId: 'runner-vex',
            username: 'VEX_PULSE',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=VexPulse',
            isReady: true,
            hasFinished: false,
            currentSplitIndex: 0,
            completedSplits: [],
            currentRunTimeMs: 0,
            isHost: false,
            currentVelocity: 910,
            currentApm: 398,
        };
        const state = {
            roomId,
            roomCode,
            hostPlayerId: initialHost.playerId,
            gameTitle: template.gameTitle,
            categoryName: template.categoryName,
            status: 'LOBBY',
            countdownRemainingMs: 3000,
            serverStartTimestamp: 0,
            segments: JSON.parse(JSON.stringify(template.segments)),
            participants: [initialHost, initialRival],
        };
        this.rooms.set(roomId, state);
        this.roomConnections.set(roomId, new Set());
    }
    // Generate unique 4-character room code
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // ensure unique
        for (const room of this.rooms.values()) {
            if (room.roomCode === code)
                return this.generateRoomCode();
        }
        return code;
    }
    createRoom(gameTitle, categoryName, segments, username, avatarUrl) {
        const roomCode = this.generateRoomCode();
        const roomId = 'room-' + roomCode.toLowerCase();
        const hostPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
        const defaultSegs = segments && segments.length > 0
            ? segments
            : DEFAULT_TEMPLATES[0].segments;
        const host = {
            playerId: hostPlayerId,
            username: username || 'Runner 1',
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${hostPlayerId}`,
            isReady: true,
            hasFinished: false,
            currentSplitIndex: 0,
            completedSplits: [],
            currentRunTimeMs: 0,
            isHost: true,
            currentVelocity: 850,
            currentApm: 340,
        };
        const state = {
            roomId,
            roomCode,
            hostPlayerId,
            gameTitle: gameTitle || 'Apex Cyber-Runner',
            categoryName: categoryName || 'Any% Glitchless',
            status: 'LOBBY',
            countdownRemainingMs: 3000,
            serverStartTimestamp: 0,
            segments: JSON.parse(JSON.stringify(defaultSegs)),
            participants: [host],
        };
        this.rooms.set(roomId, state);
        this.roomConnections.set(roomId, new Set());
        return { room: state, hostPlayerId };
    }
    getRoomByCode(roomCode) {
        const code = roomCode.trim().toUpperCase();
        for (const room of this.rooms.values()) {
            if (room.roomCode === code)
                return room;
        }
        return undefined;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    registerConnection(roomId, playerId, ws) {
        let conns = this.roomConnections.get(roomId);
        if (!conns) {
            conns = new Set();
            this.roomConnections.set(roomId, conns);
        }
        conns.add({ ws, playerId });
    }
    removeConnection(ws) {
        for (const [roomId, conns] of this.roomConnections.entries()) {
            for (const conn of conns) {
                if (conn.ws === ws) {
                    conns.delete(conn);
                    break;
                }
            }
        }
    }
    joinRoom(roomCode, username, avatarUrl) {
        const room = this.getRoomByCode(roomCode);
        if (!room) {
            return { error: `Room "${roomCode}" not found. Verify room PIN.` };
        }
        const playerId = 'p-' + Math.random().toString(36).substring(2, 9);
        const newParticipant = {
            playerId,
            username: username || `Rival_${Math.floor(Math.random() * 900 + 100)}`,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${playerId}`,
            isReady: false,
            hasFinished: false,
            currentSplitIndex: 0,
            completedSplits: [],
            currentRunTimeMs: 0,
            isHost: false,
            currentVelocity: 820,
            currentApm: 320,
        };
        room.participants.push(newParticipant);
        this.broadcastToRoom(room.roomId, {
            type: 'ROOM_UPDATE',
            state: room,
        });
        return { room, playerId };
    }
    toggleReady(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        const participant = room.participants.find(p => p.playerId === playerId);
        if (participant) {
            participant.isReady = !participant.isReady;
            this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        }
        return room;
    }
    changeCategory(roomId, playerId, templateId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        if (room.hostPlayerId !== playerId)
            return undefined; // only host can change category
        if (room.status !== 'LOBBY')
            return undefined;
        const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            room.gameTitle = template.gameTitle;
            room.categoryName = template.categoryName;
            room.segments = JSON.parse(JSON.stringify(template.segments));
            this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        }
        return room;
    }
    addGhostRunner(roomId, ghostType) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        const ghostId = `ghost-${ghostType.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;
        let username = 'World Record Ghost';
        let avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=WRGhost';
        if (ghostType === 'PB') {
            username = 'Personal Best (Ghost)';
            avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=PBGhost';
        }
        else if (ghostType === 'DEV_TARGET') {
            username = 'Target Pace (Pacer)';
            avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=TargetPacer';
        }
        // Compute cumulative target split times
        let cum = 0;
        const paceCurve = [];
        for (const seg of room.segments) {
            const dur = ghostType === 'WR'
                ? (seg.goldSegmentDurationMs ?? seg.targetDurationMs ?? 60000)
                : (seg.targetDurationMs ?? 60000);
            cum += dur;
            paceCurve.push(cum);
        }
        const ghost = {
            playerId: ghostId,
            username,
            avatarUrl,
            isReady: true,
            hasFinished: false,
            currentSplitIndex: 0,
            completedSplits: [],
            currentRunTimeMs: 0,
            isHost: false,
            isGhost: true,
            ghostPaceCurve: paceCurve,
            currentVelocity: 950,
            currentApm: 430,
        };
        room.participants.push(ghost);
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        return room;
    }
    removeGhost(roomId, ghostId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        room.participants = room.participants.filter(p => p.playerId !== ghostId);
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        return room;
    }
    startCountdown(roomId, hostPlayerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        if (room.hostPlayerId !== hostPlayerId)
            return false;
        if (room.status !== 'LOBBY' && room.status !== 'RACE_FINISHED')
            return false;
        // Reset runners state
        for (const p of room.participants) {
            p.hasFinished = false;
            p.currentSplitIndex = 0;
            p.completedSplits = [];
            p.currentRunTimeMs = 0;
            p.finalTimeMs = undefined;
        }
        room.status = 'STARTING_COUNTDOWN';
        const countdownDurationMs = 3000;
        const nowMono = getMonotonicTimeMs();
        const serverStartTimestamp = nowMono + countdownDurationMs;
        room.serverStartTimestamp = serverStartTimestamp;
        room.countdownRemainingMs = countdownDurationMs;
        this.broadcastToRoom(roomId, {
            type: 'COUNTDOWN_TICK',
            remainingMs: countdownDurationMs,
            serverStartTimestamp,
        });
        let remaining = countdownDurationMs;
        const interval = setInterval(() => {
            remaining -= 500;
            room.countdownRemainingMs = Math.max(0, remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                this.countdownIntervals.delete(roomId);
                this.startRace(roomId, serverStartTimestamp);
            }
            else {
                this.broadcastToRoom(roomId, {
                    type: 'COUNTDOWN_TICK',
                    remainingMs: remaining,
                    serverStartTimestamp,
                });
            }
        }, 500);
        this.countdownIntervals.set(roomId, interval);
        return true;
    }
    startRace(roomId, authoritativeStartTimestamp) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.status = 'RACING';
        room.serverStartTimestamp = authoritativeStartTimestamp;
        room.startedAtUtc = getAuthoritativeUtcMs();
        this.broadcastToRoom(roomId, {
            type: 'RACE_STARTED',
            serverStartTimestamp: authoritativeStartTimestamp,
        });
        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            state: room,
        });
        // Start Ghost runners simulation if any
        this.startGhostSimulators(roomId);
    }
    startGhostSimulators(roomId) {
        const existing = this.ghostIntervals.get(roomId);
        if (existing)
            clearInterval(existing);
        const ghostInterval = setInterval(() => {
            const room = this.rooms.get(roomId);
            if (!room || room.status !== 'RACING') {
                clearInterval(ghostInterval);
                this.ghostIntervals.delete(roomId);
                return;
            }
            const elapsed = getMonotonicTimeMs() - room.serverStartTimestamp;
            if (elapsed <= 0)
                return;
            const ghosts = room.participants.filter(p => p.isGhost && !p.hasFinished);
            if (ghosts.length === 0) {
                clearInterval(ghostInterval);
                this.ghostIntervals.delete(roomId);
                return;
            }
            for (const ghost of ghosts) {
                ghost.currentRunTimeMs = elapsed;
                if (!ghost.ghostPaceCurve)
                    continue;
                const targetSplitIdx = ghost.currentSplitIndex;
                if (targetSplitIdx < ghost.ghostPaceCurve.length) {
                    const targetSplitTime = ghost.ghostPaceCurve[targetSplitIdx];
                    if (elapsed >= targetSplitTime) {
                        // Trigger authoritative split for ghost
                        this.submitSplit(roomId, ghost.playerId, targetSplitIdx, elapsed);
                    }
                }
            }
        }, 100);
        this.ghostIntervals.set(roomId, ghostInterval);
    }
    /**
     * Authoritative Split Ingestion & Anti-Cheat Validation
     */
    submitSplit(roomId, playerId, splitIndex, elapsedClientMs) {
        const room = this.rooms.get(roomId);
        if (!room)
            return { success: false, error: 'Room not found' };
        if (room.status !== 'RACING')
            return { success: false, error: 'Race is not in progress' };
        const participant = room.participants.find(p => p.playerId === playerId);
        if (!participant)
            return { success: false, error: 'Participant not in race' };
        if (participant.hasFinished)
            return { success: false, error: 'Participant already finished' };
        // 1. Order consistency check
        if (splitIndex !== participant.currentSplitIndex) {
            return {
                success: false,
                error: `Invalid split order. Expected split ${participant.currentSplitIndex}, received ${splitIndex}`
            };
        }
        if (splitIndex >= room.segments.length) {
            return { success: false, error: 'Split index out of range' };
        }
        // 2. Authoritative Monotonic Elapsed Time
        const nowMono = getMonotonicTimeMs();
        const authoritativeElapsedMs = Math.max(10, Math.round(nowMono - room.serverStartTimestamp));
        // 3. Human Sanity Minimum Check
        const prevSplit = participant.completedSplits[participant.completedSplits.length - 1];
        const prevSplitElapsed = prevSplit ? prevSplit.completedAtMs : 0;
        const segmentDurationMs = authoritativeElapsedMs - prevSplitElapsed;
        if (segmentDurationMs < MIN_HUMAN_SEGMENT_MS && !participant.isGhost) {
            return {
                success: false,
                error: `Anti-cheat rejection: Segment duration (${segmentDurationMs}ms) below minimum human sanity threshold (${MIN_HUMAN_SEGMENT_MS}ms)`,
            };
        }
        // 4. Gold Split Check (faster than segment all-time best)
        const segmentDef = room.segments[splitIndex];
        const isGold = segmentDef.goldSegmentDurationMs != null
            ? segmentDurationMs < segmentDef.goldSegmentDurationMs
            : false;
        if (isGold && !participant.isGhost) {
            // Update new gold record for the segment
            segmentDef.goldSegmentDurationMs = segmentDurationMs;
        }
        // 5. Delta vs Leader Calculation
        // Find leader at this split index
        let leaderElapsedAtSplit = authoritativeElapsedMs;
        for (const other of room.participants) {
            const otherSplit = other.completedSplits.find(s => s.splitIndex === splitIndex);
            if (otherSplit && otherSplit.completedAtMs < leaderElapsedAtSplit) {
                leaderElapsedAtSplit = otherSplit.completedAtMs;
            }
        }
        const deltaVsLeaderMs = authoritativeElapsedMs - leaderElapsedAtSplit;
        // Delta vs Personal Best
        const deltaVsPbMs = segmentDef.personalBestSplitMs != null
            ? authoritativeElapsedMs - segmentDef.personalBestSplitMs
            : undefined;
        // 6. Record Authoritative Record
        const record = {
            splitIndex,
            completedAtMs: authoritativeElapsedMs,
            segmentDurationMs,
            isGold,
            deltaVsLeaderMs,
            deltaVsPbMs,
        };
        participant.completedSplits.push(record);
        participant.currentSplitIndex += 1;
        participant.currentRunTimeMs = authoritativeElapsedMs;
        // 7. Check if final split
        const isFinished = participant.currentSplitIndex >= room.segments.length;
        if (isFinished) {
            participant.hasFinished = true;
            participant.finalTimeMs = authoritativeElapsedMs;
        }
        // Broadcast split record packet to all participants
        this.broadcastToRoom(roomId, {
            type: 'SPLIT_RECORDED',
            playerId,
            splitRecord: record,
            nextSplitIndex: participant.currentSplitIndex,
            hasFinished: isFinished,
            finalTimeMs: isFinished ? authoritativeElapsedMs : undefined,
            isGold,
            surgeAlert: isGold || (deltaVsPbMs != null && deltaVsPbMs < -1000),
        });
        // Surge alert broadcast if gold
        if (isGold) {
            this.broadcastToRoom(roomId, {
                type: 'SURGE_ALERT',
                playerId,
                username: participant.username,
                message: `GOLD SPLIT! ${segmentDef.name} crushed by ${participant.username}!`,
                isGold: true,
                splitIndex,
            });
        }
        // 8. Check if all human racers have finished
        const allHumans = room.participants.filter(p => !p.isGhost);
        const allFinished = allHumans.every(p => p.hasFinished);
        if (allFinished) {
            room.status = 'RACE_FINISHED';
            room.finishedAtUtc = getAuthoritativeUtcMs();
            this.recordMatchScorecard(room);
        }
        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            state: room,
        });
        return { success: true };
    }
    undoSplit(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'RACING')
            return false;
        const participant = room.participants.find(p => p.playerId === playerId);
        if (!participant || participant.completedSplits.length === 0)
            return false;
        participant.completedSplits.pop();
        participant.currentSplitIndex = Math.max(0, participant.currentSplitIndex - 1);
        participant.hasFinished = false;
        participant.finalTimeMs = undefined;
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        return true;
    }
    skipSplit(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'RACING')
            return false;
        const participant = room.participants.find(p => p.playerId === playerId);
        if (!participant || participant.hasFinished)
            return false;
        participant.currentSplitIndex += 1;
        if (participant.currentSplitIndex >= room.segments.length) {
            participant.hasFinished = true;
            const nowMono = getMonotonicTimeMs();
            participant.finalTimeMs = Math.round(nowMono - room.serverStartTimestamp);
        }
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        return true;
    }
    resetRun(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        const participant = room.participants.find(p => p.playerId === playerId);
        if (!participant)
            return false;
        participant.completedSplits = [];
        participant.currentSplitIndex = 0;
        participant.hasFinished = false;
        participant.finalTimeMs = undefined;
        participant.currentRunTimeMs = 0;
        // If host resets and everyone was finished or in lobby, reset room status
        if (participant.isHost && (room.status === 'RACE_FINISHED' || room.status === 'RACING')) {
            room.status = 'LOBBY';
            for (const p of room.participants) {
                p.completedSplits = [];
                p.currentSplitIndex = 0;
                p.hasFinished = false;
                p.finalTimeMs = undefined;
                p.currentRunTimeMs = 0;
            }
        }
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', state: room });
        return true;
    }
    updateTelemetry(roomId, playerId, runTimeMs, inputRate, velocity) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'RACING')
            return;
        const participant = room.participants.find(p => p.playerId === playerId);
        if (participant && !participant.hasFinished) {
            participant.currentRunTimeMs = runTimeMs;
            if (inputRate !== undefined)
                participant.currentApm = inputRate;
            if (velocity !== undefined)
                participant.currentVelocity = velocity;
        }
    }
    recordMatchScorecard(room) {
        const sorted = [...room.participants]
            .filter(p => p.finalTimeMs != null)
            .sort((a, b) => (a.finalTimeMs ?? 0) - (b.finalTimeMs ?? 0));
        const scorecard = {
            matchId: 'match-' + Date.now().toString(36),
            roomId: room.roomId,
            gameTitle: room.gameTitle,
            categoryName: room.categoryName,
            completedAtUtc: getAuthoritativeUtcMs(),
            participants: sorted.map((p, idx) => ({
                username: p.username,
                finalTimeMs: p.finalTimeMs || 0,
                placing: idx + 1,
                goldSplitsCount: p.completedSplits.filter(s => s.isGold).length,
                splits: p.completedSplits,
            })),
        };
        this.completedMatches.push(scorecard);
    }
    getScorecards() {
        return this.completedMatches;
    }
    broadcastToRoom(roomId, message) {
        const conns = this.roomConnections.get(roomId);
        if (!conns)
            return;
        const payload = JSON.stringify(message);
        for (const conn of conns) {
            if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(payload);
            }
        }
    }
}
