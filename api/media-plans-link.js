import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, plan_names } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
    if (!Array.isArray(plan_names)) return res.status(400).json({ error: 'plan_names must be an array' });

    const sql = neon(process.env.DATABASE_URL);
    const cid = parseInt(campaign_id);

    if (plan_names.length > 0) {
      // Unlink plans previously on this campaign that are no longer selected
      await sql`
        UPDATE media_plans
        SET campaign_id = NULL
        WHERE campaign_id = ${cid}
          AND (media_plan_name IS NULL OR media_plan_name != ALL(${plan_names}))
      `;
      // Link selected plans to this campaign
      await sql`
        UPDATE media_plans
        SET campaign_id = ${cid}
        WHERE media_plan_name = ANY(${plan_names})
      `;
    } else {
      // No plans selected — unlink all from this campaign
      await sql`UPDATE media_plans SET campaign_id = NULL WHERE campaign_id = ${cid}`;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('media-plans-link error:', err);
    return res.status(500).json({ error: err.message });
  }
}
