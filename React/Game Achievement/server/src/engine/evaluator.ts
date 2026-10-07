import { AchievementItem, AchievementTrackerState, TelemetryPayload, UnlockReceipt } from '../types.js';
import { INITIAL_ACHIEVEMENTS } from '../data/achievements.data.js';
import { AntiTamperSigner } from './signer.js';

export interface EvaluationResult {
  success: boolean;
  unlockedAchievements: AchievementItem[];
  updatedAchievements: AchievementItem[];
  tamperAlert?: string;
  receipts: UnlockReceipt[];
}

export class AchievementEvaluator {
  private achievements: Record<string, AchievementItem>;
  private lastSequenceMap: Map<string, number> = new Map();
  private lastEventTimeMap: Map<string, number> = new Map();
  private eventCountWindowMap: Map<string, { count: number; windowStart: number }> = new Map();

  constructor() {
    this.achievements = JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS));
    // Pre-generate receipts for initial unlocked achievements
    for (const ach of Object.values(this.achievements)) {
      if (ach.isUnlocked && !ach.receipt) {
        ach.receipt = AntiTamperSigner.generateUnlockReceipt(ach.id, 0);
      }
      if (ach.isUnlocked && ach.reward && !ach.reward.unlockToken) {
        ach.reward.unlockToken = AntiTamperSigner.generateRewardClaimToken(ach.id, ach.reward.id);
      }
    }
  }

  public getState(): AchievementTrackerState {
    const list = Object.values(this.achievements);
    const totalPoints = list.reduce((sum, item) => sum + (item.isUnlocked ? item.points : 0), 0);
    const unlockedCount = list.filter(item => item.isUnlocked).length;
    const pinnedIds = list.filter(item => item.isPinned).map(item => item.id);

    return {
      achievements: this.achievements,
      activeCategory: 'all',
      searchQuery: '',
      selectedAchievementId: null,
      totalPoints,
      unlockedCount,
      pinnedIds
    };
  }

  public getAchievement(id: string): AchievementItem | undefined {
    return this.achievements[id];
  }

  public resetState(): AchievementTrackerState {
    this.achievements = JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS));
    this.lastSequenceMap.clear();
    this.lastEventTimeMap.clear();
    this.eventCountWindowMap.clear();

    for (const ach of Object.values(this.achievements)) {
      if (ach.isUnlocked && !ach.receipt) {
        ach.receipt = AntiTamperSigner.generateUnlockReceipt(ach.id, 0);
      }
      if (ach.isUnlocked && ach.reward && !ach.reward.unlockToken) {
        ach.reward.unlockToken = AntiTamperSigner.generateRewardClaimToken(ach.id, ach.reward.id);
      }
    }
    return this.getState();
  }

  public togglePin(id: string): { success: boolean; pinnedIds: string[]; message?: string } {
    const item = this.achievements[id];
    if (!item) {
      return { success: false, pinnedIds: this.getState().pinnedIds, message: 'Achievement not found' };
    }
    const currentlyPinned = Object.values(this.achievements).filter(a => a.isPinned);
    if (!item.isPinned && currentlyPinned.length >= 3) {
      return { success: false, pinnedIds: currentlyPinned.map(a => a.id), message: 'Plinth showcase limited to top 3 achievements' };
    }
    item.isPinned = !item.isPinned;
    const updatedPinned = Object.values(this.achievements).filter(a => a.isPinned).map(a => a.id);
    return { success: true, pinnedIds: updatedPinned };
  }

  public claimReward(achievementId: string, providedToken?: string): { success: boolean; message: string; achievement?: AchievementItem } {
    const ach = this.achievements[achievementId];
    if (!ach) {
      return { success: false, message: 'Achievement not found' };
    }
    if (!ach.isUnlocked) {
      return { success: false, message: 'Achievement is locked. Cannot claim rewards.' };
    }
    if (!ach.reward) {
      return { success: false, message: 'No claimable reward attached to this milestone.' };
    }
    if (ach.reward.isClaimed) {
      return { success: false, message: 'Reward has already been claimed and vaulted.' };
    }

    // Verify token if provided
    if (providedToken) {
      const isValid = AntiTamperSigner.verifyRewardClaimToken(providedToken, achievementId, ach.reward.id);
      if (!isValid) {
        return { success: false, message: 'Security Alert: Invalid or tampered reward unlock token.' };
      }
    }

    ach.reward.isClaimed = true;
    ach.reward.claimedAt = new Date().toISOString();
    return { success: true, message: `Successfully claimed ${ach.reward.title}!`, achievement: ach };
  }

  public processTelemetry(payload: TelemetryPayload): EvaluationResult {
    const { event, metadata = {}, sequenceNumber, sessionId } = payload;

    // 1. Anti-Tamper Safeguard: Check sequence bounds
    const lastSeq = this.lastSequenceMap.get(sessionId) ?? 0;
    const seqValidation = AntiTamperSigner.validateSequence(lastSeq, sequenceNumber);
    if (!seqValidation.valid) {
      return {
        success: false,
        unlockedAchievements: [],
        updatedAchievements: [],
        tamperAlert: seqValidation.reason,
        receipts: []
      };
    }
    this.lastSequenceMap.set(sessionId, sequenceNumber);

    // 2. Anti-Tamper Safeguard: Rate limit checks (max 40 events/sec per session)
    const now = Date.now();
    const rateWindow = this.eventCountWindowMap.get(sessionId) || { count: 0, windowStart: now };
    if (now - rateWindow.windowStart > 1000) {
      rateWindow.count = 1;
      rateWindow.windowStart = now;
    } else {
      rateWindow.count += 1;
      if (rateWindow.count > 40) {
        return {
          success: false,
          unlockedAchievements: [],
          updatedAchievements: [],
          tamperAlert: `Abnormal event burst detected (${rateWindow.count} events/sec). Telemetry stream temporarily throttled.`,
          receipts: []
        };
      }
    }
    this.eventCountWindowMap.set(sessionId, rateWindow);

    // 3. Rule Evaluation Matrix
    const updatedList: AchievementItem[] = [];
    const newlyUnlocked: AchievementItem[] = [];
    const receipts: UnlockReceipt[] = [];

    switch (event) {
      case 'BOSS_DEFEATED': {
        const bossId = metadata.bossId;
        const noDamage = Boolean(metadata.noDamage);
        const comboFinish = Boolean(metadata.comboFinish);

        // combat_01: First Bloodline
        const c1 = this.achievements['combat_01'];
        if (c1 && !c1.isUnlocked) {
          c1.steps[0].current = 1; c1.steps[0].isCompleted = true;
          c1.steps[1].current = 1; c1.steps[1].isCompleted = true;
          updatedList.push(c1);
        }

        // combat_02: Flawless Decimation (Abyssal Dragon Lord, no damage)
        const c2 = this.achievements['combat_02'];
        if (c2 && !c2.isUnlocked) {
          if (bossId === 'dragon_01' || bossId === 'abyssal_dragon') {
            c2.steps[0].current = 1; c2.steps[0].isCompleted = true;
            if (noDamage) { c2.steps[1].current = 1; c2.steps[1].isCompleted = true; }
            if (comboFinish) { c2.steps[2].current = 1; c2.steps[2].isCompleted = true; }
            updatedList.push(c2);
          }
        }

        // combat_04: Void Zenith Executioner (Archons)
        const c4 = this.achievements['combat_04'];
        if (c4 && !c4.isUnlocked) {
          if (bossId === 'archon_ignis') { c4.steps[0].current = 1; c4.steps[0].isCompleted = true; updatedList.push(c4); }
          if (bossId === 'archon_glacies') { c4.steps[1].current = 1; c4.steps[1].isCompleted = true; updatedList.push(c4); }
          if (bossId === 'archon_fulgur') { c4.steps[2].current = 1; c4.steps[2].isCompleted = true; updatedList.push(c4); }
          if (bossId === 'archon_nihil') { c4.steps[3].current = 1; c4.steps[3].isCompleted = true; updatedList.push(c4); }
        }
        break;
      }

      case 'COMBO_INCREASED': {
        const count = Number(metadata.count || 0);
        const c3 = this.achievements['combat_03'];
        if (c3 && !c3.isUnlocked) {
          if (count >= 100) { c3.steps[0].current = 100; c3.steps[0].isCompleted = true; }
          c3.steps[1].current = Math.min(300, Math.max(c3.steps[1].current, count));
          if (c3.steps[1].current >= 300) c3.steps[1].isCompleted = true;

          c3.steps[2].current = Math.min(500, Math.max(c3.steps[2].current, count));
          if (c3.steps[2].current >= 500) c3.steps[2].isCompleted = true;
          updatedList.push(c3);
        }
        break;
      }

      case 'BEACON_DISCOVERED': {
        const sector = metadata.sector; // 'underbelly' | 'mid_tier' | 'apex'
        const e1 = this.achievements['exploration_01'];
        if (e1 && !e1.isUnlocked) {
          if (sector === 'apex' && e1.steps[2].current < 5) {
            e1.steps[2].current += 1;
            if (e1.steps[2].current >= 5) e1.steps[2].isCompleted = true;
            updatedList.push(e1);
          }
        }
        break;
      }

      case 'ORBITAL_DROP_COMPLETED': {
        const landedCleanly = Boolean(metadata.landedCleanly);
        const e2 = this.achievements['exploration_02'];
        if (e2 && !e2.isUnlocked) {
          e2.steps[0].current = 1; e2.steps[0].isCompleted = true;
          e2.steps[1].current = 1; e2.steps[1].isCompleted = true;
          if (landedCleanly) {
            e2.steps[2].current = 1;
            e2.steps[2].isCompleted = true;
          }
          updatedList.push(e2);
        }
        break;
      }

      case 'PRISM_HARMONIZED': {
        const prismColor = metadata.prismColor; // emerald, sapphire, ruby, amethyst, void
        const e3 = this.achievements['exploration_03'];
        if (e3) {
          const map: Record<string, number> = { emerald: 0, sapphire: 1, ruby: 2, amethyst: 3, void: 4 };
          if (map[prismColor] !== undefined) {
            const idx = map[prismColor];
            e3.steps[idx].current = 1;
            e3.steps[idx].isCompleted = true;
            updatedList.push(e3);
          }
        }
        break;
      }

      case 'ARTIFACT_SYNTHESIZED': {
        const purity = Number(metadata.purity || 0);
        const m1 = this.achievements['mastery_01'];
        if (m1 && !m1.isUnlocked) {
          m1.steps[0].current = 50; m1.steps[0].isCompleted = true;
          if (m1.steps[1].current < 50) {
            m1.steps[1].current = Math.min(50, m1.steps[1].current + 1);
            if (m1.steps[1].current >= 50) m1.steps[1].isCompleted = true;
          }
          if (purity >= 99) {
            m1.steps[2].current = 1;
            m1.steps[2].isCompleted = true;
          }
          updatedList.push(m1);
        }
        break;
      }

      case 'DISCIPLINE_LEVELED': {
        const discipline = metadata.discipline;
        const level = Number(metadata.level || 0);
        const m2 = this.achievements['mastery_02'];
        if (m2 && !m2.isUnlocked) {
          if (discipline === 'warpweaver') {
            m2.steps[4].current = Math.min(100, Math.max(m2.steps[4].current, level));
            if (m2.steps[4].current >= 100) m2.steps[4].isCompleted = true;
            updatedList.push(m2);
          } else if (discipline === 'aetheric') {
            m2.steps[5].current = Math.min(100, Math.max(m2.steps[5].current, level));
            if (m2.steps[5].current >= 100) m2.steps[5].isCompleted = true;
            updatedList.push(m2);
          }
        }
        break;
      }

      case 'TERMINAL_CIPHER_SOLVED': {
        const s1 = this.achievements['secret_01'];
        if (s1 && !s1.isUnlocked) {
          s1.steps[0].current = 1; s1.steps[0].isCompleted = true;
          s1.steps[1].current = 1; s1.steps[1].isCompleted = true;
          updatedList.push(s1);
        }
        break;
      }

      case 'MAP_GLITCH_TRIGGERED': {
        const s2 = this.achievements['secret_02'];
        if (s2 && !s2.isUnlocked) {
          s2.steps[0].current = 1; s2.steps[0].isCompleted = true;
          s2.steps[1].current = 1; s2.steps[1].isCompleted = true;
          updatedList.push(s2);
        }
        break;
      }

      case 'CORE_SACRIFICED': {
        const coreType = metadata.coreType; // sun, moon, infinity
        const s3 = this.achievements['secret_03'];
        if (s3 && !s3.isUnlocked) {
          s3.steps[0].current = 1; s3.steps[0].isCompleted = true;
          if (coreType === 'sun') { s3.steps[1].current = 1; s3.steps[1].isCompleted = true; }
          if (coreType === 'moon') { s3.steps[2].current = 1; s3.steps[2].isCompleted = true; }
          if (coreType === 'infinity') { s3.steps[3].current = 1; s3.steps[3].isCompleted = true; }
          updatedList.push(s3);
        }
        break;
      }

      default:
        break;
    }

    // Check completion criteria idempotently
    for (const item of updatedList) {
      const allStepsDone = item.steps.every(s => s.isCompleted || s.current >= s.target);
      if (allStepsDone && !item.isUnlocked) {
        item.isUnlocked = true;
        item.unlockedAt = new Date().toISOString();
        const receipt = AntiTamperSigner.generateUnlockReceipt(item.id, sequenceNumber);
        item.receipt = receipt;
        receipts.push(receipt);

        if (item.reward) {
          item.reward.unlockToken = AntiTamperSigner.generateRewardClaimToken(item.id, item.reward.id);
        }
        newlyUnlocked.push(item);
      }
    }

    return {
      success: true,
      unlockedAchievements: newlyUnlocked,
      updatedAchievements: updatedList,
      receipts
    };
  }
}
