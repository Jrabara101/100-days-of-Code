import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from './db.js';
import { mapsRegistry } from './maps.js';

export const gameRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/health
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      engine: 'Chronicles of Aethelgard Fastify Backend',
      timestamp: new Date().toISOString(),
    };
  });

  // GET /api/save - Retrieve current player save state
  fastify.get('/save', async (request, reply) => {
    try {
      const stmt = db.prepare('SELECT * FROM player_save WHERE id = ?');
      const row = stmt.get('default') as any;

      if (!row) {
        // Return initial state
        const initialSave = {
          status: 'EXPLORING',
          player: {
            position: {
              mapId: 'whispering_glade',
              x: 5,
              y: 10,
              facing: 'right',
            },
            inventory: [
              { id: 'lantern', name: 'Ancient Lantern', icon: 'lantern' },
            ],
            activeToolId: 'lantern',
          },
          narrativeFlags: {
            met_elder: false,
            golem_awakened: false,
            echo_viewed: false,
            has_flute: false,
            shrine_decided: false,
          },
          activeQuests: [
            {
              id: 'q1',
              title: 'The Resonant Slumber',
              description: 'Follow the ancient stone trail and speak with Elder Mael regarding the tremors.',
              isCompleted: false,
              objectives: [
                { text: 'Consult with Elder Mael at the stone circle', done: false },
                { text: 'Retrieve the Harmonic Flute from the southern grove', done: false },
                { text: 'Awaken the Dormant Golem guarding the mountain pass', done: false },
              ],
            },
          ],
          timeOfDay: 16.5, // 4:30 PM golden hour
        };
        return initialSave;
      }

      return {
        status: 'EXPLORING',
        player: {
          position: {
            mapId: row.map_id,
            x: row.player_x,
            y: row.player_y,
            facing: row.player_facing,
          },
          inventory: JSON.parse(row.inventory_json),
          activeToolId: row.active_tool_id,
        },
        narrativeFlags: JSON.parse(row.narrative_flags_json),
        activeQuests: JSON.parse(row.active_quests_json),
        timeOfDay: row.time_of_day,
        lastSaved: row.updated_at,
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to retrieve save state' });
    }
  });

  // POST /api/save - Upsert player save state
  fastify.post('/save', async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body || !body.player || !body.player.position) {
        return reply.status(400).send({ error: 'Invalid save payload structure' });
      }

      const { player, narrativeFlags = {}, activeQuests = [], timeOfDay = 12 } = body;
      const { position, inventory = [], activeToolId = null } = player;

      const upsertStmt = db.prepare(`
        INSERT INTO player_save (
          id, slot, map_id, player_x, player_y, player_facing,
          active_tool_id, time_of_day, inventory_json, narrative_flags_json,
          active_quests_json, updated_at
        ) VALUES (
          'default', 1, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, CURRENT_TIMESTAMP
        )
        ON CONFLICT(id) DO UPDATE SET
          map_id = excluded.map_id,
          player_x = excluded.player_x,
          player_y = excluded.player_y,
          player_facing = excluded.player_facing,
          active_tool_id = excluded.active_tool_id,
          time_of_day = excluded.time_of_day,
          inventory_json = excluded.inventory_json,
          narrative_flags_json = excluded.narrative_flags_json,
          active_quests_json = excluded.active_quests_json,
          updated_at = CURRENT_TIMESTAMP
      `);

      upsertStmt.run(
        position.mapId || 'whispering_glade',
        position.x,
        position.y,
        position.facing || 'down',
        activeToolId,
        timeOfDay,
        JSON.stringify(inventory),
        JSON.stringify(narrativeFlags),
        JSON.stringify(activeQuests)
      );

      return {
        success: true,
        message: 'Game state synced successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to persist game state' });
    }
  });

  // POST /api/choices - Record player story dilemma choice
  fastify.post('/choices', async (request, reply) => {
    try {
      const body = request.body as {
        chapterId: string;
        choiceNodeId: string;
        choiceText?: string;
      };

      if (!body.chapterId || !body.choiceNodeId) {
        return reply.status(400).send({ error: 'chapterId and choiceNodeId required' });
      }

      const stmt = db.prepare(
        'INSERT INTO choices (chapter_id, choice_node_id, choice_text) VALUES (?, ?, ?)'
      );
      const info = stmt.run(body.chapterId, body.choiceNodeId, body.choiceText || '');

      return {
        success: true,
        choiceId: info.lastInsertRowid,
        message: 'Narrative choice recorded in community chronicles',
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to submit choice' });
    }
  });

  // GET /api/choices/:chapterId/stats - Global community choices percentages
  fastify.get('/choices/:chapterId/stats', async (request, reply) => {
    try {
      const { chapterId } = request.params as { chapterId: string };

      // Query raw tallies for this chapter
      const stmt = db.prepare(`
        SELECT choice_node_id, choice_text, COUNT(*) as count
        FROM choices
        WHERE chapter_id = ?
        GROUP BY choice_node_id
      `);
      const rows = stmt.all(chapterId) as { choice_node_id: string; choice_text: string; count: number }[];

      // Organize into canonical dilemma comparison categories
      const countsMap = new Map<string, number>();
      rows.forEach((r) => countsMap.set(r.choice_node_id, r.count));

      // 1. Shrine dilemma
      const restoreCount = countsMap.get('restore_shrine') || 0;
      const harvestCount = countsMap.get('harvest_core') || 0;
      const shrineTotal = restoreCount + harvestCount || 1;

      // 2. Guardian dilemma
      const spareCount = countsMap.get('spare_guardian') || 0;
      const deactivateCount = countsMap.get('deactivate_guardian') || 0;
      const guardianTotal = spareCount + deactivateCount || 1;

      // 3. Mael trust dilemma
      const trustCount = countsMap.get('trust_elder_mael') || 0;
      const concealCount = countsMap.get('conceal_memory') || 0;
      const trustTotal = trustCount + concealCount || 1;

      return {
        chapterId,
        totalTravelers: rows.reduce((acc, cur) => acc + cur.count, 0),
        dilemmas: [
          {
            id: 'shrine_equilibrium',
            title: 'Fate of the Sunken Shrine',
            description: 'When touching the heart of the submerged sanctuary:',
            options: [
              {
                nodeId: 'restore_shrine',
                text: 'Restored the Sacred Waters',
                count: restoreCount,
                percentage: Math.round((restoreCount / shrineTotal) * 100),
              },
              {
                nodeId: 'harvest_core',
                text: 'Harvested the Core for Personal Power',
                count: harvestCount,
                percentage: Math.round((harvestCount / shrineTotal) * 100),
              },
            ],
          },
          {
            id: 'guardian_mercy',
            title: 'The Sentinel of Whispers',
            description: 'Confrontation with the guardian at the threshold:',
            options: [
              {
                nodeId: 'spare_guardian',
                text: 'Spared the Ancient Construct',
                count: spareCount,
                percentage: Math.round((spareCount / guardianTotal) * 100),
              },
              {
                nodeId: 'deactivate_guardian',
                text: 'Deactivated and Extinguished the Core',
                count: deactivateCount,
                percentage: Math.round((deactivateCount / guardianTotal) * 100),
              },
            ],
          },
          {
            id: 'memory_accord',
            title: 'The Burden of Memory',
            description: 'Upon discovering the sepia vision of the Sundering:',
            options: [
              {
                nodeId: 'trust_elder_mael',
                text: 'Shared the Memory Echo with Elder Mael',
                count: trustCount,
                percentage: Math.round((trustCount / trustTotal) * 100),
              },
              {
                nodeId: 'conceal_memory',
                text: 'Kept the Truth Concealed within Yourself',
                count: concealCount,
                percentage: Math.round((concealCount / trustTotal) * 100),
              },
            ],
          },
        ],
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to retrieve telemetry stats' });
    }
  });

  // GET /api/world/maps/:mapId - Deliver lightweight tilemap matrices and triggers
  fastify.get('/world/maps/:mapId', async (request, reply) => {
    const { mapId } = request.params as { mapId: string };
    const mapDef = mapsRegistry[mapId];

    if (!mapDef) {
      return reply.status(404).send({ error: `Map '${mapId}' not found` });
    }

    return mapDef;
  });
};
