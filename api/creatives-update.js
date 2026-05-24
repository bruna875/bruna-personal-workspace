import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'Missing id or name' });

    const sql = neon(process.env.DATABASE_URL);
    await sql`UPDATE creatives SET creative_name = ${name} WHERE creative_id = ${id}`;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('creatives-update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
