import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { analysis_id, campaign_id, client_org_id, advertiser_id, creative_id, mediaplan_id } = req.query;

      // Build WHERE clauses dynamically to avoid Neon null type-inference errors
      const conditions = [];
      const params     = [];

      if (analysis_id)   { conditions.push(`ca.analysis_id   = $${params.length + 1}`); params.push(parseInt(analysis_id));   }
      if (campaign_id)   { conditions.push(`ca.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id));   }
      if (client_org_id) { conditions.push(`ca.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`ca.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      if (creative_id)   { conditions.push(`ca.creative_id   = $${params.length + 1}`); params.push(parseInt(creative_id));   }
      if (mediaplan_id)  { conditions.push(`ca.mediaplan_id  = $${params.length + 1}`); params.push(parseInt(mediaplan_id));  }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          ca.analysis_id,
          ca.campaign_id,
          ca.client_org_id,
          ca.advertiser_id,
          ca.creative_id,
          ca.created_at,
          ca.created_by,
          ca.mediaplan_id,
          ca.lookback_window,
          ca.status,
          ca.moments,
          ca.asset_type,
          ca.brief,
          ca.doc,
          ca.creative_ids,
          c.campaign_name,
          o.client_name,
          COALESCE(a.advertiser_name, a2.advertiser_name) AS advertiser_name,
          cr.creative_name,
          mp.media_plan_name
        FROM creatives_analysis ca
        LEFT JOIN campaigns            c  ON ca.campaign_id   = c.campaign_id
        LEFT JOIN client_organizations o  ON ca.client_org_id = o.client_org_id
        LEFT JOIN advertisers          a  ON ca.advertiser_id = a.advertiser_id
        LEFT JOIN advertisers          a2 ON c.advertiser_id  = a2.advertiser_id
        LEFT JOIN creatives            cr ON ca.creative_id   = cr.creative_id
        LEFT JOIN media_plans          mp ON ca.mediaplan_id  = mp.media_plan_id
        ${where}
        ORDER BY ca.created_at DESC
      `;

      const rows = await sql.query(query, params);

      return res.status(200).json({ analyses: rows });
    } catch (err) {
      console.error('creatives-analysis GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { campaign_id, client_org_id, advertiser_id, creative_id, creative_ids, created_by, mediaplan_id, lookback_window, status, moments, asset_type, brief, doc } = req.body || {};

      // Use first element of creative_ids as the primary creative_id if not provided directly
      const primaryCreativeId = creative_id
        ? parseInt(creative_id)
        : (Array.isArray(creative_ids) && creative_ids.length ? parseInt(creative_ids[0]) : null);

      const result = await sql`
        INSERT INTO creatives_analysis
          (campaign_id, client_org_id, advertiser_id, creative_id, creative_ids, created_by, mediaplan_id, lookback_window, status, moments, asset_type, brief, doc)
        VALUES
          (
            ${campaign_id     ? parseInt(campaign_id)     : null},
            ${client_org_id   ? parseInt(client_org_id)   : null},
            ${advertiser_id   ? parseInt(advertiser_id)   : null},
            ${primaryCreativeId},
            ${creative_ids    !== undefined ? JSON.stringify(creative_ids) : null},
            ${created_by      ? String(created_by)        : null},
            ${mediaplan_id    ? parseInt(mediaplan_id)    : null},
            ${lookback_window ? parseInt(lookback_window) : null},
            ${status          ? String(status)            : null},
            ${moments         !== undefined ? JSON.stringify(moments) : null},
            ${asset_type      ? String(asset_type)        : null},
            ${brief           ? String(brief)             : null},
            ${doc             ? String(doc)               : null}
          )
        RETURNING analysis_id, created_at
      `;

      return res.status(201).json({ ok: true, analysis_id: result[0].analysis_id, created_at: result[0].created_at });
    } catch (err) {
      console.error('creatives-analysis POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { analysis_id } = req.query;
      if (!analysis_id) return res.status(400).json({ error: 'Missing analysis_id' });

      await sql`DELETE FROM creatives_analysis WHERE analysis_id = ${parseInt(analysis_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('creatives-analysis DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
