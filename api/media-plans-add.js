import { neon } from '@neondatabase/serverless';

// Adds or updates a media plan (with its moments) inside moments_match.media_plans JSONB.
// If analysis_id + media_plan_id already exist, the plan is replaced.
// If media_plan_id is new, the plan is appended to the array.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      analysis_id,
      media_plan_id,
      media_plan_name,
      moments,          // array of moment objects per the agreed schema
    } = req.body || {};

    if (!analysis_id) return res.status(400).json({ error: 'Missing analysis_id' });
    if (!media_plan_id) return res.status(400).json({ error: 'Missing media_plan_id' });

    const sql = neon(process.env.DATABASE_URL);
    const aid = parseInt(analysis_id);

    // Fetch current media_plans array
    const rows = await sql`SELECT media_plans FROM moments_match WHERE analysis_id = ${aid}`;
    if (!rows.length) return res.status(404).json({ error: 'Analysis not found' });

    const existing = rows[0].media_plans || [];

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
      media_plan_id,
      media_plan_name: media_plan_name || null,
      moments: enrichedMoments,
    };

    // Replace if plan already exists, otherwise append
    const idx = existing.findIndex(function(p) { return p.media_plan_id === media_plan_id; });
    if (idx >= 0) {
      existing[idx] = newPlan;
    } else {
      existing.push(newPlan);
    }

    await sql`
      UPDATE moments_match
      SET media_plans = ${JSON.stringify(existing)}::jsonb
      WHERE analysis_id = ${aid}
    `;

    // Also flip status to 'planned' if it was 'ready'
    await sql`
      UPDATE moments_match
      SET status = 'planned'
      WHERE analysis_id = ${aid} AND status = 'ready'
    `;

    return res.status(200).json({ ok: true, media_plan_id, moments_count: enrichedMoments.length });
  } catch (err) {
    console.error('media-plans-add error:', err);
    return res.status(500).json({ error: err.message });
  }
}
