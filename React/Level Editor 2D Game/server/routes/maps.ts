import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../db.js';

export const mapRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all maps
  fastify.get('/api/maps', async (request, reply) => {
    try {
      const stmt = db.prepare(`
        SELECT 
          m.id, m.title, m.author, m.description, m.width, m.height, m.tile_size, 
          m.tags_json, m.forked_from_id, m.created_at, m.updated_at,
          COUNT(CASE WHEN t.event_type = 'clear' THEN 1 END) as clear_count,
          COUNT(CASE WHEN t.event_type = 'death' THEN 1 END) as death_count
        FROM maps m
        LEFT JOIN telemetry t ON m.id = t.map_id
        GROUP BY m.id
        ORDER BY m.updated_at DESC
      `);
      const rows = stmt.all() as any[];

      const formatted = rows.map((r) => ({
        id: r.id,
        title: r.title,
        author: r.author,
        description: r.description,
        dimensions: {
          widthInTiles: r.width,
          heightInTiles: r.height,
          tileSize: r.tile_size,
        },
        tags: r.tags_json ? JSON.parse(r.tags_json) : [],
        forkedFromId: r.forked_from_id,
        clearCount: Number(r.clear_count || 0),
        deathCount: Number(r.death_count || 0),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return reply.send({ success: true, maps: formatted });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to retrieve maps', message: err.message });
    }
  });

  // Get map by ID
  fastify.get<{ Params: { id: string } }>('/api/maps/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const stmt = db.prepare('SELECT * FROM maps WHERE id = ?');
      const row = stmt.get(id) as any;

      if (!row) {
        return reply.status(404).send({ error: 'Map blueprint not found' });
      }

      const map = {
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description,
        dimensions: {
          widthInTiles: row.width,
          heightInTiles: row.height,
          tileSize: row.tile_size,
        },
        layers: JSON.parse(row.layers_json),
        entities: JSON.parse(row.entities_json),
        tags: row.tags_json ? JSON.parse(row.tags_json) : [],
        forkedFromId: row.forked_from_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return reply.send({ success: true, map });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to get map', message: err.message });
    }
  });

  // Create a new map
  fastify.post<{ Body: any }>('/api/maps', async (request, reply) => {
    const body = request.body || {};
    try {
      const id = body.id || `map-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = body.title || 'Untitled Level';
      const author = body.author || 'Level Designer';
      const description = body.description || '';
      const dimensions = body.dimensions || { widthInTiles: 32, heightInTiles: 20, tileSize: 32 };
      const layers = body.layers || [];
      const entities = body.entities || [];
      const tags = body.tags || ['custom'];
      const forkedFromId = body.forkedFromId || null;
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO maps (id, title, author, description, width, height, tile_size, layers_json, entities_json, tags_json, forked_from_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        title,
        author,
        description,
        dimensions.widthInTiles,
        dimensions.heightInTiles,
        dimensions.tileSize,
        JSON.stringify(layers),
        JSON.stringify(entities),
        JSON.stringify(tags),
        forkedFromId,
        now,
        now
      );

      return reply.status(201).send({
        success: true,
        message: 'Map saved successfully',
        id,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to create map', message: err.message });
    }
  });

  // Update map
  fastify.put<{ Params: { id: string }; Body: any }>('/api/maps/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body || {};
    try {
      const checkStmt = db.prepare('SELECT id FROM maps WHERE id = ?');
      const existing = checkStmt.get(id);

      const now = new Date().toISOString();

      if (!existing) {
        // Create if doesn't exist
        const stmt = db.prepare(`
          INSERT INTO maps (id, title, author, description, width, height, tile_size, layers_json, entities_json, tags_json, forked_from_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          id,
          body.title || 'Untitled Level',
          body.author || 'Level Designer',
          body.description || '',
          body.dimensions?.widthInTiles || 32,
          body.dimensions?.heightInTiles || 20,
          body.dimensions?.tileSize || 32,
          JSON.stringify(body.layers || []),
          JSON.stringify(body.entities || []),
          JSON.stringify(body.tags || []),
          body.forkedFromId || null,
          now,
          now
        );
        return reply.send({ success: true, message: 'Map created', id });
      }

      const stmt = db.prepare(`
        UPDATE maps 
        SET title = ?, author = ?, description = ?, width = ?, height = ?, tile_size = ?, layers_json = ?, entities_json = ?, tags_json = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        body.title || 'Untitled Level',
        body.author || 'Level Designer',
        body.description || '',
        body.dimensions?.widthInTiles || 32,
        body.dimensions?.heightInTiles || 20,
        body.dimensions?.tileSize || 32,
        JSON.stringify(body.layers || []),
        JSON.stringify(body.entities || []),
        JSON.stringify(body.tags || []),
        now,
        id
      );

      return reply.send({ success: true, message: 'Map updated', id });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to update map', message: err.message });
    }
  });

  // Delete map
  fastify.delete<{ Params: { id: string } }>('/api/maps/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const stmt = db.prepare('DELETE FROM maps WHERE id = ?');
      stmt.run(id);

      const teleStmt = db.prepare('DELETE FROM telemetry WHERE map_id = ?');
      teleStmt.run(id);

      return reply.send({ success: true, message: 'Map deleted', id });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete map', message: err.message });
    }
  });

  // Fork map
  fastify.post<{ Params: { id: string }; Body: any }>('/api/maps/:id/fork', async (request, reply) => {
    const { id } = request.params;
    const body = request.body || {};
    try {
      const stmt = db.prepare('SELECT * FROM maps WHERE id = ?');
      const row = stmt.get(id) as any;

      if (!row) {
        return reply.status(404).send({ error: 'Original map to fork not found' });
      }

      const newId = `map-fork-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newTitle = body.title || `${row.title} (Fork)`;
      const newAuthor = body.author || 'Forked Creator';
      const now = new Date().toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO maps (id, title, author, description, width, height, tile_size, layers_json, entities_json, tags_json, forked_from_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        newId,
        newTitle,
        newAuthor,
        `Forked from "${row.title}" by ${row.author}`,
        row.width,
        row.height,
        row.tile_size,
        row.layers_json,
        row.entities_json,
        JSON.stringify([...(row.tags_json ? JSON.parse(row.tags_json) : []), 'fork']),
        id,
        now,
        now
      );

      return reply.status(201).send({
        success: true,
        message: 'Map forked successfully',
        id: newId,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to fork map', message: err.message });
    }
  });

  // Community Telemetry endpoint
  fastify.post<{ Params: { id: string }; Body: any }>('/api/maps/:id/telemetry', async (request, reply) => {
    const { id } = request.params;
    const { eventType, clearTimeMs, score, deathX, deathY } = request.body || {};

    try {
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO telemetry (map_id, event_type, clear_time_ms, score, death_x, death_y, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        eventType || 'play',
        clearTimeMs || null,
        score || null,
        deathX !== undefined ? deathX : null,
        deathY !== undefined ? deathY : null,
        now
      );

      return reply.send({ success: true, message: 'Telemetry recorded' });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to log telemetry', message: err.message });
    }
  });

  // Community Heatmap Store endpoint
  fastify.get<{ Params: { id: string } }>('/api/maps/:id/heatmap', async (request, reply) => {
    const { id } = request.params;
    try {
      const deathStmt = db.prepare(`
        SELECT death_x as x, death_y as y, created_at
        FROM telemetry
        WHERE map_id = ? AND event_type = 'death' AND death_x IS NOT NULL AND death_y IS NOT NULL
      `);
      const deaths = deathStmt.all(id) as any[];

      // Aggregation: cluster coordinates within ~24px radius
      const clusterMap: Record<string, { x: number; y: number; count: number }> = {};
      const clusterRadius = 24;

      for (const d of deaths) {
        const cx = Math.round(d.x / clusterRadius) * clusterRadius;
        const cy = Math.round(d.y / clusterRadius) * clusterRadius;
        const key = `${cx},${cy}`;
        if (!clusterMap[key]) {
          clusterMap[key] = { x: cx, y: cy, count: 0 };
        }
        clusterMap[key].count += 1;
      }

      const points = Object.values(clusterMap);

      // Fetch statistics
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(CASE WHEN event_type = 'clear' THEN 1 END) as clears,
          COUNT(CASE WHEN event_type = 'death' THEN 1 END) as deaths,
          MIN(CASE WHEN event_type = 'clear' THEN clear_time_ms END) as best_time_ms,
          AVG(CASE WHEN event_type = 'clear' THEN clear_time_ms END) as avg_time_ms
        FROM telemetry
        WHERE map_id = ?
      `);
      const stats = (statsStmt.get(id) as any) || {};

      return reply.send({
        success: true,
        mapId: id,
        totalDeaths: deaths.length,
        points,
        stats: {
          clears: Number(stats.clears || 0),
          deaths: Number(stats.deaths || 0),
          bestTimeMs: stats.best_time_ms ? Math.round(stats.best_time_ms) : null,
          avgTimeMs: stats.avg_time_ms ? Math.round(stats.avg_time_ms) : null,
          clearRate:
            Number(stats.clears || 0) + Number(stats.deaths || 0) > 0
              ? Math.round(
                  (Number(stats.clears || 0) / (Number(stats.clears || 0) + Number(stats.deaths || 0))) * 100
                )
              : 0,
        },
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate heatmap', message: err.message });
    }
  });
};
