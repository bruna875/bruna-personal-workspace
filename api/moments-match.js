import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { moments_match_analysis_id, campaign_id, client_org_id, advertiser_id, creative_id } = req.query;
      const conditions = [];
      const params     = [];

      if (moments_match_analysis_id) { conditions.push(`mm.moments_match_analysis_id = $${params.length + 1}`); params.push(parseInt(moments_match_analysis_id)); }
      if (campaign_id)   { conditions.push(`mm.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id));   }
      if (client_org_id) { conditions.push(`mm.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`mm.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      if (creative_id)   { conditions.push(`mm.creative_id   = $${params.length + 1}`); params.push(parseInt(creative_id));   }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          mm.moments_match_analysis_id,
          mm.moments_match_analysis_name,
          mm.campaign_id,
          mm.client_org_id,
          mm.advertiser_id,
          mm.creative_id,
          mm.creative_ids,
          mm.lookback_window,
          mm.moments,
          mm.moments_groups,
          mm.asset_type,
          mm.brief,
          mm.doc,
          mm.created_by,
          mm.created_at,
          -- Prefer the direct campaign_id link; fall back to reverse-lookup via
          -- campaigns.moments_match_analysis_id for rows linked before the back-write was added.
          COALESCE(c.campaign_name,  c2.campaign_name)  AS campaign_name,
          COALESCE(c.status,         c2.status)         AS campaign_status,
          COALESCE(c.start_date,     c2.start_date)     AS start_date,
          COALESCE(c.end_date,       c2.end_date)       AS end_date,
          COALESCE(o.client_name,  o2.client_name,  o3.client_name)      AS client_name,
          COALESCE(a.advertiser_name, a2.advertiser_name, a3.advertiser_name) AS advertiser_name,
          cr.creative_name,
          cr.creative_preview
        FROM moments_match mm
        LEFT JOIN campaigns            c  ON mm.campaign_id   = c.campaign_id
        -- Reverse-lookup: campaign that has analysis_id pointing to this row
        LEFT JOIN campaigns            c2 ON c2.moments_match_analysis_id = mm.moments_match_analysis_id AND mm.campaign_id IS NULL
        LEFT JOIN advertisers          a  ON mm.advertiser_id = a.advertiser_id
        LEFT JOIN advertisers          a2 ON c.advertiser_id  = a2.advertiser_id
        LEFT JOIN advertisers          a3 ON c2.advertiser_id = a3.advertiser_id
        LEFT JOIN client_organizations o  ON mm.client_org_id = o.client_org_id
        LEFT JOIN client_organizations o2 ON c.client_org_id  = o2.client_org_id
        LEFT JOIN client_organizations o3 ON c2.client_org_id = o3.client_org_id
        LEFT JOIN creatives            cr ON mm.creative_id   = cr.creative_id
        ${where}
        ORDER BY mm.created_at DESC
      `;

      const rows = await sql.query(query, params);
      return res.status(200).json({ analyses: rows });
    } catch (err) {
      console.error('moments-match GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create new analysis ────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        moments_match_analysis_name, campaign_id, client_org_id, advertiser_id,
        creative_id, creative_ids, created_by,
        lookback_window, moments, creative_asset_type, brief, doc,
      } = req.body || {};
      const result = await sql`
        INSERT INTO moments_match
          (moments_match_analysis_name, campaign_id, client_org_id, advertiser_id,
           creative_id, creative_ids, created_by,
           lookback_window, moments, creative_asset_type, brief, doc)
        VALUES (
          ${moments_match_analysis_name ? String(moments_match_analysis_name) : null},
          ${campaign_id        ? parseInt(campaign_id)              : null},
          ${client_org_id      ? parseInt(client_org_id)            : null},
          ${advertiser_id      ? parseInt(advertiser_id)            : null},
          ${creative_id        ? parseInt(creative_id)              : null},
          ${creative_ids       !== undefined ? JSON.stringify(creative_ids) : null},
          ${created_by         ? String(created_by)                 : null},
          ${lookback_window    ? parseInt(lookback_window)          : null},
          ${moments            !== undefined ? JSON.stringify(moments) : null},
          ${creative_asset_type         ? String(creative_asset_type)                 : null},
          ${brief              ? String(brief)                      : null},
          ${doc                ? String(doc)                        : null}
        )
        RETURNING moments_match_analysis_id, created_at
      `;

      return res.status(201).json({ ok: true, moments_match_analysis_id: result[0].moments_match_analysis_id, created_at: result[0].created_at });
    } catch (err) {
      console.error('moments-match POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update fields (including ad_groups JSONB) ───────────────────────
  if (req.method === 'PATCH') {
    try {
      const { moments_match_analysis_id } = req.query;
      if (!moments_match_analysis_id) return res.status(400).json({ error: 'Missing moments_match_analysis_id' });

      const { moments, moments_groups, moments_match_analysis_name, brief, doc } = req.body || {};
      const aid = parseInt(moments_match_analysis_id);

      if (moments !== undefined) {
        await sql`UPDATE moments_match SET moments = ${JSON.stringify(moments)}::jsonb WHERE moments_match_analysis_id = ${aid}`;
      }
      if (moments_groups !== undefined) {
        await sql`UPDATE moments_match SET moments_groups = ${JSON.stringify(moments_groups)}::jsonb WHERE moments_match_analysis_id = ${aid}`;
      }
      if (moments_match_analysis_name !== undefined) {
        await sql`UPDATE moments_match SET moments_match_analysis_name = ${String(moments_match_analysis_name)} WHERE moments_match_analysis_id = ${aid}`;
      }
      if (brief !== undefined) {
        await sql`UPDATE moments_match SET brief = ${String(brief)} WHERE moments_match_analysis_id = ${aid}`;
      }
      if (doc !== undefined) {
        await sql`UPDATE moments_match SET doc = ${String(doc)} WHERE moments_match_analysis_id = ${aid}`;
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('moments-match PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { moments_match_analysis_id } = req.query;
      if (!moments_match_analysis_id) return res.status(400).json({ error: 'Missing moments_match_analysis_id' });

      await sql`DELETE FROM moments_match WHERE moments_match_analysis_id = ${parseInt(moments_match_analysis_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('moments-match DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
