import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../db.js';

export const tilesetRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Built-in biomes metadata
  const builtInBiomes = [
    {
      id: 'grass',
      name: 'Grass Overworld',
      category: 'nature',
      tileWidth: 32,
      tileHeight: 32,
      description: 'Lush green turf with cliff strata, grassy overhangs, rock variants, and wildflower props.',
      defaultCollision: 'solid',
      props: ['flower_red', 'flower_yellow', 'mushroom', 'pebbles', 'moss_patch']
    },
    {
      id: 'stone',
      name: 'Castle Bastion',
      category: 'dungeon',
      tileWidth: 32,
      tileHeight: 32,
      description: 'Chiseled dark masonry, fortress battlements, reinforced dungeon slabs, and wall cracks.',
      defaultCollision: 'solid',
      props: ['torch_sconce', 'banner', 'wall_crack', 'iron_grate', 'chains']
    },
    {
      id: 'magma',
      name: 'Magma Cavern',
      category: 'volcano',
      tileWidth: 32,
      tileHeight: 32,
      description: 'Basalt rock crags, glowing molten lava edges, obsidian crusts, and smoking sulfur vents.',
      defaultCollision: 'solid',
      props: ['lava_bubble', 'steam_vent', 'obsidian_crystal', 'skull', 'fire_flower']
    },
    {
      id: 'cyber',
      name: 'Neon Cyber Foundry',
      category: 'scifi',
      tileWidth: 32,
      tileHeight: 32,
      description: 'Carbon alloy plating, cyan conduit runs, holographic grates, and pulsing capacitor hazards.',
      defaultCollision: 'solid',
      props: ['hologram_ad', 'circuit_node', 'laser_emitter', 'battery_cell', 'terminal']
    }
  ];

  // List tilesets (combines built-in biomes and uploaded ones)
  fastify.get('/api/tilesets', async (request, reply) => {
    try {
      const stmt = db.prepare('SELECT * FROM tilesets ORDER BY created_at DESC');
      const rows = stmt.all() as any[];

      const uploaded = rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        tileWidth: r.tile_width,
        tileHeight: r.tile_height,
        dataUrl: r.data_url,
        collisionRules: r.collision_rules_json ? JSON.parse(r.collision_rules_json) : {},
        createdAt: r.created_at,
        isCustom: true
      }));

      return reply.send({
        success: true,
        biomes: builtInBiomes,
        customTilesets: uploaded,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to get tilesets', message: err.message });
    }
  });

  // Upload/slice sprite sheets endpoint
  fastify.post<{ Body: any }>('/api/tilesets/upload', async (request, reply) => {
    try {
      const body = request.body || {};
      const { name, category, tileWidth, tileHeight, dataUrl, collisionRules } = body;

      if (!name || !tileWidth || !tileHeight) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Tileset name, tileWidth, and tileHeight are required'
        });
      }

      const id = `tileset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO tilesets (id, name, category, tile_width, tile_height, data_url, collision_rules_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        name,
        category || 'custom',
        Number(tileWidth) || 32,
        Number(tileHeight) || 32,
        dataUrl || null,
        JSON.stringify(collisionRules || {}),
        now
      );

      return reply.status(201).send({
        success: true,
        message: 'Tileset ingested and indexed successfully',
        tileset: {
          id,
          name,
          category: category || 'custom',
          tileWidth: Number(tileWidth) || 32,
          tileHeight: Number(tileHeight) || 32,
          dataUrl,
          collisionRules: collisionRules || {},
        }
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to ingest tileset', message: err.message });
    }
  });
};
