import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // GET /api/user-profiles?id=<uuid>
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const rows = await sql`
        SELECT
          up.id,
          up.first_name,
          up.last_name,
          up.role,
          up.organization_id,
          up.created_at,
          u.email,
          u."emailVerified",
          u.image,
          co.client_name  AS organization_name
        FROM user_profiles up
        JOIN neon_auth.user u ON u.id = up.id
        LEFT JOIN client_organizations co ON co.client_org_id = up.organization_id
        WHERE up.id = ${id}
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json({ profile: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/user-profiles  { id, first_name, last_name, role, organization_id }
  if (req.method === 'PATCH') {
    const { id, first_name, last_name, role, organization_id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const rows = await sql`
        INSERT INTO user_profiles (id, first_name, last_name, role, organization_id)
        VALUES (${id}, ${first_name ?? null}, ${last_name ?? null}, ${role ?? null}, ${organization_id ?? null})
        ON CONFLICT (id) DO UPDATE SET
          first_name      = EXCLUDED.first_name,
          last_name       = EXCLUDED.last_name,
          role            = EXCLUDED.role,
          organization_id = EXCLUDED.organization_id
        RETURNING *
      `;
      return res.status(200).json({ profile: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
