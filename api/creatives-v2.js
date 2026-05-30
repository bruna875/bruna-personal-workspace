import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ───────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { creative_id, asset_id, client_org_id, advertiser_id, campaign_id, ad_type_id, no_campaign } = req.query;
      const conditions = [], params = [];

      if (creative_id)   { conditions.push(`cv.creative_id   = $${params.length + 1}`); params.push(parseInt(creative_id)); }
      if (asset_id)      { conditions.push(`cv.asset_id      = $${params.length + 1}`); params.push(parseInt(asset_id)); }
      if (client_org_id) { conditions.push(`cv.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`cv.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      if (campaign_id)   { conditions.push(`cv.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id)); }
      if (ad_type_id)    { conditions.push(`cv.ad_type_id    = $${params.length + 1}`); params.push(parseInt(ad_type_id)); }
      if (no_campaign === '1') { conditions.push(`cv.campaign_id IS NULL`); }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const rows = await sql.query(`
        SELECT
          cv.*,
          a.asset_name,
          a.asset_type,
          a.asset_link,
          a.asset_thumbnail,
          at.ad_type_name,
          at.media_type     AS ad_type_media_type,
          at.details_schema AS ad_type_details_schema,
          o.client_name,
          adv.advertiser_name
        FROM creatives_v2 cv
        LEFT JOIN assets               a   ON cv.asset_id      = a.asset_id
        LEFT JOIN ad_types             at  ON cv.ad_type_id    = at.ad_type_id
        LEFT JOIN client_organizations o   ON cv.client_org_id = o.client_org_id
        LEFT JOIN advertisers          adv ON cv.advertiser_id = adv.advertiser_id
        ${where}
        ORDER BY cv.created_at DESC
      `, params);

      return res.status(200).json({ creatives: rows });
    } catch (err) {
      console.error('creatives-v2 GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        asset_id, creative_name, ad_type_id, creative_details,
        client_org_id, advertiser_id, campaign_id, line_item_id, created_by,
      } = req.body || {};

      const result = await sql`
        INSERT INTO creatives_v2
          (asset_id, creative_name, ad_type_id, creative_details,
           client_org_id, advertiser_id, campaign_id, line_item_id, created_by)
        VALUES (
          ${asset_id        ? parseInt(asset_id)                                : null},
          ${creative_name   ? String(creative_name)                             : null},
          ${ad_type_id      ? parseInt(ad_type_id)                              : null},
          ${creative_details !== undefined ? JSON.stringify(creative_details)   : null}::jsonb,
          ${client_org_id   ? parseInt(client_org_id)                           : null},
          ${advertiser_id   ? parseInt(advertiser_id)                           : null},
          ${campaign_id     ? parseInt(campaign_id)                             : null},
          ${line_item_id    ? parseInt(line_item_id)                            : null},
          ${created_by      ? String(created_by)                                : null}
        )
        RETURNING creative_id, created_at
      `;

      return res.status(201).json({ ok: true, creative_id: result[0].creative_id, created_at: result[0].created_at });
    } catch (err) {
      console.error('creatives-v2 POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update (merges only provided fields) ──────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { creative_id } = req.query;
      if (!creative_id) return res.status(400).json({ error: 'Missing creative_id' });
      const cid = parseInt(creative_id);

      const current = await sql`SELECT * FROM creatives_v2 WHERE creative_id = ${cid}`;
      if (!current.length) return res.status(404).json({ error: 'Creative not found' });
      const c = current[0];
      const b = req.body || {};

      const newAsset      = b.asset_id         !== undefined ? (b.asset_id      ? parseInt(b.asset_id)      : null) : c.asset_id;
      const newName       = b.creative_name    !== undefined ? (b.creative_name || null)                            : c.creative_name;
      const newAdType     = b.ad_type_id       !== undefined ? (b.ad_type_id    ? parseInt(b.ad_type_id)    : null) : c.ad_type_id;
      const newDetails    = b.creative_details !== undefined ? JSON.stringify(b.creative_details)
                              : (c.creative_details ? JSON.stringify(c.creative_details) : null);
      const newClient     = b.client_org_id    !== undefined ? (b.client_org_id  ? parseInt(b.client_org_id)  : null) : c.client_org_id;
      const newAdv        = b.advertiser_id    !== undefined ? (b.advertiser_id  ? parseInt(b.advertiser_id)  : null) : c.advertiser_id;
      const newCampaign   = b.campaign_id      !== undefined ? (b.campaign_id    ? parseInt(b.campaign_id)    : null) : c.campaign_id;
      const newLi         = b.line_item_id     !== undefined ? (b.line_item_id   ? parseInt(b.line_item_id)   : null) : c.line_item_id;
      const newCreatedBy  = b.created_by       !== undefined ? (b.created_by || null) : c.created_by;

      await sql`
        UPDATE creatives_v2 SET
          asset_id         = ${newAsset},
          creative_name    = ${newName},
          ad_type_id       = ${newAdType},
          creative_details = ${newDetails}::jsonb,
          client_org_id    = ${newClient},
          advertiser_id    = ${newAdv},
          campaign_id      = ${newCampaign},
          line_item_id     = ${newLi},
          created_by       = ${newCreatedBy},
          updated_at       = now()
        WHERE creative_id  = ${cid}
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('creatives-v2 PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { creative_id } = req.query;
      if (!creative_id) return res.status(400).json({ error: 'Missing creative_id' });
      await sql`DELETE FROM creatives_v2 WHERE creative_id = ${parseInt(creative_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('creatives-v2 DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
