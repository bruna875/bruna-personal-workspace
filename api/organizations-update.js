import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { client_org_id, client_name, client_type, client_email } = req.body || {};

    if (!client_org_id) return res.status(400).json({ error: 'Missing client_org_id' });

    await sql`
      UPDATE client_organizations SET
        client_name  = COALESCE(${client_name  ?? null}, client_name),
        client_type  = COALESCE(${client_type  ?? null}, client_type),
        client_email = COALESCE(${client_email ?? null}, client_email)
      WHERE client_org_id = ${parseInt(client_org_id)}
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('organizations-update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
