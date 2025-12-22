import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = 3001;

const mockProducts = [
  { id: '1', name: 'Neural Omni Headphones', price: 349.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', category: 'Audio', confidence: 0.98, stock: 15 },
  { id: '2', name: 'Quantum Glass Smartwatch', price: 299.00, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', category: 'Wearables', confidence: 0.85, stock: 8 },
  { id: '3', name: 'Holographic Desk Lamp', price: 120.50, image: 'https://images.unsplash.com/photo-1507473888900-52e1ad147233?w=800&q=80', category: 'Home', confidence: 0.72, stock: 20 },
  { id: '4', name: 'Aero Levitating Speaker', price: 199.99, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', category: 'Audio', confidence: 0.95, stock: 5 },
  { id: '5', name: 'Ergo Key Mechanical', price: 150.00, image: 'https://images.unsplash.com/photo-1587829741301-379b3f3aae4c?w=800&q=80', category: 'Computing', confidence: 0.60, stock: 30 },
  { id: '6', name: 'Vision Pro Stand', price: 89.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', category: 'Accessories', confidence: 0.45, stock: 12 },
];

const httpServer = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Mock ML API Endpoint
  if (req.url === '/api/recommendations' && req.method === 'GET') {
    // Simulate ML processing delay
    setTimeout(() => {
        // Return products sorted by "confidence" (neural score)
        const sorted = [...mockProducts].sort((a, b) => b.confidence - a.confidence);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sorted));
    }, 500);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all for dev
    methods: ["GET", "POST"]
  }
});

// Inventory Simulation
setInterval(() => {
  // Pick a random product to decrease stock
  const randomIndex = Math.floor(Math.random() * mockProducts.length);
  const product = mockProducts[randomIndex];
  
  if (product.stock > 0) {
      if (Math.random() > 0.7) { // 30% chance to decrease stock
        product.stock--;
        console.log(`[Inventory] ${product.name} stock decreased to ${product.stock}`);
        io.emit('inventory_update', { id: product.id, stock: product.stock });
      }
  }
}, 3000); // Check every 3 seconds

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`> Mock ML API & Socket Server ready on http://localhost:${PORT}`);
});
