import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS airod_state (
    id INT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}

export default async function handler(req, res) {
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`SELECT data, updated_at FROM airod_state WHERE id = 1`;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(
        rows.length
          ? { data: rows[0].data, updated_at: rows[0].updated_at }
          : { data: null }
      );
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
      await sql`
        INSERT INTO airod_state (id, data, updated_at)
        VALUES (1, ${JSON.stringify(body)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error: ' + (e && e.message ? e.message : String(e)) });
  }
}
