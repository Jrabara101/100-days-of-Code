import { WebSocket } from 'ws';
import crypto from 'node:crypto';
import { createPlayerFighter, createEnemyFighter } from './fighterPresets.js';
import { decideAiAction } from './ai.js';
import { resolveCombatRound } from './combatEngine.js';
import { dbStore } from './db.js';
export class RoomManager {
    rooms = new Map();
    roomsByCode = new Map();
    sessions = new Map();
    // Generate 4-character uppercase room code
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return this.roomsByCode.has(code) ? this.generateRoomCode() : code;
    }
    // Create room
    createRoom(hostWs, fighterName = 'PYRO-FRAME SCION', isAiMatch = false) {
        const roomId = crypto.randomUUID();
        const roomCode = this.generateRoomCode();
        const token = crypto.randomUUID();
        const hostSession = {
            token,
            name: fighterName,
            slot: 'host',
            ws: hostWs,
            fighter: createPlayerFighter(token, fighterName),
            ready: true,
        };
        const room = {
            id: roomId,
            code: roomCode,
            phase: isAiMatch ? 'PLANNING_PHASE' : 'LOBBY',
            roundNumber: 1,
            planningTimerEnd: Date.now() + 15000,
            host: hostSession,
            resolutionHistory: [],
            stats: {
                totalRounds: 1,
                playerDamageDealt: 0,
                enemyDamageDealt: 0,
                playerCrits: 0,
                staggerBreaks: 0,
                mvpAbility: 'Inferno Strike',
            },
            isAiMatch,
            createdAt: Date.now(),
        };
        if (isAiMatch) {
            const aiToken = 'ai-' + crypto.randomUUID().slice(0, 6);
            room.guest = {
                token: aiToken,
                name: 'IGNIS-TYPHON MK.IV',
                slot: 'guest',
                isAi: true,
                fighter: createEnemyFighter(aiToken, 'IGNIS-TYPHON MK.IV', true),
                ready: true,
            };
        }
        this.rooms.set(roomId, room);
        this.roomsByCode.set(roomCode, room);
        this.sessions.set(token, { roomId, slot: 'host' });
        dbStore.saveSession(token, fighterName);
        dbStore.upsertRoom(roomId, roomCode, room.phase, isAiMatch);
        if (isAiMatch) {
            this.startPlanningTimer(room);
        }
        return { room, token };
    }
    // Join room by 4-char code
    joinRoom(guestWs, roomCode, fighterName = 'CALDERA VANGUARD') {
        const code = roomCode.trim().toUpperCase();
        const room = this.roomsByCode.get(code);
        if (!room) {
            return { error: `Arena Sector [${code}] not found.` };
        }
        if (room.guest && !room.guest.isAi) {
            return { error: `Arena Sector [${code}] is full.` };
        }
        const token = crypto.randomUUID();
        const guestSession = {
            token,
            name: fighterName,
            slot: 'guest',
            ws: guestWs,
            fighter: createEnemyFighter(token, fighterName, false),
            ready: true,
        };
        room.guest = guestSession;
        room.phase = 'PLANNING_PHASE';
        this.sessions.set(token, { roomId: room.id, slot: 'guest' });
        dbStore.saveSession(token, fighterName);
        dbStore.upsertRoom(room.id, room.code, room.phase, false);
        // Notify host that opponent joined
        this.sendToPlayer(room.host, {
            type: 'OPPONENT_JOINED',
            payload: { opponentName: fighterName },
        });
        this.startPlanningTimer(room);
        this.broadcastState(room);
        return { room, token };
    }
    // Reconnect with token
    reconnect(token, ws) {
        const sessionInfo = this.sessions.get(token);
        if (!sessionInfo)
            return null;
        const room = this.rooms.get(sessionInfo.roomId);
        if (!room)
            return null;
        if (sessionInfo.slot === 'host') {
            room.host.ws = ws;
        }
        else if (room.guest) {
            room.guest.ws = ws;
        }
        this.sendStateToPlayer(sessionInfo.slot === 'host' ? room.host : room.guest, room);
        return { room, slot: sessionInfo.slot };
    }
    // Start 15s planning timer
    startPlanningTimer(room) {
        if (room.timerInterval) {
            clearInterval(room.timerInterval);
        }
        room.phase = 'PLANNING_PHASE';
        room.planningTimerEnd = Date.now() + 15000;
        room.timerInterval = setInterval(() => {
            const remaining = Math.max(0, room.planningTimerEnd - Date.now());
            this.broadcast(room, {
                type: 'TIMER_TICK',
                payload: { timeRemainingMs: remaining },
            });
            if (remaining <= 0) {
                if (room.timerInterval)
                    clearInterval(room.timerInterval);
                this.forceResolveOnTimeout(room);
            }
        }, 1000);
    }
    // Player commits action
    commitAction(token, commit) {
        const sessionInfo = this.sessions.get(token);
        if (!sessionInfo)
            return;
        const room = this.rooms.get(sessionInfo.roomId);
        if (!room || room.phase !== 'PLANNING_PHASE')
            return;
        const isHost = sessionInfo.slot === 'host';
        const playerSession = isHost ? room.host : room.guest;
        const opponentSession = isHost ? room.guest : room.host;
        if (!playerSession)
            return;
        playerSession.committedAction = commit;
        playerSession.fighter.isActionCommitted = true;
        // Send masked commitment packet to opponent
        if (opponentSession) {
            this.sendToPlayer(opponentSession, {
                type: 'OPPONENT_COMMITTED',
                payload: { isCommitted: true },
            });
        }
        // If opponent is AI, trigger AI decision immediately
        if (opponentSession?.isAi && !opponentSession.committedAction) {
            const aiDecision = decideAiAction(opponentSession.fighter, playerSession.fighter);
            opponentSession.committedAction = aiDecision;
            opponentSession.fighter.isActionCommitted = true;
        }
        // Check if both committed
        if (room.host.committedAction && room.guest?.committedAction) {
            if (room.timerInterval)
                clearInterval(room.timerInterval);
            this.resolveRound(room);
        }
    }
    // Auto-commit default attack if timer expires
    forceResolveOnTimeout(room) {
        if (room.phase !== 'PLANNING_PHASE')
            return;
        if (!room.host.committedAction) {
            room.host.committedAction = {
                actionId: 'slash',
                targetId: room.guest ? room.guest.fighter.id : 'enemy',
                stanceModifier: room.host.fighter.stance || 'BALANCED',
            };
            room.host.fighter.isActionCommitted = true;
        }
        if (room.guest && !room.guest.committedAction) {
            if (room.guest.isAi) {
                room.guest.committedAction = decideAiAction(room.guest.fighter, room.host.fighter);
            }
            else {
                room.guest.committedAction = {
                    actionId: 'slash',
                    targetId: room.host.fighter.id,
                    stanceModifier: room.guest.fighter.stance || 'BALANCED',
                };
            }
            room.guest.fighter.isActionCommitted = true;
        }
        this.resolveRound(room);
    }
    // Resolve Round
    resolveRound(room) {
        if (!room.guest || !room.host.committedAction || !room.guest.committedAction)
            return;
        room.phase = 'RESOLVING_ACTIONS';
        const result = resolveCombatRound(room.roundNumber, room.host.fighter, room.host.committedAction, room.guest.fighter, room.guest.committedAction);
        room.host.fighter = result.updatedFighterA;
        room.guest.fighter = result.updatedFighterB;
        room.lastResolution = result.resolution;
        room.resolutionHistory.push(result.resolution);
        // Update Stats
        result.resolution.turnEvents.forEach((evt) => {
            if (evt.actingFighterId === room.host.fighter.id) {
                room.stats.playerDamageDealt += evt.damageDealt;
                if (evt.wasCritical)
                    room.stats.playerCrits += 1;
                if (evt.staggerBreakOccurred)
                    room.stats.staggerBreaks += 1;
            }
            else if (evt.actingFighterId === room.guest?.fighter.id) {
                room.stats.enemyDamageDealt += evt.damageDealt;
            }
        });
        // Clear commits
        room.host.committedAction = undefined;
        room.guest.committedAction = undefined;
        // Broadcast Resolution packet
        this.broadcast(room, {
            type: 'ROUND_RESOLVED',
            payload: result.resolution,
        });
        // Broadcast updated state
        this.broadcastState(room);
        // Check for Match Over or advance to next round
        if (result.winnerId) {
            room.winnerId = result.winnerId;
            room.phase = 'MATCH_OVER';
            room.stats.totalRounds = room.roundNumber;
            dbStore.saveMatchHistory(room.code, result.winnerId, room.roundNumber, room.stats);
            dbStore.upsertRoom(room.id, room.code, 'MATCH_OVER', room.isAiMatch);
            setTimeout(() => {
                this.broadcast(room, {
                    type: 'MATCH_ENDED',
                    payload: {
                        winnerId: result.winnerId,
                        stats: room.stats,
                    },
                });
                this.broadcastState(room);
            }, 3500);
        }
        else {
            // Transition to next round after resolution playback animation window (4.0s)
            setTimeout(() => {
                if (room.phase === 'MATCH_OVER')
                    return;
                room.roundNumber += 1;
                room.phase = 'PLANNING_PHASE';
                this.startPlanningTimer(room);
                this.broadcastState(room);
            }, 4000);
        }
    }
    // Request Rematch
    rematch(token) {
        const sessionInfo = this.sessions.get(token);
        if (!sessionInfo)
            return;
        const room = this.rooms.get(sessionInfo.roomId);
        if (!room || room.phase !== 'MATCH_OVER')
            return;
        // Reset fighters
        room.host.fighter = createPlayerFighter(room.host.token, room.host.name);
        if (room.guest) {
            room.guest.fighter = createEnemyFighter(room.guest.token, room.guest.name, room.guest.isAi);
        }
        room.roundNumber = 1;
        room.winnerId = undefined;
        room.resolutionHistory = [];
        room.lastResolution = undefined;
        room.stats = {
            totalRounds: 1,
            playerDamageDealt: 0,
            enemyDamageDealt: 0,
            playerCrits: 0,
            staggerBreaks: 0,
            mvpAbility: 'Inferno Strike',
        };
        room.phase = 'PLANNING_PHASE';
        this.startPlanningTimer(room);
        this.broadcastState(room);
    }
    // Broadcast game state to both players
    broadcastState(room) {
        this.sendStateToPlayer(room.host, room);
        if (room.guest && !room.guest.isAi) {
            this.sendStateToPlayer(room.guest, room);
        }
    }
    // Format client state (player perspective)
    sendStateToPlayer(player, room) {
        const isHost = player.slot === 'host';
        const playerFighter = isHost ? room.host.fighter : room.guest.fighter;
        const enemyFighter = isHost ? room.guest?.fighter : room.host.fighter;
        if (!enemyFighter)
            return;
        const state = {
            roomId: room.id,
            roomCode: room.code,
            phase: room.phase,
            roundNumber: room.roundNumber,
            planningTimeRemainingMs: Math.max(0, room.planningTimerEnd - Date.now()),
            playerFighter,
            enemyFighter,
            resolutionQueue: room.lastResolution || null,
            winnerId: room.winnerId,
            matchStats: room.stats,
            isPvP: !room.isAiMatch,
            playerSlot: player.slot,
        };
        this.sendToPlayer(player, {
            type: 'STATE_SYNC',
            payload: state,
        });
    }
    sendToPlayer(player, message) {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    }
    broadcast(room, message) {
        this.sendToPlayer(room.host, message);
        if (room.guest && !room.guest.isAi) {
            this.sendToPlayer(room.guest, message);
        }
    }
    getActiveRoomsCount() {
        return this.rooms.size;
    }
}
export const roomManager = new RoomManager();
