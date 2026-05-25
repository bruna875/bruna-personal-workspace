import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, ids, name, advertiser_name } = req.body;
    const sql = neon(process.env.DATABASE_URL);

    // ── Bulk metadata update (advertiser + client + dates) ────────────────
    if (Array.isArray(ids) || Array.isArray(req.body.dates)) {
      const creativeIds = Array.isArray(ids) ? ids.map(Number) : [];

      // Resolve advertiser_id: find by name or create
      let advertiserId = null;
      if (advertiser_name) {
        const existing = await sql`
          SELECT advertiser_id FROM advertisers WHERE LOWER(advertiser_name) = LOWER(${advertiser_name}) LIMIT 1
        `;
        if (existing.length) {
          advertiserId = existing[0].advertiser_id;
        } else {
          const created = await sql`
            INSERT INTO advertisers (advertiser_name) VALUES (${advertiser_name}) RETURNING advertiser_id
          `;
          advertiserId = created[0].advertiser_id;
        }
      }

      if (advertiserId) {
        await sql`UPDATE creatives SET advertiser_id = ${advertiserId} WHERE creative_id = ANY(${creativeIds})`;
      }

      // Update created_at per individual ID if provided as array of {id, date} pairs
      if (Array.isArray(req.body.dates)) {
        for (const entry of req.body.dates) {
          const cid = parseInt(entry.id);
          const dt  = String(entry.date);
          await sql`UPDATE creatives SET created_at = ${dt}::timestamptz WHERE creative_id = ${cid}`;
        }
      }

      return res.status(200).json({ ok: true, advertiser_id: advertiserId });
    }

    // ── Single creative name update ────────────────────────────────────────
    if (!id || !name) return res.status(400).json({ error: 'Missing id or name' });
    await sql`UPDATE creatives SET creative_name = ${name} WHERE creative_id = ${id}`;
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('creatives-update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
