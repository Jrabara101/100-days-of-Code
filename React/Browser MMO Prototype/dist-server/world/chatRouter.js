import { randomUUID } from 'crypto';
import { SpatialHashGrid } from './spatialGrid.js';
export const PROXIMITY_CHAT_RADIUS = 400; // 400px Euclidean radius for LOCAL chat
export class ChatRouter {
    rateLimits = new Map();
    maxTokens = 5;
    refillIntervalMs = 600; // 1 token per 600ms (max 5 per 3s)
    // Token-bucket rate limiter check
    checkRateLimit(playerId) {
        const now = Date.now();
        let bucket = this.rateLimits.get(playerId);
        if (!bucket) {
            bucket = { tokens: this.maxTokens - 1, lastRefill: now };
            this.rateLimits.set(playerId, bucket);
            return true;
        }
        const elapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);
        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }
        if (bucket.tokens > 0) {
            bucket.tokens--;
            return true;
        }
        return false;
    }
    // Sanitize incoming content
    sanitize(content) {
        return content
            .trim()
            .replace(/<[^>]*>?/gm, '') // Remove HTML tags
            .substring(0, 180);
    }
    // Route a message to appropriate recipients
    routeMessage(sender, channel, rawContent, recipientId, allPlayers = new Map()) {
        if (!this.checkRateLimit(sender.id)) {
            return null;
        }
        const content = this.sanitize(rawContent);
        if (!content)
            return null;
        const messageId = `msg_${randomUUID().substring(0, 8)}`;
        const now = Date.now();
        const baseMessage = {
            id: messageId,
            senderId: sender.id,
            senderName: sender.username,
            channel,
            content,
            timestamp: now,
            recipientId,
        };
        const recipients = [];
        if (channel === 'LOCAL') {
            // Local proximity: broadcast only to players within 400px Euclidean radius
            for (const player of allPlayers.values()) {
                const dist = SpatialHashGrid.distance(sender.x, sender.y, player.x, player.y);
                if (dist <= PROXIMITY_CHAT_RADIUS) {
                    recipients.push({ player, proximityDist: Math.round(dist) });
                }
            }
            return { message: baseMessage, recipients, spawnBubble: true };
        }
        if (channel === 'GLOBAL' || channel === 'SYSTEM') {
            for (const player of allPlayers.values()) {
                recipients.push({ player });
            }
            return { message: baseMessage, recipients, spawnBubble: true };
        }
        if (channel === 'PARTY') {
            for (const player of allPlayers.values()) {
                if (player.partyId && player.partyId === sender.partyId) {
                    recipients.push({ player });
                }
                else if (player.id === sender.id) {
                    recipients.push({ player });
                }
            }
            return { message: baseMessage, recipients, spawnBubble: true };
        }
        if (channel === 'WHISPER' && recipientId) {
            const target = allPlayers.get(recipientId);
            if (target) {
                recipients.push({ player: target });
                if (target.id !== sender.id) {
                    recipients.push({ player: sender });
                }
            }
            return { message: baseMessage, recipients, spawnBubble: false };
        }
        // Default fallback
        recipients.push({ player: sender });
        return { message: baseMessage, recipients, spawnBubble: true };
    }
}
