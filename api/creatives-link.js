import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, creative_ids } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
    if (!Array.isArray(creative_ids)) return res.status(400).json({ error: 'creative_ids must be an array' });

    const sql = neon(process.env.DATABASE_URL);
    const cid = parseInt(campaign_id);

    if (creative_ids.length > 0) {
      const ids = creative_ids.map(id => parseInt(id));
      // Unlink creatives previously on this campaign that are no longer selected
      await sql`UPDATE creatives SET campaign_id = NULL WHERE campaign_id = ${cid} AND creative_id != ALL(${ids})`;
      // Link selected creatives to this campaign
      await sql`UPDATE creatives SET campaign_id = ${cid} WHERE creative_id = ANY(${ids})`;
    } else {
      // No creatives selected — unlink all from this campaign
      await sql`UPDATE creatives SET campaign_id = NULL WHERE campaign_id = ${cid}`;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('creatives-link error:', err);
    return res.status(500).json({ error: err.message });
  }
}
