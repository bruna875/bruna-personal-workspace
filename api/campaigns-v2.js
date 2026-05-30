import { neon } from '@neondatabase/serverless';

const VALID_STATUSES = ['draft','planned','pacing','underpacing','failed','completed'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ───────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { campaign_id, client_org_id, advertiser_id } = req.query;
      const conditions = [], params = [];
      if (campaign_id)   { conditions.push(`cv.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id));   }
      if (client_org_id) { conditions.push(`cv.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`cv.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const rows = await sql.query(`
        SELECT cv.*, o.client_name, a.advertiser_name
        FROM campaigns_v2 cv
        LEFT JOIN client_organizations o ON cv.client_org_id = o.client_org_id
        LEFT JOIN advertisers          a ON cv.advertiser_id = a.advertiser_id
        ${where}
        ORDER BY cv.created_at DESC
      `, params);

      return res.status(200).json({ campaigns: rows });
    } catch (err) {
      console.error('campaigns-v2 GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { campaign_name, client_org_id, advertiser_id,
              campaign_status, campaign_details, line_items } = req.body || {};

      const statusVal = VALID_STATUSES.includes(campaign_status) ? campaign_status : 'draft';

      const result = await sql`
        INSERT INTO campaigns_v2
          (campaign_name, client_org_id, advertiser_id, campaign_status, campaign_details, line_items)
        VALUES (
          ${campaign_name || null},
          ${client_org_id ? parseInt(client_org_id) : null},
          ${advertiser_id ? parseInt(advertiser_id) : null},
          ${statusVal},
          ${campaign_details !== undefined ? JSON.stringify(campaign_details) : null}::jsonb,
          ${JSON.stringify(line_items || [])}::jsonb
        )
        RETURNING campaign_id, created_at
      `;

      return res.status(201).json({
        ok: true,
        campaign_id: result[0].campaign_id,
        created_at:  result[0].created_at,
      });
    } catch (err) {
      console.error('campaigns-v2 POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update (merges only provided fields) ──────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { campaign_id } = req.query;
      if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
      const cid = parseInt(campaign_id);

      const current = await sql`SELECT * FROM campaigns_v2 WHERE campaign_id = ${cid}`;
      if (!current.length) return res.status(404).json({ error: 'Campaign not found' });
      const c   = current[0];
      const b   = req.body || {};

      const newName    = b.campaign_name     !== undefined ? (b.campaign_name || null)                              : c.campaign_name;
      const newClient  = b.client_org_id     !== undefined ? (b.client_org_id ? parseInt(b.client_org_id) : null)  : c.client_org_id;
      const newAdv     = b.advertiser_id     !== undefined ? (b.advertiser_id ? parseInt(b.advertiser_id) : null)  : c.advertiser_id;
      const newStatus  = b.campaign_status   !== undefined && VALID_STATUSES.includes(b.campaign_status)
                           ? b.campaign_status : c.campaign_status;
      const newDetails = b.campaign_details  !== undefined ? JSON.stringify(b.campaign_details)
                           : (c.campaign_details ? JSON.stringify(c.campaign_details) : null);
      const newItems   = b.line_items        !== undefined ? JSON.stringify(b.line_items)
                           : JSON.stringify(c.line_items || []);

      await sql`
        UPDATE campaigns_v2 SET
          campaign_name    = ${newName},
          client_org_id    = ${newClient},
          advertiser_id    = ${newAdv},
          campaign_status  = ${newStatus},
          campaign_details = ${newDetails}::jsonb,
          line_items       = ${newItems}::jsonb,
          updated_at       = now()
        WHERE campaign_id  = ${cid}
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('campaigns-v2 PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { campaign_id } = req.query;
      if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
      await sql`DELETE FROM campaigns_v2 WHERE campaign_id = ${parseInt(campaign_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('campaigns-v2 DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
