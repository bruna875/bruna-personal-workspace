import { neon } from '@neondatabase/serverless';

const COLS = `
  mp.media_plan_id, mp.media_plan_name, mp.campaign_id,
  mp.client_org_id, mp.advertiser_id, mp.moment_id,
  mp.est_impressions, mp.est_cpm, mp.est_dollar_value,
  mp.moment_details, mp.moment_taxonomies,
  mp.created_by, mp.created_at,
  o.client_name, a.advertiser_name
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { campaign_id, plan_name } = req.query;
  if (!campaign_id && !plan_name) return res.status(400).json({ error: 'Missing campaign_id or plan_name' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    let rows;
    if (campaign_id && plan_name) {
      rows = await sql`
        SELECT ${sql.unsafe(COLS)}
        FROM media_plans mp
        LEFT JOIN advertisers          a ON mp.advertiser_id = a.advertiser_id
        LEFT JOIN client_organizations o ON mp.client_org_id = o.client_org_id
        WHERE mp.campaign_id = ${parseInt(campaign_id)} AND mp.media_plan_name = ${plan_name}
        ORDER BY mp.created_at DESC
      `;
    } else if (campaign_id) {
      rows = await sql`
        SELECT ${sql.unsafe(COLS)}
        FROM media_plans mp
        LEFT JOIN advertisers          a ON mp.advertiser_id = a.advertiser_id
        LEFT JOIN client_organizations o ON mp.client_org_id = o.client_org_id
        WHERE mp.campaign_id = ${parseInt(campaign_id)}
        ORDER BY mp.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT ${sql.unsafe(COLS)}
        FROM media_plans mp
        LEFT JOIN advertisers          a ON mp.advertiser_id = a.advertiser_id
        LEFT JOIN client_organizations o ON mp.client_org_id = o.client_org_id
        WHERE mp.media_plan_name = ${plan_name}
        ORDER BY mp.created_at DESC
      `;
    }

    return res.status(200).json({ media_plans: rows });
  } catch (err) {
    console.error('media-plans GET error:', err);
    return res.status(500).json({ error: err.message });
  }
}
