import { neon } from '@neondatabase/serverless';

// Links/unlinks media plans (by name) to a campaign_id inside moments_match.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, moments_group_names } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
    if (!Array.isArray(moments_group_names)) return res.status(400).json({ error: 'moments_group_names must be an array' });

    const sql = neon(process.env.DATABASE_URL);
    const cid = parseInt(campaign_id);

    if (moments_group_names.length > 0) {
      // Unlink analyses previously on this campaign whose plans are no longer selected
      // (set campaign_id = NULL where none of their ad group names match)
      const rows = await sql`
        SELECT analysis_id, ad_groups FROM moments_match WHERE campaign_id = ${cid}
      `;
      for (const row of rows) {
        const plans = row.ad_groups || [];
        const hasMatch = plans.some(p => moments_group_names.includes(p.moments_group_name));
        if (!hasMatch) {
          await sql`UPDATE moments_match SET campaign_id = NULL WHERE analysis_id = ${row.analysis_id}`;
        }
      }
      // Link analyses whose ad group names match
      const allRows = await sql`SELECT analysis_id, ad_groups FROM moments_match WHERE campaign_id IS NULL OR campaign_id = ${cid}`;
      for (const row of allRows) {
        const plans = row.ad_groups || [];
        const hasMatch = plans.some(p => moments_group_names.includes(p.moments_group_name));
        if (hasMatch) {
          await sql`UPDATE moments_match SET campaign_id = ${cid} WHERE analysis_id = ${row.analysis_id}`;
        }
      }
    } else {
      // Unlink all from this campaign
      await sql`UPDATE moments_match SET campaign_id = NULL WHERE campaign_id = ${cid}`;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('ad-groups-link error:', err);
    return res.status(500).json({ error: err.message });
  }
}
