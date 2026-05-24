import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, campaign_name, client_name, advertiser_name } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing campaign id' });

    const sql = neon(process.env.DATABASE_URL);

    // Resolve client_org_id from name
    let client_org_id = null;
    if (client_name) {
      const rows = await sql`SELECT client_org_id FROM client_organizations WHERE client_name = ${client_name} LIMIT 1`;
      if (rows.length) client_org_id = rows[0].client_org_id;
    }

    // Resolve advertiser_id from name
    let advertiser_id = null;
    if (advertiser_name) {
      const rows = await sql`SELECT advertiser_id FROM advertisers WHERE advertiser_name = ${advertiser_name} LIMIT 1`;
      if (rows.length) advertiser_id = rows[0].advertiser_id;
    }

    await sql`
      UPDATE campaigns SET
        campaign_name = COALESCE(NULLIF(${campaign_name ?? null}, ''), campaign_name),
        client_org_id = COALESCE(${client_org_id}, client_org_id),
        advertiser_id = COALESCE(${advertiser_id}, advertiser_id)
      WHERE campaign_id = ${id}
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('campaigns-update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
