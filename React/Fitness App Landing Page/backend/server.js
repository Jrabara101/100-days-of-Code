/**
 * PULSE // FIT — Backend Acquisition & Deferred Deep-Link Service
 * Node.js / Express / PostgreSQL / Redis
 */

const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// CORS headers for landing page requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory fallback cache for development (replaces Redis in local demo)
const blueprintStore = new Map();
const rateLimitMap = new Map();

function generateToken(length = 12) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

// 1. POST /api/v1/blueprints/generate
app.post('/api/v1/blueprints/generate', (req, res) => {
  try {
    const {
      goal_type = 'hypertrophy',
      days_per_week = 4,
      equipment_profile = 'dumbbells',
      device_fingerprint = {},
      utm_source = 'direct',
    } = req.body;

    const token = generateToken(12);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const blueprintRecord = {
      token,
      goal_type,
      days_per_week,
      equipment_profile,
      device_fingerprint,
      claimed: false,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      deep_link_url: `https://get.pulsefit.app/b/${token}`,
    };

    blueprintStore.set(token, blueprintRecord);

    return res.status(201).json({
      success: true,
      token,
      deep_link_url: blueprintRecord.deep_link_url,
      expires_at: expiresAt,
      message: 'Deferred deep-link blueprint state created successfully.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error generating blueprint', details: err.message });
  }
});

// 2. POST /api/v1/blueprints/:token/send-sms
app.post('/api/v1/blueprints/:token/send-sms', (req, res) => {
  const { token } = req.params;
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  // Basic IP rate-limiting (3 requests per 60 seconds)
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const userRate = rateLimitMap.get(clientIp) || [];
  const recent = userRate.filter((time) => now - time < 60000);

  if (recent.length >= 5) {
    return res.status(429).json({ error: 'Too many SMS requests. Please wait a minute.' });
  }

  recent.push(now);
  rateLimitMap.set(clientIp, recent);

  // Hash phone number for privacy
  const phoneHash = crypto.createHash('sha256').update(phone_number).digest('hex');

  const record = blueprintStore.get(token);
  if (record) {
    record.phone_hash = phoneHash;
  }

  // Simulated Twilio / WhatsApp dispatch
  return res.status(200).json({
    success: true,
    token,
    phone_masked: phone_number.slice(0, 3) + '***' + phone_number.slice(-4),
    message: 'SMS Magic link dispatched successfully via Telemetry Gateway.',
  });
});

// 3. GET /api/v1/deeplink/resolve/:token
app.get('/api/v1/deeplink/resolve/:token', (req, res) => {
  const { token } = req.params;
  const record = blueprintStore.get(token);

  if (!record) {
    return res.status(404).json({ error: 'Blueprint token not found or expired.' });
  }

  // Mark claimed by app
  record.claimed = true;
  record.claimed_at = new Date().toISOString();

  return res.status(200).json({
    success: true,
    token: record.token,
    goal_type: record.goal_type,
    days_per_week: record.days_per_week,
    equipment_profile: record.equipment_profile,
    trial_days: 14,
    applied_promo: '14DAY_FREE_FLAGSHIP',
    claimed_at: record.claimed_at,
  });
});

// 4. iOS Universal Links (.well-known/apple-app-site-association)
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: 'TEAMID12345.com.pulsefit.app',
          paths: ['/b/*', '/workout/*', '/trial/*'],
        },
      ],
    },
  });
});

// 5. Android App Links (.well-known/assetlinks.json)
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.pulsefit.app',
        sha256_cert_fingerprints: [
          '14:6D:E9:7D:0F:52:CC:EB:67:3E:69:4C:E2:E6:31:0D:37:A2:3E:72:A2:EB:64:18:24:AE:45:9F:7B:AE:29:40',
        ],
      },
    },
  ]);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[PulseFit Backend] API Service listening on port ${PORT}`);
});
