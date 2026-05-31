import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const {
      campaign_name,
      client_org_id: rawClientId,
      advertiser_id: rawAdvId,
      client_name,
      advertiser_name,
      geo,
      start_date,
      end_date,
    } = req.body || {};

    // Prefer direct IDs; fall back to name-based lookup for backward compat
    let client_org_id = rawClientId ? parseInt(rawClientId) : null;
    if (!client_org_id && client_name) {
      const rows = await sql`SELECT client_org_id FROM client_organizations WHERE client_name = ${client_name} LIMIT 1`;
      if (rows.length) client_org_id = rows[0].client_org_id;
    }

    let advertiser_id = rawAdvId ? parseInt(rawAdvId) : null;
    if (!advertiser_id && advertiser_name && client_org_id) {
      const rows = await sql`SELECT advertiser_id FROM advertisers WHERE advertiser_name = ${advertiser_name} AND client_org_id = ${client_org_id} LIMIT 1`;
      if (rows.length) advertiser_id = rows[0].advertiser_id;
    }

    const nameVal      = (campaign_name && campaign_name.trim()) ? campaign_name.trim() : null;
    const geoVal       = (geo && geo.trim()) ? geo.trim() : null;
    const startDateVal = start_date || null;
    const endDateVal   = end_date   || null;

    // Build campaign_details JSONB
    const detailsObj = {};
    if (geoVal)       detailsObj.geo        = geoVal;
    if (startDateVal) detailsObj.start_date  = startDateVal;
    if (endDateVal)   detailsObj.end_date    = endDateVal;

    const result = await sql`
      INSERT INTO campaigns_v2 (campaign_name, client_org_id, advertiser_id, campaign_status, campaign_details, line_items)
      VALUES (${nameVal}, ${client_org_id}, ${advertiser_id}, 'draft', ${JSON.stringify(detailsObj)}::jsonb, '[]'::jsonb)
      RETURNING campaign_id
    `;

    return res.status(200).json({ campaign_id: result[0].campaign_id });
  } catch (err) {
    console.error('campaigns-create error:', err);
    return res.status(500).json({ error: err.message });
  }
}
