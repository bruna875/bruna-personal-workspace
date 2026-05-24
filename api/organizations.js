import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        o.client_org_id,
        o.client_name,
        o.client_type,
        o.client_email,
        COUNT(DISTINCT a.advertiser_id) AS advertiser_count,
        COUNT(DISTINCT c.campaign_id)   AS campaign_count
      FROM client_organizations o
      LEFT JOIN advertisers a ON a.client_org_id = o.client_org_id
      LEFT JOIN campaigns   c ON c.client_org_id  = o.client_org_id
      GROUP BY o.client_org_id, o.client_name, o.client_type, o.client_email
      ORDER BY o.client_org_id
    `;

    const orgs = rows.map(r => ({
      id:          'db' + r.client_org_id,
      dbId:        r.client_org_id,
      name:        r.client_name  || '—',
      type:        r.client_type  || '—',
      email:       r.client_email || '—',
      users:       0,
      advertisers: Number(r.advertiser_count),
      campaigns:   Number(r.campaign_count),
      since:       '—',
    }));

    return res.status(200).json({ orgs });
  } catch (err) {
    console.error('organizations API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
