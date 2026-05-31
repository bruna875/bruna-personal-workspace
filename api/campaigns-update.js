import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const body = req.body || {};

    // Accept both `id` and `campaign_id` for flexibility
    const campaignId = parseInt(body.campaign_id || body.id);
    if (!campaignId) return res.status(400).json({ error: 'Missing campaign id' });

    // ── Assign moments_match_analysis_id to campaign ──────────────────────
    if (body.moments_match_analysis_id !== undefined) {
      const body_analysis_id = body.moments_match_analysis_id;
      // Ensure column exists (safe no-op after first run)
      await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS moments_match_analysis_id INTEGER`;
      const aid = body_analysis_id ? parseInt(body_analysis_id) : null;
      await sql`UPDATE campaigns SET moments_match_analysis_id = ${aid} WHERE campaign_id = ${campaignId}`;
      // Also write the campaign_id back onto the moments_match row so the
      // Previous Moments Match table can JOIN and display the campaign name.
      if (aid) {
        await sql`UPDATE moments_match SET campaign_id = ${campaignId} WHERE moments_match_analysis_id = ${aid}`;
      }
      return res.status(200).json({ ok: true });
    }

    // ── Update details (name, client, advertiser) ───────────────────────────
    if (body.campaign_name !== undefined || body.client_name !== undefined || body.advertiser_name !== undefined) {
      let client_org_id = null;
      if (body.client_name) {
        const rows = await sql`SELECT client_org_id FROM client_organizations WHERE client_name = ${body.client_name} LIMIT 1`;
        if (rows.length) client_org_id = rows[0].client_org_id;
      }
      let advertiser_id = null;
      if (body.advertiser_name && client_org_id) {
        const rows = await sql`SELECT advertiser_id FROM advertisers WHERE advertiser_name = ${body.advertiser_name} AND client_org_id = ${client_org_id} LIMIT 1`;
        if (rows.length) advertiser_id = rows[0].advertiser_id;
      }
      const nameVal = (body.campaign_name && body.campaign_name.trim()) ? body.campaign_name.trim() : null;
      await sql`
        UPDATE campaigns SET
          campaign_name  = ${nameVal},
          client_org_id  = ${client_org_id},
          advertiser_id  = ${advertiser_id}
        WHERE campaign_id = ${campaignId}
      `;
    }

    // ── Update partner_ids ──────────────────────────────────────────────────
    if (body.partner_ids !== undefined) {
      const ids = Array.isArray(body.partner_ids) ? body.partner_ids.map(Number).filter(Boolean) : [];

      if (ids.length > 0) {
        // Fetch campaign's client_org_id and advertiser_id for validation
        const campRows = await sql`
          SELECT client_org_id, advertiser_id FROM campaigns WHERE campaign_id = ${campaignId}
        `;
        if (!campRows.length) return res.status(404).json({ error: 'Campaign not found' });
        const { client_org_id, advertiser_id } = campRows[0];

        // Validate: each connection must belong to this org AND
        // either be org-level (conn.advertiser_id IS NULL)
        // or match this campaign's advertiser_id
        const validRows = await sql`
          SELECT connection_id FROM dsp_ssp_connections
          WHERE connection_id = ANY(${ids})
            AND client_org_id = ${client_org_id}
            AND (advertiser_id IS NULL OR advertiser_id = ${advertiser_id})
            AND status = 'active'
        `;
        const validIds = validRows.map(r => r.connection_id);
        const rejected = ids.filter(id => !validIds.includes(id));
        if (rejected.length) {
          return res.status(400).json({
            error: `Connection IDs not valid for this campaign's org/advertiser: ${rejected.join(', ')}`
          });
        }
        await sql`UPDATE campaigns SET partner_ids = ${validIds} WHERE campaign_id = ${campaignId}`;
      } else {
        // Empty array → clear partners
        await sql`UPDATE campaigns SET partner_ids = '{}' WHERE campaign_id = ${campaignId}`;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('campaigns-update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
