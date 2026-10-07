import crypto from 'node:crypto';
import { UnlockReceipt } from '../types.js';

const SERVER_SECRET = process.env.ACHIEVEMENT_SECRET || 'neo-arcade-vault-auth-key-2026';

export class AntiTamperSigner {
  /**
   * Generates an immutable, cryptographic unlock receipt
   */
  static generateUnlockReceipt(achievementId: string, sequenceNumber: number): UnlockReceipt {
    const unlockedAt = new Date().toISOString();
    const rawData = `${achievementId}:${unlockedAt}:${sequenceNumber}`;
    const signature = crypto.createHmac('sha256', SERVER_SECRET).update(rawData).digest('hex');
    const verificationHash = crypto.createHash('sha256').update(`${signature}:${unlockedAt}`).digest('hex').substring(0, 16).toUpperCase();

    return {
      achievementId,
      unlockedAt,
      signature,
      sequenceNumber,
      verificationHash: `REC-${verificationHash}`
    };
  }

  /**
   * Generates a signed token for claiming a specific reward
   */
  static generateRewardClaimToken(achievementId: string, rewardId: string): string {
    const payload = `${achievementId}:${rewardId}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}:${hmac}`).toString('base64url');
  }

  /**
   * Verifies the authenticity of a reward claim token
   */
  static verifyRewardClaimToken(token: string, achievementId: string, rewardId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [tokenAchId, tokenRewardId, timestampStr, hmac] = decoded.split(':');
      if (tokenAchId !== achievementId || tokenRewardId !== rewardId) {
        return false;
      }
      const expectedPayload = `${tokenAchId}:${tokenRewardId}:${timestampStr}`;
      const expectedHmac = crypto.createHmac('sha256', SERVER_SECRET).update(expectedPayload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
    } catch {
      return false;
    }
  }

  /**
   * Validates monotonic session sequencing to detect replay or spoofed out-of-order packets
   */
  static validateSequence(lastSequence: number, currentSequence: number): { valid: boolean; reason?: string } {
    if (currentSequence <= lastSequence) {
      return {
        valid: false,
        reason: `Monotonic sequence violation: Received #${currentSequence} after #${lastSequence}. Possible packet replay or client manipulation.`
      };
    }
    if (currentSequence > lastSequence + 100) {
      return {
        valid: false,
        reason: `Abnormal sequence jump: Jumped from #${lastSequence} to #${currentSequence}. Possible spoofed burst.`
      };
    }
    return { valid: true };
  }
}
