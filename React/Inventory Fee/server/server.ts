import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { ledgerEngine } from './engine/ledger';
import { reservationEngine } from './engine/reservations';
import { calculateDepletionForecasts, getSupplierDriftAnalysis, getCycleCounts, submitCycleCount } from './engine/forecasting';

const server = Fastify({
  logger: {
    level: 'info',
  },
});

async function main() {
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await server.register(websocket);

  // Maintain active WebSocket connections
  const connectedClients = new Set<any>();

  server.get('/ws', { websocket: true }, (connection: any) => {
    const socket = connection.socket || connection;
    connectedClients.add(socket);
    server.log.info('Warehouse station WebSocket client connected');

    // Send initial snapshot
    socket.send(JSON.stringify({
      type: 'INIT_SYNC',
      payload: {
        timestamp: new Date().toISOString(),
        totalItems: ledgerEngine.getItems().length,
        activeReservations: reservationEngine.getActiveLocks().length,
      }
    }));

    socket.on('close', () => {
      connectedClients.delete(socket);
      server.log.info('Warehouse station WebSocket client disconnected');
    });

    socket.on('error', (err: any) => {
      server.log.error('WS Socket error', err);
      connectedClients.delete(socket);
    });
  });

  // Broadcast helper
  function broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload });
    for (const client of connectedClients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  // Subscribe to ledger updates
  ledgerEngine.subscribe((event, payload) => {
    broadcast(event, payload);
  });

  // Subscribe to reservation updates
  reservationEngine.subscribe((event, payload) => {
    broadcast(event, payload);
  });

  // REST API Routes

  // 1. Get Inventory Items with search, status filter, and category
  server.get('/api/inventory', async (request, reply) => {
    const { q, status, category } = request.query as { q?: string; status?: string; category?: string };
    let items = ledgerEngine.getItems();

    if (q) {
      const query = q.toLowerCase();
      items = items.filter(
        item => item.sku.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.upc.includes(query) ||
          item.primaryLocation.bin.toLowerCase().includes(query)
      );
    }

    if (status && status !== 'ALL') {
      items = items.filter(item => item.status === status);
    }

    if (category && category !== 'ALL') {
      items = items.filter(item => item.category === category);
    }

    return reply.send({
      success: true,
      data: items,
      totalCount: items.length,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Get Single Item Telemetry & Movement History
  server.get('/api/inventory/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = ledgerEngine.getItemById(id) || ledgerEngine.getItemBySkuOrUpc(id);
    if (!item) {
      return reply.status(404).send({ success: false, message: 'SKU or Item not found' });
    }

    const history = ledgerEngine.getTransactions(item.id);
    const forecasts = calculateDepletionForecasts().find(f => f.sku === item.sku);

    return reply.send({
      success: true,
      data: {
        item,
        history,
        forecast: forecasts,
      },
    });
  });

  // 3. Transactions Log
  server.get('/api/inventory/transactions', async (request, reply) => {
    const { itemId } = request.query as { itemId?: string };
    const txns = ledgerEngine.getTransactions(itemId);
    return reply.send({ success: true, data: txns });
  });

  // 4. Inbound Receive Shipment
  server.post('/api/inventory/receive', async (request, reply) => {
    try {
      const { itemId, quantity, poNumber, operatorId, notes } = request.body as {
        itemId: string;
        quantity: number;
        poNumber: string;
        operatorId: string;
        notes?: string;
      };

      if (!itemId || !quantity || quantity <= 0) {
        return reply.status(400).send({ success: false, message: 'Invalid receive parameters' });
      }

      const result = ledgerEngine.appendTransaction({
        itemId,
        type: 'INBOUND',
        quantityDelta: Number(quantity),
        operatorId: operatorId || 'OP-SCANNER',
        reasonNotes: `Inbound PO Receipt [${poNumber || 'PO-DIRECT'}]: ${notes || 'Pallet scan verified'}`,
      });

      return reply.send({
        success: true,
        data: result,
        message: `Successfully received +${quantity} units for ${result.item.sku}`,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 5. Adjust Stock (Damage, Shrinkage, Spot Count)
  server.post('/api/inventory/adjust', async (request, reply) => {
    try {
      const { itemId, delta, reasonType, notes, operatorId } = request.body as {
        itemId: string;
        delta: number;
        reasonType: 'CYCLE_COUNT' | 'SCRAP' | 'OUTBOUND';
        notes: string;
        operatorId: string;
      };

      if (!itemId || delta === 0) {
        return reply.status(400).send({ success: false, message: 'Delta cannot be zero' });
      }

      const result = ledgerEngine.appendTransaction({
        itemId,
        type: reasonType || 'CYCLE_COUNT',
        quantityDelta: Number(delta),
        operatorId: operatorId || 'OP-AUDIT',
        reasonNotes: notes || `Manual stock adjustment (${reasonType})`,
      });

      return reply.send({
        success: true,
        data: result,
        message: `Adjusted ${result.item.sku} by ${delta > 0 ? '+' : ''}${delta} units`,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 6. Transfer Between Bins
  server.post('/api/inventory/transfer', async (request, reply) => {
    try {
      const { itemId, sourceBinId, destinationBinId, quantity, operatorId, notes } = request.body as {
        itemId: string;
        sourceBinId: string;
        destinationBinId: string;
        quantity: number;
        operatorId: string;
        notes?: string;
      };

      const result = ledgerEngine.transferBin({
        itemId,
        sourceBinId,
        destinationBinId,
        quantity: Number(quantity),
        operatorId: operatorId || 'OP-FORKLIFT',
        notes,
      });

      return reply.send({
        success: true,
        data: result,
        message: `Transferred ${quantity} units from ${sourceBinId} to ${destinationBinId}`,
      });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 7. Get All Warehouse Bins
  server.get('/api/inventory/bins', async (request, reply) => {
    const bins = ledgerEngine.getBins();
    return reply.send({ success: true, data: bins });
  });

  // 8. Multi-Channel Reservation Engine
  server.get('/api/reservations', async (request, reply) => {
    const locks = reservationEngine.getActiveLocks();
    return reply.send({ success: true, data: locks });
  });

  server.post('/api/inventory/reserve', async (request, reply) => {
    try {
      const { itemId, sku, quantity, channel, orderRef, ttlMinutes } = request.body as {
        itemId: string;
        sku: string;
        quantity: number;
        channel: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM';
        orderRef: string;
        ttlMinutes?: number;
      };

      const lock = reservationEngine.createLock({
        itemId,
        sku,
        quantity: Number(quantity),
        channel,
        orderRef,
        ttlMinutes: ttlMinutes || 15,
      });

      return reply.send({ success: true, data: lock });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  server.post('/api/inventory/commit-reservation', async (request, reply) => {
    try {
      const { lockId, operatorId } = request.body as { lockId: string; operatorId?: string };
      const lock = reservationEngine.commitLock(lockId, operatorId);
      return reply.send({ success: true, data: lock });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  server.post('/api/inventory/release-reservation', async (request, reply) => {
    try {
      const { lockId, reason } = request.body as { lockId: string; reason?: string };
      const lock = reservationEngine.releaseLock(lockId, reason || 'MANUAL_RELEASE');
      return reply.send({ success: true, data: lock });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 9. Predictive Analytics & Depletion Forecasts
  server.get('/api/analytics/forecast', async (request, reply) => {
    const forecasts = calculateDepletionForecasts();
    return reply.send({ success: true, data: forecasts });
  });

  // 10. Supplier Drift & Price-Creep Radar
  server.get('/api/suppliers/drift', async (request, reply) => {
    const suppliers = getSupplierDriftAnalysis();
    return reply.send({ success: true, data: suppliers });
  });

  // 11. Cycle-Count Sentry & Shrinkage
  server.get('/api/cycle-count', async (request, reply) => {
    const tasks = getCycleCounts();
    return reply.send({ success: true, data: tasks });
  });

  server.post('/api/cycle-count/submit', async (request, reply) => {
    try {
      const { taskId, countedQuantity, operatorId, notes } = request.body as {
        taskId: string;
        countedQuantity: number;
        operatorId: string;
        notes?: string;
      };

      const task = submitCycleCount({
        taskId,
        countedQuantity: Number(countedQuantity),
        operatorId: operatorId || 'OP-SPOT-AUDIT',
        notes,
      });

      return reply.send({ success: true, data: task });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 12. Digital Twin Visual Schematic & Heatmap Data
  server.get('/api/warehouse/digital-twin', async (request, reply) => {
    const bins = ledgerEngine.getBins();
    const items = ledgerEngine.getItems();

    const zones = [
      { id: 'ZONE-A', name: 'Zone A - High Velocity Pick Reticles', temp: 'Ambient (21°C)', aisleCount: 2, pickPathEfficiency: '98%' },
      { id: 'ZONE-B', name: 'Zone B - Precision Vault (Cleanroom)', temp: 'Secure Vault (19°C)', aisleCount: 1, pickPathEfficiency: '92%' },
      { id: 'ZONE-C', name: 'Zone C - Cryo & Cold Chain (-20°C)', temp: 'Cold Chain (-20°C)', aisleCount: 1, pickPathEfficiency: '89%' },
      { id: 'ZONE-D', name: 'Zone D - Heavy Bulk & Aerospace Chassis', temp: 'Ambient Heavy (22°C)', aisleCount: 2, pickPathEfficiency: '94%' },
    ];

    return reply.send({
      success: true,
      data: {
        warehouseId: 'WH-04 Austin Logistics Hub',
        zones,
        bins,
        itemsSummary: {
          totalSkus: items.length,
          totalUnitsOnHand: items.reduce((acc, it) => acc + it.quantityOnHand, 0),
          totalValuationUSD: items.reduce((acc, it) => acc + (it.quantityOnHand * it.costPrice), 0),
        },
      }
    });
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005;
  await server.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[AeroLogix Server] Backend listening on http://localhost:${PORT}`);
  console.log(`[AeroLogix Server] WebSocket push channel ready at ws://localhost:${PORT}/ws`);
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
