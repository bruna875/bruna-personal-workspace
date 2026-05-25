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
      const { analysis_id, campaign_id, client_org_id, advertiser_id, creative_id } = req.query;

      const conditions = [];
      const params     = [];

      if (analysis_id)   { conditions.push(`mm.analysis_id   = $${params.length + 1}`); params.push(parseInt(analysis_id));   }
      if (campaign_id)   { conditions.push(`mm.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id));   }
      if (client_org_id) { conditions.push(`mm.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`mm.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      if (creative_id)   { conditions.push(`mm.creative_id   = $${params.length + 1}`); params.push(parseInt(creative_id));   }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          mm.analysis_id,
          mm.analysis_name,
          mm.campaign_id,
          mm.client_org_id,
          mm.advertiser_id,
          mm.creative_id,
          mm.creative_ids,
          mm.asset_type,
          mm.lookback_window,
          mm.moments,
          mm.media_plans,
          mm.brief,
          mm.doc,
          mm.created_by,
          mm.created_at,
          c.campaign_name,
          o.client_name,
          COALESCE(a.advertiser_name, a2.advertiser_name) AS advertiser_name,
          cr.creative_name
        FROM moments_match mm
        LEFT JOIN campaigns            c  ON mm.campaign_id   = c.campaign_id
        LEFT JOIN advertisers          a  ON mm.advertiser_id = a.advertiser_id
        LEFT JOIN advertisers          a2 ON c.advertiser_id  = a2.advertiser_id
        LEFT JOIN client_organizations o  ON mm.client_org_id = o.client_org_id
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
        analysis_name, campaign_id, client_org_id, advertiser_id,
        creative_id, creative_ids, created_by,
        lookback_window, moments, asset_type, brief, doc,
      } = req.body || {};

      const result = await sql`
        INSERT INTO moments_match
          (analysis_name, campaign_id, client_org_id, advertiser_id,
           creative_id, creative_ids, created_by,
           lookback_window, moments, asset_type, brief, doc)
        VALUES (
          ${analysis_name      ? String(analysis_name)              : null},
          ${campaign_id        ? parseInt(campaign_id)              : null},
          ${client_org_id      ? parseInt(client_org_id)            : null},
          ${advertiser_id      ? parseInt(advertiser_id)            : null},
          ${creative_id        ? parseInt(creative_id)              : null},
          ${creative_ids       !== undefined ? JSON.stringify(creative_ids) : null},
          ${created_by         ? String(created_by)                 : null},
          ${lookback_window    ? parseInt(lookback_window)          : null},
          ${moments            !== undefined ? JSON.stringify(moments) : null},
          ${asset_type         ? String(asset_type)                 : null},
          ${brief              ? String(brief)                      : null},
          ${doc                ? String(doc)                        : null}
        )
        RETURNING analysis_id, created_at
      `;

      return res.status(201).json({ ok: true, analysis_id: result[0].analysis_id, created_at: result[0].created_at });
    } catch (err) {
      console.error('moments-match POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update fields (including media_plans JSONB) ───────────────────────
  if (req.method === 'PATCH') {
    try {
      const { analysis_id } = req.query;
      if (!analysis_id) return res.status(400).json({ error: 'Missing analysis_id' });

      const { moments, media_plans, analysis_name, brief, doc } = req.body || {};
      const aid = parseInt(analysis_id);

      if (moments !== undefined) {
        await sql`UPDATE moments_match SET moments = ${JSON.stringify(moments)}::jsonb WHERE analysis_id = ${aid}`;
      }
      if (media_plans !== undefined) {
        await sql`UPDATE moments_match SET media_plans = ${JSON.stringify(media_plans)}::jsonb WHERE analysis_id = ${aid}`;
      }
      if (analysis_name !== undefined) {
        await sql`UPDATE moments_match SET analysis_name = ${String(analysis_name)} WHERE analysis_id = ${aid}`;
      }
      if (brief !== undefined) {
        await sql`UPDATE moments_match SET brief = ${String(brief)} WHERE analysis_id = ${aid}`;
      }
      if (doc !== undefined) {
        await sql`UPDATE moments_match SET doc = ${String(doc)} WHERE analysis_id = ${aid}`;
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
      const { analysis_id } = req.query;
      if (!analysis_id) return res.status(400).json({ error: 'Missing analysis_id' });

      await sql`DELETE FROM moments_match WHERE analysis_id = ${parseInt(analysis_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('moments-match DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
