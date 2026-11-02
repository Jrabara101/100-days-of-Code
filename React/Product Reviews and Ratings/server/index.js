/**
 * Hollis Trust & Reviews Governance Engine - Backend API Service
 * Node.js / Express Microservice
 */

const http = require('http');
const { scanTextEntities, sanitizeText, computeRiskScore } = require('./trustEngine');

const PORT = process.env.PORT || 4000;

// Simple lightweight HTTP API server without requiring extra npm packages
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Hollis Trust Kernel v4.2' }));
    return;
  }

  // Pre-insert Linter endpoint
  if (url.pathname === '/api/lint-review' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const analysis = computeRiskScore(payload);
        const sanitized = sanitizeText(payload.body);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...analysis,
          sanitizedBody: sanitized
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`[Hollis Trust API] Listening on port ${PORT}`);
});

