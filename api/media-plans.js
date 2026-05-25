import { neon } from '@neondatabase/serverless';

// Reads media plans from moments_match.media_plans JSONB and returns them
// in a flat format compatible with the existing UI (moment-per-row).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { campaign_id, analysis_id, plan_name } = req.query;
  if (!campaign_id && !analysis_id) return res.status(400).json({ error: 'Missing campaign_id or analysis_id' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    let rows;
    if (analysis_id) {
      rows = await sql`
        SELECT mm.analysis_id, mm.campaign_id, mm.client_org_id, mm.advertiser_id,
               mm.media_plans, mm.created_by, mm.created_at,
               o.client_name, a.advertiser_name
        FROM moments_match mm
        LEFT JOIN advertisers          a ON mm.advertiser_id = a.advertiser_id
        LEFT JOIN client_organizations o ON mm.client_org_id = o.client_org_id
        WHERE mm.analysis_id = ${parseInt(analysis_id)}
      `;
    } else {
      rows = await sql`
        SELECT mm.analysis_id, mm.campaign_id, mm.client_org_id, mm.advertiser_id,
               mm.media_plans, mm.created_by, mm.created_at,
               o.client_name, a.advertiser_name
        FROM moments_match mm
        LEFT JOIN advertisers          a ON mm.advertiser_id = a.advertiser_id
        LEFT JOIN client_organizations o ON mm.client_org_id = o.client_org_id
        WHERE mm.campaign_id = ${parseInt(campaign_id)}
        ORDER BY mm.created_at DESC
      `;
    }

    // Expand JSONB: one row per moment across all plans, UI-compatible format
    const mediaPlans = [];
    for (const row of rows) {
      const plans = row.media_plans || [];
      for (const plan of plans) {
        if (plan_name && plan.media_plan_name !== plan_name) continue;
        const moments = plan.moments || [];
        for (const m of moments) {
          mediaPlans.push({
            // Plan identifiers
            media_plan_id:   plan.media_plan_id   || null,
            media_plan_name: plan.media_plan_name  || null,
            // Analysis context
            analysis_id:     row.analysis_id,
            campaign_id:     row.campaign_id,
            client_org_id:   row.client_org_id,
            advertiser_id:   row.advertiser_id,
            client_name:     row.client_name      || null,
            advertiser_name: row.advertiser_name  || null,
            created_by:      row.created_by       || null,
            created_at:      row.created_at       || null,
            // Moment fields (flat, UI-compatible)
            moment_id:              m.moment_id              || null,
            est_impressions:        m.moment_est_impr        || null,
            est_cpm:                m.moment_est_cpm         || null,
            est_dollar_value:       m.moment_est_dollar_value|| null,
            moment_taxonomies:      m.moment_taxonomies      || null,
            // moment_details blob for backward-compat with campaign detail UI
            moment_details: {
              moment_name:        m.moment_name             || null,
              moment_type:        m.moment_type             || null,
              est_impressions:    m.moment_est_impr         || null,
              est_cpm:            m.moment_est_cpm          || null,
              est_dollar_value:   m.moment_est_dollar_value || null,
              pods:               m.moment_pods             || null,
              channels:           m.moment_channels         || [],
            },
          });
        }
      }
    }

    return res.status(200).json({ media_plans: mediaPlans });
  } catch (err) {
    console.error('media-plans GET error:', err);
    return res.status(500).json({ error: err.message });
  }
}
