import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      media_plan_name,
      campaign_id,
      advertiser_id,
      moment_id,
      est_impressions,
      est_cpm,
      created_by,
    } = req.body;

    if (!campaign_id || !moment_id) {
      return res.status(400).json({ error: 'Missing campaign_id or moment_id' });
    }

    // Calculate est_dollar_value server-side
    const impr = parseInt(est_impressions) || 0;
    const cpm  = parseFloat(est_cpm)       || 0;
    const est_dollar_value = impr && cpm ? parseFloat((impr * cpm / 1000).toFixed(2)) : null;

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO media_plans
        (media_plan_name, campaign_id, advertiser_id, moment_id, est_impressions, est_cpm, est_dollar_value, created_by)
      VALUES
        (${media_plan_name || null}, ${campaign_id}, ${advertiser_id || null}, ${moment_id},
         ${impr || null}, ${cpm || null}, ${est_dollar_value}, ${created_by || 'Bruna M.'})
      RETURNING media_plan_id, created_at
    `;

    return res.status(201).json({ ok: true, media_plan_id: result[0].media_plan_id, created_at: result[0].created_at });
  } catch (err) {
    console.error('media-plans-add error:', err);
    return res.status(500).json({ error: err.message });
  }
}
