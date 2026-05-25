import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { campaign_name, client_name, advertiser_name } = req.body || {};

    // Resolve client_org_id
    let client_org_id = null;
    if (client_name) {
      const rows = await sql`SELECT client_org_id FROM client_organizations WHERE client_name = ${client_name} LIMIT 1`;
      if (rows.length) client_org_id = rows[0].client_org_id;
    }

    // Resolve advertiser_id
    let advertiser_id = null;
    if (advertiser_name) {
      const rows = await sql`SELECT advertiser_id FROM advertisers WHERE advertiser_name = ${advertiser_name} LIMIT 1`;
      if (rows.length) advertiser_id = rows[0].advertiser_id;
    }

    const nameVal = (campaign_name && campaign_name.trim()) ? campaign_name.trim() : null;

    const result = await sql`
      INSERT INTO campaigns (status, campaign_name, client_org_id, advertiser_id)
      VALUES ('draft', ${nameVal}, ${client_org_id}, ${advertiser_id})
      RETURNING campaign_id
    `;

    return res.status(200).json({ campaign_id: result[0].campaign_id });
  } catch (err) {
    console.error('campaigns-create error:', err);
    return res.status(500).json({ error: err.message });
  }
}
