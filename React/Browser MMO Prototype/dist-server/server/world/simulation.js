import { randomUUID } from 'crypto';
import { WorldTileMap } from './tilemap.js';
import { ItemLedgerManager } from './itemLedger.js';
import { SpatialHashGrid } from './spatialGrid.js';
import { ChatRouter } from './chatRouter.js';
import { TradeManager } from './tradeManager.js';
export const SERVER_TICK_RATE = 20; // 20Hz
export const SERVER_TICK_INTERVAL_MS = 1000 / SERVER_TICK_RATE; // 50ms
export const BASE_PLAYER_SPEED = 160; // 160px per second
export class WorldSimulation {
    shardId;
    tileMap;
    itemLedger;
    spatialGrid;
    chatRouter;
    tradeManager;
    clients = new Map();
    players = new Map();
    bots = new Map();
    tick = 0;
    intervalTimer = null;
    constructor(shardId = 'REALM') {
        this.shardId = shardId;
        this.tileMap = new WorldTileMap();
        this.itemLedger = new ItemLedgerManager();
        this.spatialGrid = new SpatialHashGrid();
        this.chatRouter = new ChatRouter();
        this.tradeManager = new TradeManager();
        this.spawnAmbientBots();
        this.startTickLoop();
    }
    startTickLoop() {
        if (this.intervalTimer)
            return;
        this.intervalTimer = setInterval(() => {
            this.onServerTick();
        }, SERVER_TICK_INTERVAL_MS);
    }
    stopTickLoop() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }
    // Authoritative 20Hz Tick Loop
    onServerTick() {
        this.tick++;
        const now = Date.now();
        const dt = 1 / SERVER_TICK_RATE; // 0.05s
        const lastProcessedSeqs = {};
        // 1. Process real players' queued inputs & movement
        for (const player of this.players.values()) {
            if (player.pendingInputs.length > 0) {
                // Compute aggregated equipment speed bonus
                let speedBonus = 0;
                for (const item of Object.values(player.inventory.equipped)) {
                    if (item?.stats?.speed) {
                        speedBonus += item.stats.speed;
                    }
                }
                const effectiveSpeed = Math.max(80, Math.min(320, BASE_PLAYER_SPEED + speedBonus * 4));
                let lastSeq = player.lastProcessedSeq;
                for (const input of player.pendingInputs) {
                    lastSeq = input.seq;
                    const inputDt = Math.min(0.08, Math.max(0.005, input.dt || dt));
                    const dirX = Math.max(-1, Math.min(1, input.inputVector.dx));
                    const dirY = Math.max(-1, Math.min(1, input.inputVector.dy));
                    player.facing = input.facing || player.facing;
                    player.isMoving = dirX !== 0 || dirY !== 0;
                    if (player.isMoving) {
                        // Normalize diagonal vector
                        const len = Math.sqrt(dirX * dirX + dirY * dirY);
                        const normX = len > 0 ? dirX / len : 0;
                        const normY = len > 0 ? dirY / len : 0;
                        const nextX = player.x + normX * effectiveSpeed * inputDt;
                        const nextY = player.y + normY * effectiveSpeed * inputDt;
                        // Collision check against authoritative tilemap
                        const collideBoth = this.tileMap.checkCircleCollision(nextX, nextY, 15);
                        if (!collideBoth) {
                            player.x = nextX;
                            player.y = nextY;
                        }
                        else {
                            // Try sliding along X axis
                            const collideX = this.tileMap.checkCircleCollision(nextX, player.y, 15);
                            if (!collideX) {
                                player.x = nextX;
                            }
                            else {
                                // Try sliding along Y axis
                                const collideY = this.tileMap.checkCircleCollision(player.x, nextY, 15);
                                if (!collideY) {
                                    player.y = nextY;
                                }
                            }
                        }
                    }
                }
                player.lastProcessedSeq = lastSeq;
                player.pendingInputs = [];
                lastProcessedSeqs[player.id] = lastSeq;
                // Update in spatial grid
                this.spatialGrid.updateEntity(player.id, player.x, player.y);
            }
            else {
                player.isMoving = false;
                lastProcessedSeqs[player.id] = player.lastProcessedSeq;
            }
            // Check chat bubble expiration
            if (player.activeChatBubble && now > player.activeChatBubble.expiresAt) {
                player.activeChatBubble = undefined;
            }
            // Check emote expiration
            if (player.activeEmote && now > player.activeEmote.expiresAt) {
                player.activeEmote = undefined;
            }
        }
        // 2. Tick ambient bots / NPC wanderers
        this.tickAmbientBots(dt, now);
        // 3. Prune expired ground loot (60s timer)
        const despawnedIds = this.itemLedger.pruneExpiredLoot();
        if (despawnedIds.length > 0) {
            for (const lootId of despawnedIds) {
                this.broadcastPacket({
                    type: 'LOOT_DESPAWNED',
                    lootId,
                });
            }
        }
        // 4. Broadcast compressed tick snapshot
        const playersSnapshot = {};
        for (const player of this.players.values()) {
            playersSnapshot[player.id] = this.stripServerPlayer(player);
        }
        for (const bot of this.bots.values()) {
            playersSnapshot[bot.id] = this.stripServerPlayer(bot);
        }
        const snapshotPacket = {
            type: 'TICK_SNAPSHOT',
            tick: this.tick,
            timestamp: now,
            lastProcessedSeqs,
            players: playersSnapshot,
        };
        this.broadcastPacket(snapshotPacket);
    }
    // Handle player connection
    handleJoin(ws, username, title = 'Wanderer', avatarColor) {
        const id = `player_${randomUUID().substring(0, 8)}`;
        const spawn = this.tileMap.spawnPoint;
        // Add subtle jitter around town square spawn point
        const spawnJitterX = (Math.random() - 0.5) * 80;
        const spawnJitterY = (Math.random() - 0.5) * 80;
        const starterInventory = this.itemLedger.createStarterInventory();
        const player = {
            id,
            username: username.trim().substring(0, 16) || `Adventurer_${id.substring(7, 11)}`,
            title,
            x: spawn.x + spawnJitterX,
            y: spawn.y + spawnJitterY,
            facing: 'down',
            isMoving: false,
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            level: 1,
            equippedVisuals: {},
            avatarColor: avatarColor || this.getRandomAvatarColor(),
            inventory: starterInventory,
            pendingInputs: [],
            lastProcessedSeq: 0,
            lastActive: Date.now(),
        };
        const client = {
            id,
            ws,
            player,
            shardId: this.shardId,
        };
        this.clients.set(id, client);
        this.players.set(id, player);
        this.spatialGrid.updateEntity(id, player.x, player.y);
        // Send initial authoritative state
        const allPlayersSnapshot = {};
        for (const p of this.players.values()) {
            allPlayersSnapshot[p.id] = this.stripServerPlayer(p);
        }
        for (const b of this.bots.values()) {
            allPlayersSnapshot[b.id] = this.stripServerPlayer(b);
        }
        const initPacket = {
            type: 'INIT_STATE',
            myPlayerId: id,
            shardId: this.shardId,
            worldMap: this.tileMap.getMeta(),
            player: this.stripServerPlayer(player),
            inventory: player.inventory,
            players: allPlayersSnapshot,
            groundLoot: this.itemLedger.getGroundLoot(),
        };
        this.sendPacket(client, initPacket);
        // Broadcast join announcement
        this.broadcastSystemAlert(`${player.username} has warped into ${this.shardId}!`, 'info');
        return { player, client };
    }
    // Handle player disconnect
    handleLeave(playerId) {
        const client = this.clients.get(playerId);
        const player = this.players.get(playerId);
        if (client && player) {
            // Cancel any ongoing trade safely
            const activeTrade = this.tradeManager.getPlayerActiveTrade(playerId);
            if (activeTrade) {
                this.tradeManager.cancelTrade(activeTrade.tradeId);
                const partnerId = activeTrade.player1Id === playerId ? activeTrade.player2Id : activeTrade.player1Id;
                const partnerClient = this.clients.get(partnerId);
                if (partnerClient) {
                    this.sendPacket(partnerClient, {
                        type: 'TRADE_UPDATE',
                        trade: null,
                        errorReason: `${player.username} disconnected. Trade cancelled.`,
                    });
                }
            }
            this.spatialGrid.removeEntity(playerId);
            this.players.delete(playerId);
            this.clients.delete(playerId);
            this.broadcastSystemAlert(`${player.username} stepped through the void.`, 'info');
        }
    }
    // Handle incoming client packets
    handlePacket(client, packet) {
        const player = client.player;
        player.lastActive = Date.now();
        switch (packet.type) {
            case 'MOVE_INPUT': {
                player.pendingInputs.push(packet);
                break;
            }
            case 'CHAT': {
                const routeResult = this.chatRouter.routeMessage(player, packet.channel, packet.content, packet.recipientId, this.players);
                if (routeResult) {
                    const { message, recipients, spawnBubble } = routeResult;
                    for (const recipient of recipients) {
                        const targetClient = this.clients.get(recipient.player.id);
                        if (targetClient) {
                            const msgPayload = {
                                ...message,
                                proximityDist: recipient.proximityDist,
                            };
                            this.sendPacket(targetClient, { type: 'CHAT_MESSAGE', message: msgPayload });
                        }
                    }
                    if (spawnBubble) {
                        const expiresAt = Date.now() + 5000;
                        player.activeChatBubble = {
                            text: message.content,
                            expiresAt,
                        };
                        this.broadcastPacket({
                            type: 'CHAT_BUBBLE',
                            playerId: player.id,
                            text: message.content,
                            expiresAt,
                        });
                    }
                }
                break;
            }
            case 'EMOTE': {
                const expiresAt = Date.now() + 4000;
                player.activeEmote = {
                    emoji: packet.emoji,
                    expiresAt,
                };
                this.broadcastPacket({
                    type: 'EMOTE_POP',
                    playerId: player.id,
                    emoji: packet.emoji,
                    expiresAt,
                });
                break;
            }
            case 'ITEM_MOVE': {
                const slot = player.inventory.slots.find(s => s.item.uid === packet.uid);
                if (slot) {
                    if (packet.rotate) {
                        slot.item.isRotated = !slot.item.isRotated;
                    }
                    if (ItemLedgerManager.canPlaceItem(player.inventory.slots, slot.item, packet.toGridX, packet.toGridY, player.inventory.cols, player.inventory.rows, slot.item.uid)) {
                        slot.gridX = packet.toGridX;
                        slot.gridY = packet.toGridY;
                    }
                    else if (packet.rotate) {
                        // Revert rotation if blocked
                        slot.item.isRotated = !slot.item.isRotated;
                    }
                    this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                }
                break;
            }
            case 'ITEM_EQUIP': {
                const slotIndex = player.inventory.slots.findIndex(s => s.item.uid === packet.uid);
                if (slotIndex !== -1) {
                    const item = player.inventory.slots[slotIndex].item;
                    const targetSlot = packet.targetSlot || item.equipSlot;
                    if (targetSlot && item.equipSlot === targetSlot) {
                        const currentEquipped = player.inventory.equipped[targetSlot];
                        // Remove from grid
                        player.inventory.slots.splice(slotIndex, 1);
                        // Put current equipped back into grid if exists
                        if (currentEquipped) {
                            const pos = ItemLedgerManager.findVacantPosition(player.inventory.slots, currentEquipped, player.inventory.cols, player.inventory.rows);
                            if (pos) {
                                player.inventory.slots.push({ item: currentEquipped, gridX: pos.x, gridY: pos.y });
                            }
                        }
                        // Equip new item
                        player.inventory.equipped[targetSlot] = item;
                        player.equippedVisuals[targetSlot] = item.templateId;
                        // Recalculate stats
                        this.recalculatePlayerStats(player);
                        this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                        this.broadcastPacket({
                            type: 'SYSTEM_ALERT',
                            message: `${player.username} equipped ${item.name}!`,
                            alertType: 'info',
                        });
                    }
                }
                break;
            }
            case 'ITEM_UNEQUIP': {
                const equippedItem = player.inventory.equipped[packet.slot];
                if (equippedItem) {
                    const pos = packet.toGridX !== undefined && packet.toGridY !== undefined
                        ? { x: packet.toGridX, y: packet.toGridY }
                        : ItemLedgerManager.findVacantPosition(player.inventory.slots, equippedItem, player.inventory.cols, player.inventory.rows);
                    if (pos &&
                        ItemLedgerManager.canPlaceItem(player.inventory.slots, equippedItem, pos.x, pos.y, player.inventory.cols, player.inventory.rows)) {
                        delete player.inventory.equipped[packet.slot];
                        delete player.equippedVisuals[packet.slot];
                        player.inventory.slots.push({ item: equippedItem, gridX: pos.x, gridY: pos.y });
                        this.recalculatePlayerStats(player);
                        this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                    }
                    else {
                        this.sendPacket(client, {
                            type: 'SYSTEM_ALERT',
                            message: 'Not enough room in backpack to unequip item.',
                            alertType: 'warning',
                        });
                    }
                }
                break;
            }
            case 'ITEM_DROP': {
                // Find in slots
                const slotIdx = player.inventory.slots.findIndex(s => s.item.uid === packet.uid);
                let droppedItem = null;
                if (slotIdx !== -1) {
                    droppedItem = player.inventory.slots[slotIdx].item;
                    player.inventory.slots.splice(slotIdx, 1);
                }
                else {
                    // Check equipped
                    for (const [slot, eq] of Object.entries(player.inventory.equipped)) {
                        if (eq?.uid === packet.uid) {
                            droppedItem = eq;
                            delete player.inventory.equipped[slot];
                            delete player.equippedVisuals[slot];
                            this.recalculatePlayerStats(player);
                            break;
                        }
                    }
                }
                if (droppedItem) {
                    const loot = this.itemLedger.dropItem(droppedItem, player.x, player.y);
                    this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                    this.broadcastPacket({
                        type: 'LOOT_SPAWNED',
                        loot,
                    });
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: `Dropped ${droppedItem.name} onto the ground.`,
                        alertType: 'info',
                    });
                }
                break;
            }
            case 'ITEM_PICKUP': {
                const result = this.itemLedger.atomicPickup(packet.lootId, player.x, player.y, player.inventory);
                if (result.success && result.item && result.updatedInventory) {
                    player.inventory = result.updatedInventory;
                    this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                    this.broadcastPacket({
                        type: 'LOOT_DESPAWNED',
                        lootId: packet.lootId,
                        pickedUpBy: player.id,
                    });
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: `Claimed ${result.item.name}!`,
                        alertType: 'success',
                    });
                }
                else if (result.reason) {
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: result.reason,
                        alertType: 'warning',
                    });
                }
                break;
            }
            case 'ITEM_USE': {
                const slotIdx = player.inventory.slots.findIndex(s => s.item.uid === packet.uid);
                if (slotIdx !== -1) {
                    const item = player.inventory.slots[slotIdx].item;
                    if (item.category === 'consumable') {
                        if (item.stats?.hpRestore) {
                            player.hp = Math.min(player.maxHp, player.hp + item.stats.hpRestore);
                        }
                        if (item.templateId === 'scroll_tp') {
                            // Warp to town spawn point!
                            player.x = this.tileMap.spawnPoint.x;
                            player.y = this.tileMap.spawnPoint.y;
                            this.spatialGrid.updateEntity(player.id, player.x, player.y);
                        }
                        // Decrement stack
                        item.quantity--;
                        if (item.quantity <= 0) {
                            player.inventory.slots.splice(slotIdx, 1);
                        }
                        this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                        this.sendPacket(client, {
                            type: 'SYSTEM_ALERT',
                            message: `Used ${item.name}.`,
                            alertType: 'info',
                        });
                    }
                }
                break;
            }
            case 'ITEM_SORT': {
                player.inventory = ItemLedgerManager.autoSort(player.inventory);
                this.sendPacket(client, { type: 'INVENTORY_UPDATE', inventory: player.inventory });
                break;
            }
            // Peer-to-Peer Trading
            case 'TRADE_REQUEST': {
                const targetClient = this.clients.get(packet.targetPlayerId);
                if (!targetClient) {
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: 'Target adventurer is no longer online.',
                        alertType: 'warning',
                    });
                    return;
                }
                const startRes = this.tradeManager.startTrade(player, targetClient.player);
                if (startRes.success && startRes.tradeId) {
                    // Send trade invite to target
                    this.sendPacket(targetClient, {
                        type: 'TRADE_INVITE',
                        tradeId: startRes.tradeId,
                        initiatorId: player.id,
                        initiatorName: player.username,
                    });
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: `Sent trade invitation to ${targetClient.player.username}.`,
                        alertType: 'info',
                    });
                }
                else {
                    this.sendPacket(client, {
                        type: 'SYSTEM_ALERT',
                        message: startRes.reason || 'Cannot initiate trade.',
                        alertType: 'warning',
                    });
                }
                break;
            }
            case 'TRADE_RESPOND': {
                const session = this.tradeManager.getPlayerActiveTrade(player.id);
                if (!session)
                    return;
                const p1Client = this.clients.get(session.player1Id);
                const p2Client = this.clients.get(session.player2Id);
                if (packet.accept && p1Client && p2Client) {
                    // Open trade UI for both
                    const p1Session = this.tradeManager.buildClientTradeSession(session.tradeId, p1Client.id, p1Client.player.username, p2Client.player.username);
                    const p2Session = this.tradeManager.buildClientTradeSession(session.tradeId, p2Client.id, p1Client.player.username, p2Client.player.username);
                    this.sendPacket(p1Client, { type: 'TRADE_UPDATE', trade: p1Session });
                    this.sendPacket(p2Client, { type: 'TRADE_UPDATE', trade: p2Session });
                }
                else {
                    this.tradeManager.cancelTrade(session.tradeId);
                    if (p1Client) {
                        this.sendPacket(p1Client, {
                            type: 'TRADE_UPDATE',
                            trade: null,
                            errorReason: `${player.username} declined the trade.`,
                        });
                    }
                    if (p2Client) {
                        this.sendPacket(p2Client, { type: 'TRADE_UPDATE', trade: null });
                    }
                }
                break;
            }
            case 'TRADE_STAGE_ITEM': {
                this.tradeManager.stageItem(player.id, packet.itemUid, player.inventory);
                this.syncTradeUpdate(player.id);
                break;
            }
            case 'TRADE_UNSTAGE_ITEM': {
                this.tradeManager.unstageItem(player.id, packet.itemUid);
                this.syncTradeUpdate(player.id);
                break;
            }
            case 'TRADE_SET_GOLD': {
                this.tradeManager.setGold(player.id, packet.amount, player.inventory.gold);
                this.syncTradeUpdate(player.id);
                break;
            }
            case 'TRADE_LOCK': {
                this.tradeManager.toggleLock(player.id, packet.locked);
                this.syncTradeUpdate(player.id);
                break;
            }
            case 'TRADE_CONFIRM': {
                const { readyToExecute, session } = this.tradeManager.confirmTrade(player.id);
                this.syncTradeUpdate(player.id);
                if (readyToExecute && session) {
                    const p1 = this.players.get(session.player1Id);
                    const p2 = this.players.get(session.player2Id);
                    const p1c = this.clients.get(session.player1Id);
                    const p2c = this.clients.get(session.player2Id);
                    if (p1 && p2 && p1c && p2c) {
                        const swapResult = this.tradeManager.executeAtomicSwap(p1, p2);
                        if (swapResult.success) {
                            this.sendPacket(p1c, { type: 'INVENTORY_UPDATE', inventory: p1.inventory });
                            this.sendPacket(p2c, { type: 'INVENTORY_UPDATE', inventory: p2.inventory });
                            this.sendPacket(p1c, { type: 'TRADE_UPDATE', trade: null });
                            this.sendPacket(p2c, { type: 'TRADE_UPDATE', trade: null });
                            this.sendPacket(p1c, {
                                type: 'SYSTEM_ALERT',
                                message: 'Trade completed successfully!',
                                alertType: 'success',
                            });
                            this.sendPacket(p2c, {
                                type: 'SYSTEM_ALERT',
                                message: 'Trade completed successfully!',
                                alertType: 'success',
                            });
                        }
                        else {
                            this.sendPacket(p1c, {
                                type: 'SYSTEM_ALERT',
                                message: swapResult.reason || 'Trade failed.',
                                alertType: 'error',
                            });
                            this.sendPacket(p2c, {
                                type: 'SYSTEM_ALERT',
                                message: swapResult.reason || 'Trade failed.',
                                alertType: 'error',
                            });
                        }
                    }
                }
                break;
            }
            case 'TRADE_CANCEL': {
                const session = this.tradeManager.getPlayerActiveTrade(player.id);
                if (session) {
                    const p1Client = this.clients.get(session.player1Id);
                    const p2Client = this.clients.get(session.player2Id);
                    this.tradeManager.cancelTrade(session.tradeId);
                    if (p1Client) {
                        this.sendPacket(p1Client, {
                            type: 'TRADE_UPDATE',
                            trade: null,
                            errorReason: `${player.username} cancelled the trade.`,
                        });
                    }
                    if (p2Client) {
                        this.sendPacket(p2Client, {
                            type: 'TRADE_UPDATE',
                            trade: null,
                            errorReason: `${player.username} cancelled the trade.`,
                        });
                    }
                }
                break;
            }
            case 'PING': {
                this.sendPacket(client, {
                    type: 'PONG',
                    clientTimestamp: packet.clientTimestamp,
                    serverTimestamp: Date.now(),
                });
                break;
            }
        }
    }
    // Recalculate max HP and defense from gear
    recalculatePlayerStats(player) {
        let bonusHp = 0;
        for (const item of Object.values(player.inventory.equipped)) {
            if (item?.stats?.defense) {
                bonusHp += item.stats.defense * 2;
            }
        }
        player.maxHp = 100 + bonusHp;
        player.hp = Math.min(player.maxHp, player.hp);
    }
    // Sync trade updates to both participants
    syncTradeUpdate(playerId) {
        const session = this.tradeManager.getPlayerActiveTrade(playerId);
        if (!session)
            return;
        const p1 = this.clients.get(session.player1Id);
        const p2 = this.clients.get(session.player2Id);
        if (p1 && p2) {
            const p1Session = this.tradeManager.buildClientTradeSession(session.tradeId, p1.id, p1.player.username, p2.player.username);
            const p2Session = this.tradeManager.buildClientTradeSession(session.tradeId, p2.id, p1.player.username, p2.player.username);
            this.sendPacket(p1, { type: 'TRADE_UPDATE', trade: p1Session });
            this.sendPacket(p2, { type: 'TRADE_UPDATE', trade: p2Session });
        }
    }
    // Send packet to specific client
    sendPacket(client, packet) {
        try {
            if (client.ws.readyState === 1 /* OPEN */) {
                client.ws.send(JSON.stringify(packet));
            }
        }
        catch (e) {
            // Ignore write errors on closed sockets
        }
    }
    // Broadcast packet to all clients in shard
    broadcastPacket(packet) {
        const raw = JSON.stringify(packet);
        for (const client of this.clients.values()) {
            try {
                if (client.ws.readyState === 1) {
                    client.ws.send(raw);
                }
            }
            catch (e) { }
        }
    }
    // Broadcast system alert to all clients
    broadcastSystemAlert(message, alertType = 'info') {
        this.broadcastPacket({
            type: 'SYSTEM_ALERT',
            message,
            alertType,
        });
    }
    // Strip internal ServerPlayer properties to make WorldPlayerEntity
    stripServerPlayer(p) {
        return {
            id: p.id,
            username: p.username,
            title: p.title,
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
            facing: p.facing,
            isMoving: p.isMoving,
            hp: p.hp,
            maxHp: p.maxHp,
            stamina: p.stamina,
            maxStamina: p.maxStamina,
            level: p.level,
            equippedVisuals: { ...p.equippedVisuals },
            avatarColor: p.avatarColor,
            isBot: p.isBot,
            activeChatBubble: p.activeChatBubble,
            activeEmote: p.activeEmote,
        };
    }
    // Ambient town bots / wanderers
    spawnAmbientBots() {
        const botArchetypes = [
            {
                name: 'Captain Roland',
                title: 'Town Guard',
                x: 23 * 48,
                y: 28 * 48,
                color: '#3B82F6',
                gear: { chest: 'armor_plate', main_hand: 'sword_iron', head: 'helm_bronze' },
            },
            {
                name: 'Alchemist Lyra',
                title: 'Apothecary',
                x: 29 * 48,
                y: 21 * 48,
                color: '#10B981',
                gear: { main_hand: 'staff_aether', relic: 'relic_phoenix' },
            },
            {
                name: 'Finn the Quick',
                title: 'Rogue Scout',
                x: 21 * 48,
                y: 25 * 48,
                color: '#F59E0B',
                gear: { main_hand: 'dagger_shadow', chest: 'armor_leather', feet: 'boots_wanderer' },
            },
        ];
        for (const b of botArchetypes) {
            const botId = `bot_${b.name.toLowerCase().replace(/\s+/g, '_')}`;
            const botPlayer = {
                id: botId,
                username: b.name,
                title: b.title,
                x: b.x,
                y: b.y,
                facing: 'down',
                isMoving: false,
                hp: 150,
                maxHp: 150,
                stamina: 100,
                maxStamina: 100,
                level: 5,
                equippedVisuals: b.gear,
                avatarColor: b.color,
                isBot: true,
                inventory: {
                    cols: 8,
                    rows: 5,
                    slots: [],
                    equipped: {},
                    gold: 500,
                },
                pendingInputs: [],
                lastProcessedSeq: 0,
                lastActive: Date.now(),
            };
            this.bots.set(botId, botPlayer);
            this.spatialGrid.updateEntity(botId, botPlayer.x, botPlayer.y);
        }
    }
    // Periodic ambient movement & dialogue for bots
    tickAmbientBots(dt, now) {
        if (this.tick % 60 === 0) {
            // Every 3 seconds
            const dialogueLines = [
                'Safe travels in Olde Haven, adventurer!',
                'The water fountain holds ancient enchantments...',
                'Watch your footing around the southern ponds!',
                'Keep your blade sharp and your pack organized.',
                'Did you know pressing [R] rotates items in your bag?',
            ];
            for (const bot of this.bots.values()) {
                if (Math.random() < 0.25 && !bot.activeChatBubble) {
                    const line = dialogueLines[Math.floor(Math.random() * dialogueLines.length)];
                    bot.activeChatBubble = {
                        text: line,
                        expiresAt: now + 4000,
                    };
                    this.broadcastPacket({
                        type: 'CHAT_BUBBLE',
                        playerId: bot.id,
                        text: line,
                        expiresAt: now + 4000,
                    });
                }
                // Random subtle pacing around their station
                if (Math.random() < 0.4) {
                    const dirs = ['up', 'down', 'left', 'right'];
                    bot.facing = dirs[Math.floor(Math.random() * dirs.length)];
                }
            }
        }
    }
    getRandomAvatarColor() {
        const colors = ['#38BDF8', '#F59E0B', '#A855F7', '#EC4899', '#10B981', '#6366F1'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
