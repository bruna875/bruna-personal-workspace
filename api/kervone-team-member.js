import { neon } from '@neondatabase/serverless';

async function ensureTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS kervone_team_member (
    team_member_id   SERIAL PRIMARY KEY,
    team_member_name TEXT        NOT NULL,
    team_member_role VARCHAR(20),
    team_member_title TEXT,
    team_member_description TEXT,
    team_id          INTEGER
  )`;
  await sql`ALTER TABLE kervone_team_member ADD COLUMN IF NOT EXISTS team_id INTEGER`;
  await sql`ALTER TABLE kervone_team_member ADD COLUMN IF NOT EXISTS reporting_to_lead_id INTEGER`;
  await sql`ALTER TABLE kervone_team_member ADD COLUMN IF NOT EXISTS domain_id INTEGER`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureTables(sql);

    if (req.method === 'POST') {
      const { team_member_name, team_member_role, team_member_title, team_member_description, domain_id } = req.body || {};
      if (!team_member_name) return res.status(400).json({ error: 'team_member_name required' });
      const did = domain_id ? parseInt(domain_id) : null;
      const rows = await sql`
        INSERT INTO kervone_team_member (team_member_name, team_member_role, team_member_title, team_member_description, domain_id)
        VALUES (${team_member_name}, ${team_member_role || null}, ${team_member_title || null}, ${team_member_description || null}, ${did})
        RETURNING *`;
      return res.status(200).json({ member: rows[0] });
    }

    if (req.method === 'PUT') {
      const { team_member_id, team_member_name, team_member_role, team_member_title, team_member_description, domain_id } = req.body || {};
      if (!team_member_id) return res.status(400).json({ error: 'team_member_id required' });
      const mid = parseInt(team_member_id);
      const did = domain_id ? parseInt(domain_id) : null;
      const rows = await sql`
        UPDATE kervone_team_member
        SET team_member_name        = ${team_member_name},
            team_member_role        = ${team_member_role || null},
            team_member_title       = ${team_member_title || null},
            team_member_description = ${team_member_description || null},
            domain_id               = ${did}
        WHERE team_member_id = ${mid}
        RETURNING *`;
      return res.status(200).json({ member: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { team_member_id } = req.query;
      if (!team_member_id) return res.status(400).json({ error: 'team_member_id required' });
      await sql`DELETE FROM kervone_team_member WHERE team_member_id = ${parseInt(team_member_id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
