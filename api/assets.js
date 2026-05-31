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
      const { asset_id, client_org_id, advertiser_id, campaign_id, moments_match_analysis_id } = req.query;
      const conditions = [], params = [];

      if (asset_id)                  { conditions.push(`a.asset_id = $${params.length + 1}`);                  params.push(parseInt(asset_id)); }
      if (client_org_id)             { conditions.push(`a.client_org_id = $${params.length + 1}`);             params.push(parseInt(client_org_id)); }
      if (advertiser_id)             { conditions.push(`a.advertiser_id = $${params.length + 1}`);             params.push(parseInt(advertiser_id)); }
      if (campaign_id)               { conditions.push(`a.campaign_id = $${params.length + 1}`);               params.push(parseInt(campaign_id)); }
      if (moments_match_analysis_id) { conditions.push(`a.moments_match_analysis_id = $${params.length + 1}`); params.push(parseInt(moments_match_analysis_id)); }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const rows = await sql.query(`
        SELECT
          a.*,
          o.client_name,
          adv.advertiser_name,
          camp.campaign_name
        FROM assets a
        LEFT JOIN client_organizations o    ON a.client_org_id = o.client_org_id
        LEFT JOIN advertisers          adv  ON a.advertiser_id = adv.advertiser_id
        LEFT JOIN campaigns_v2         camp ON a.campaign_id   = camp.campaign_id
        ${where}
        ORDER BY a.created_at DESC
      `, params);

      return res.status(200).json({ assets: rows });
    } catch (err) {
      console.error('assets GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        asset_name, asset_type, asset_link, asset_s3, asset_thumbnail,
        client_org_id, advertiser_id, campaign_id, line_item_id,
        moments_match_analysis_id, created_by,
      } = req.body || {};

      const result = await sql`
        INSERT INTO assets
          (asset_name, asset_type, asset_link, asset_s3, asset_thumbnail,
           client_org_id, advertiser_id, campaign_id, line_item_id,
           moments_match_analysis_id, created_by)
        VALUES (
          ${asset_name        ? String(asset_name)                              : null},
          ${asset_type        ? String(asset_type)                              : null},
          ${asset_link        ? String(asset_link)                              : null},
          ${asset_s3          ? String(asset_s3)                                : null},
          ${asset_thumbnail   ? String(asset_thumbnail)                         : null},
          ${client_org_id     ? parseInt(client_org_id)                         : null},
          ${advertiser_id     ? parseInt(advertiser_id)                         : null},
          ${campaign_id       ? parseInt(campaign_id)                           : null},
          ${line_item_id      ? parseInt(line_item_id)                          : null},
          ${moments_match_analysis_id ? parseInt(moments_match_analysis_id)     : null},
          ${created_by        ? String(created_by)                              : null}
        )
        RETURNING asset_id, created_at
      `;

      return res.status(201).json({ ok: true, asset_id: result[0].asset_id, created_at: result[0].created_at });
    } catch (err) {
      console.error('assets POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update (merges only provided fields) ──────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { asset_id } = req.query;
      if (!asset_id) return res.status(400).json({ error: 'Missing asset_id' });
      const aid = parseInt(asset_id);

      const current = await sql`SELECT * FROM assets WHERE asset_id = ${aid}`;
      if (!current.length) return res.status(404).json({ error: 'Asset not found' });
      const c = current[0];
      const b = req.body || {};

      const newName      = b.asset_name                !== undefined ? (b.asset_name      || null) : c.asset_name;
      const newType      = b.asset_type                !== undefined ? (b.asset_type      || null) : c.asset_type;
      const newLink      = b.asset_link                !== undefined ? (b.asset_link      || null) : c.asset_link;
      const newS3        = b.asset_s3                  !== undefined ? (b.asset_s3        || null) : c.asset_s3;
      const newThumb     = b.asset_thumbnail           !== undefined ? (b.asset_thumbnail || null) : c.asset_thumbnail;
      const newClient    = b.client_org_id             !== undefined ? (b.client_org_id   ? parseInt(b.client_org_id)   : null) : c.client_org_id;
      const newAdv       = b.advertiser_id             !== undefined ? (b.advertiser_id   ? parseInt(b.advertiser_id)   : null) : c.advertiser_id;
      const newCampaign  = b.campaign_id               !== undefined ? (b.campaign_id     ? parseInt(b.campaign_id)     : null) : c.campaign_id;
      const newLi        = b.line_item_id              !== undefined ? (b.line_item_id    ? parseInt(b.line_item_id)    : null) : c.line_item_id;
      const newMm        = b.moments_match_analysis_id !== undefined ? (b.moments_match_analysis_id ? parseInt(b.moments_match_analysis_id) : null) : c.moments_match_analysis_id;
      const newCreatedBy = b.created_by               !== undefined ? (b.created_by || null) : c.created_by;

      await sql`
        UPDATE assets SET
          asset_name                = ${newName},
          asset_type                = ${newType},
          asset_link                = ${newLink},
          asset_s3                  = ${newS3},
          asset_thumbnail           = ${newThumb},
          client_org_id             = ${newClient},
          advertiser_id             = ${newAdv},
          campaign_id               = ${newCampaign},
          line_item_id              = ${newLi},
          moments_match_analysis_id = ${newMm},
          created_by                = ${newCreatedBy}
        WHERE asset_id = ${aid}
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('assets PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { asset_id } = req.query;
      if (!asset_id) return res.status(400).json({ error: 'Missing asset_id' });
      await sql`DELETE FROM assets WHERE asset_id = ${parseInt(asset_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('assets DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
