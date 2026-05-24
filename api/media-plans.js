import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { campaign_id } = req.query;
  if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        mp.media_plan_id,
        mp.campaign_id,
        mp.client_org_id,
        mp.advertiser_id,
        mp.moment_id,
        mp.est_impressions,
        mp.est_cpm,
        mp.est_dollar_value,
        mp.created_by,
        mp.created_at,
        o.client_name,
        a.advertiser_name
      FROM media_plans mp
      LEFT JOIN client_organizations o ON mp.client_org_id = o.client_org_id
      LEFT JOIN advertisers          a ON mp.advertiser_id  = a.advertiser_id
      WHERE mp.campaign_id = ${parseInt(campaign_id)}
      ORDER BY mp.created_at DESC
    `;

    return res.status(200).json({ media_plans: rows });
  } catch (err) {
    console.error('media-plans GET error:', err);
    return res.status(500).json({ error: err.message });
  }
}
