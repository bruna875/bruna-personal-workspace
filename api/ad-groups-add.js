import { neon } from '@neondatabase/serverless';

// Adds or updates a media plan (with its moments) inside moments_match.ad_groups JSONB.
// If analysis_id + moments_group_id already exist, the plan is replaced.
// If moments_group_id is new, the plan is appended to the array.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      moments_match_analysis_id,
      moments_group_id,
      moments_group_name,
      moments,          // array of moment objects per the agreed schema
    } = req.body || {};

    if (!moments_match_analysis_id) return res.status(400).json({ error: 'Missing moments_match_analysis_id' });
    if (!moments_group_id) return res.status(400).json({ error: 'Missing moments_group_id' });

    const sql = neon(process.env.DATABASE_URL);
    const aid = parseInt(moments_match_analysis_id);

    // Fetch current ad_groups array
    const rows = await sql`SELECT moments_groups FROM moments_match WHERE moments_match_analysis_id = ${aid}`;
    if (!rows.length) return res.status(404).json({ error: 'Analysis not found' });

    const existing = rows[0].moments_groups || [];

    // Validate and enrich moments: compute est_dollar_value if missing
    const enrichedMoments = (moments || []).map(function(m) {
      const impr = Number(m.moment_est_impr)  || 0;
      const cpm  = Number(m.moment_est_cpm)   || 0;
      return {
        moment_id:               m.moment_id              || null,
        moment_name:             m.moment_name            || null,
        moment_type:             m.moment_type            || null,
        moment_est_impr:         impr                     || null,
        moment_est_cpm:          cpm                      || null,
        moment_est_dollar_value: impr && cpm ? parseFloat(((impr * cpm) / 1000).toFixed(2)) : null,
        moment_pods:             m.moment_pods            || null,
        moment_channels:         m.moment_channels        || [],
        moment_taxonomies:       m.moment_taxonomies      || null,
      };
    });

    const newPlan = {
      moments_group_id,
      moments_group_name: moments_group_name || null,
      moments: enrichedMoments,
    };

    // Replace if plan already exists, otherwise append
    const idx = existing.findIndex(function(p) { return p.moments_group_id === moments_group_id; });
    if (idx >= 0) {
      existing[idx] = newPlan;
    } else {
      existing.push(newPlan);
    }

    await sql`
      UPDATE moments_match
      SET moments_groups = ${JSON.stringify(existing)}::jsonb
      WHERE moments_match_analysis_id = ${aid}
    `;

    return res.status(200).json({ ok: true, moments_group_id, moments_count: enrichedMoments.length });
  } catch (err) {
    console.error('ad-groups-add error:', err);
    return res.status(500).json({ error: err.message });
  }
}
