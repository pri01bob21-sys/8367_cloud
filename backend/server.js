const express = require('express');
const cors = require('cors');
const { connect, StringCodec } = require('nats');
const pool = require('./db');

const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();

app.use(cors());
app.use(express.json());

async function storeData(payload) {
  const { hostname, ip_address, ...rest } = payload;
  await pool.query(
    'INSERT INTO switch_data (hostname, ip_address, data) VALUES ($1, $2, $3)',
    [hostname || null, ip_address || null, JSON.stringify(rest)]
  );
}

// POST /update_switch - REST entry point for switches
app.post('/update_switch', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ error: 'JSON object body required' });
    }
    await storeData(payload);
    console.log('[REST] stored switch data from', payload.hostname || 'unknown');
    res.json({ message: 'Data stored successfully' });
  } catch (err) {
    console.error('[REST] error storing data:', err.message);
    res.status(500).json({ error: 'Error storing data' });
  }
});

// GET /get_data - fetch recent records for the frontend
app.get('/get_data', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 500);
    const result = await pool.query(
      'SELECT id, hostname, ip_address, data, created_at FROM switch_data ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[REST] error fetching data:', err.message);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// GET /switches - distinct active switches
app.get('/switches', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT hostname, ip_address, MAX(created_at) AS last_seen
       FROM switch_data
       GROUP BY hostname, ip_address
       ORDER BY last_seen DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[REST] error fetching switches:', err.message);
    res.status(500).json({ error: 'Error fetching switches' });
  }
});

// GET /health
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// NATS subscriber - receives switch.update messages from the network
async function connectNats() {
  const maxRetries = 10;
  let nc;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      nc = await connect({ servers: NATS_URL });
      console.log(`[NATS] connected to ${NATS_URL}`);
      break;
    } catch (err) {
      console.warn(`[NATS] attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) {
        console.error('[NATS] giving up; running without NATS');
        return;
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }

  const sub = nc.subscribe('switch.update');
  console.log('[NATS] subscribed to switch.update');

  (async () => {
    for await (const msg of sub) {
      try {
        const payload = JSON.parse(sc.decode(msg.data));
        await storeData(payload);
        console.log('[NATS] stored message from', payload.hostname || 'unknown');
      } catch (err) {
        console.error('[NATS] error processing message:', err.message);
      }
    }
  })();

  nc.closed().then(() => console.warn('[NATS] connection closed'));
}

app.listen(PORT, () => {
  console.log(`[Server] listening on port ${PORT}`);
  connectNats().catch(err => console.error('[NATS] fatal:', err.message));
});
