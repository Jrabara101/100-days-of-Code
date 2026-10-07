import crypto from 'crypto';
import { SERVER_ACHIEVEMENTS } from './achievementsData';
import { AchievementNode, TelemetryEvent } from './types';

const HMAC_SECRET = process.env.HMAC_SECRET || 'voxel_matrix_arch_secret_salt_2026';

// Mapping telemetry actions to target nodes and logic
const TELEMETRY_MAPPINGS: Record<string, { targetNode: string; metricName: string; defaultIncrement: number }> = {
  MINE_BEDROCK: { targetNode: 'node_ow_bedrock', metricName: 'Blocks', defaultIncrement: 50 },
  HARVEST_LOGS: { targetNode: 'node_ow_timber', metricName: 'Logs', defaultIncrement: 100 },
  CRAFT_CONDUIT: { targetNode: 'node_ow_conduit', metricName: 'Pylons', defaultIncrement: 6 },
  DRILL_BOREHOLE: { targetNode: 'node_ow_quarry', metricName: 'Boreholes', defaultIncrement: 1 },
  SMELT_TITAN_INGOT: { targetNode: 'node_ow_foundry', metricName: 'Ingots', defaultIncrement: 50 },
  IGNITE_PORTAL: { targetNode: 'node_nether_gate', metricName: 'Portals', defaultIncrement: 2 },
  REFINE_MAGMA: { targetNode: 'node_nether_crucible', metricName: 'Liters', defaultIncrement: 200 },
  CARVE_OBSIDIAN: { targetNode: 'node_nether_obsidian', metricName: 'Cores', defaultIncrement: 10 },
  IGNITE_PYROCLAST: { targetNode: 'node_nether_pyroclast', metricName: 'Dynamo', defaultIncrement: 1 },
  DESCEND_ABYSS: { targetNode: 'node_depths_abyss', metricName: 'Meters', defaultIncrement: 1000 },
  RESONATE_GEODE: { targetNode: 'node_depths_geode', metricName: 'Crystals', defaultIncrement: 50 },
  SIPHON_EXTRACT: { targetNode: 'node_depths_siphon', metricName: 'Voxels', defaultIncrement: 250 },
  DEFEAT_LEVIATHAN: { targetNode: 'node_depths_leviathan', metricName: 'Encounter', defaultIncrement: 1 },
  HARMONIZE_PRISMATIC: { targetNode: 'node_depths_prismatic', metricName: 'Harmonics', defaultIncrement: 1 },
  LAUNCH_SPIRE: { targetNode: 'node_cel_launchpad', metricName: 'Pillar', defaultIncrement: 1 },
  DEPLOY_SOLAR_SAIL: { targetNode: 'node_cel_solarsail', metricName: 'Sails', defaultIncrement: 2 },
  CONSTRUCT_AETHER_CITADEL: { targetNode: 'node_cel_citadel', metricName: 'Aether Stone', defaultIncrement: 2500 },
  DECRYPT_DYSON_SINGULARITY: { targetNode: 'node_cel_dyson', metricName: 'Singularity', defaultIncrement: 1 },
};

export interface EvaluationResult {
  status: 'UNLOCKED' | 'PROGRESS' | 'PREREQ_LOCKED' | 'ALREADY_UNLOCKED' | 'UNKNOWN_EVENT';
  node?: AchievementNode;
  token?: string;
  message: string;
  pulsePath?: string[];
  totalPoints: number;
  unlockedCount: number;
}

export class DAGEvaluator {
  private state: Record<string, AchievementNode>;

  constructor() {
    // Deep clone initial achievements
    this.state = JSON.parse(JSON.stringify(SERVER_ACHIEVEMENTS));
  }

  public getAchievements(): Record<string, AchievementNode> {
    return this.state;
  }

  public getAchievement(id: string): AchievementNode | undefined {
    return this.state[id];
  }

  public getTotalPoints(): number {
    return Object.values(this.state)
      .filter((n) => n.isUnlocked)
      .reduce((sum, n) => sum + n.points, 0);
  }

  public getUnlockedCount(): number {
    return Object.values(this.state).filter((n) => n.isUnlocked).length;
  }

  public generateUnlockToken(operatorId: string, nodeId: string): string {
    const timestamp = Date.now();
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    hmac.update(`${operatorId}:${nodeId}:${timestamp}`);
    return `0x${hmac.digest('hex').slice(0, 16).toUpperCase()}`;
  }

  public evaluateTelemetry(telemetry: TelemetryEvent, operatorId = 'player_prime'): EvaluationResult {
    const mapping = TELEMETRY_MAPPINGS[telemetry.event];
    const targetNodeId = telemetry.targetNode || (mapping ? mapping.targetNode : undefined);

    if (!targetNodeId || !this.state[targetNodeId]) {
      return {
        status: 'UNKNOWN_EVENT',
        message: `No achievement criteria mapped to event: ${telemetry.event}`,
        totalPoints: this.getTotalPoints(),
        unlockedCount: this.getUnlockedCount(),
      };
    }

    const node = this.state[targetNodeId];

    // 1. Idempotency Check: Already unlocked
    if (node.isUnlocked) {
      return {
        status: 'ALREADY_UNLOCKED',
        node,
        token: node.unlockToken,
        message: `Milestone "${node.title}" has already been verified and claimed.`,
        totalPoints: this.getTotalPoints(),
        unlockedCount: this.getUnlockedCount(),
      };
    }

    // 2. DAG Prerequisite Check
    const parents = node.parentIds.map((pId) => this.state[pId]);
    const allParentsUnlocked = parents.every((p) => p && p.isUnlocked);

    if (!allParentsUnlocked) {
      const lockedParentTitles = parents
        .filter((p) => !p || !p.isUnlocked)
        .map((p) => p?.title || 'Unknown')
        .join(', ');

      return {
        status: 'PREREQ_LOCKED',
        node,
        message: `Prerequisite DAG locked: Requires completion of [${lockedParentTitles}] first.`,
        totalPoints: this.getTotalPoints(),
        unlockedCount: this.getUnlockedCount(),
      };
    }

    // 3. Progress Increment
    const increment = telemetry.increment ?? telemetry.count ?? (mapping ? mapping.defaultIncrement : 1);
    node.progress.current = Math.min(node.progress.target, node.progress.current + increment);

    // 4. Unlock Condition Evaluation
    if (node.progress.current >= node.progress.target) {
      node.isUnlocked = true;
      node.unlockedAt = new Date().toISOString();
      const token = this.generateUnlockToken(operatorId, node.id);
      node.unlockToken = token;

      // Calculate conduit pulse path (parents -> current)
      const pulsePath = [...node.parentIds, node.id];

      return {
        status: 'UNLOCKED',
        node,
        token,
        pulsePath,
        message: `CRITERIA MET: Authoritative token minted for [${node.title}].`,
        totalPoints: this.getTotalPoints(),
        unlockedCount: this.getUnlockedCount(),
      };
    }

    return {
      status: 'PROGRESS',
      node,
      message: `Telemetry recorded: [${node.title}] progress updated to ${node.progress.current}/${node.progress.target} ${node.progress.unit}.`,
      totalPoints: this.getTotalPoints(),
      unlockedCount: this.getUnlockedCount(),
    };
  }

  // Force unlock a node directly (e.g. for testing / debugging)
  public forceUnlock(nodeId: string, operatorId = 'player_prime'): EvaluationResult {
    const node = this.state[nodeId];
    if (!node) {
      return {
        status: 'UNKNOWN_EVENT',
        message: `Node ${nodeId} not found.`,
        totalPoints: this.getTotalPoints(),
        unlockedCount: this.getUnlockedCount(),
      };
    }

    node.progress.current = node.progress.target;
    node.isUnlocked = true;
    node.unlockedAt = new Date().toISOString();
    const token = this.generateUnlockToken(operatorId, node.id);
    node.unlockToken = token;
    const pulsePath = [...node.parentIds, node.id];

    return {
      status: 'UNLOCKED',
      node,
      token,
      pulsePath,
      message: `Directly authorized unlock for [${node.title}].`,
      totalPoints: this.getTotalPoints(),
      unlockedCount: this.getUnlockedCount(),
    };
  }

  public resetState() {
    this.state = JSON.parse(JSON.stringify(SERVER_ACHIEVEMENTS));
  }
}

export const dagEvaluator = new DAGEvaluator();
