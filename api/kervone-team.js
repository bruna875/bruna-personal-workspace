import { neon } from '@neondatabase/serverless';

async function ensureTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS kervone_team_member (
    team_member_id   SERIAL PRIMARY KEY,
    team_member_name TEXT        NOT NULL,
    team_member_role VARCHAR(20),
    team_member_title TEXT,
    team_member_description TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS kervone_team (
    team_id          SERIAL PRIMARY KEY,
    team_name        TEXT        NOT NULL,
    team_description TEXT,
    team_member_ids  INTEGER[]   DEFAULT '{}',
    dotted           BOOLEAN     DEFAULT false
  )`;
  await sql`ALTER TABLE kervone_team ADD COLUMN IF NOT EXISTS dotted BOOLEAN DEFAULT false`;
  await sql`CREATE TABLE IF NOT EXISTS kervone_domain (
    domain_id   SERIAL PRIMARY KEY,
    domain_name TEXT        NOT NULL,
    team_ids    INTEGER[]   DEFAULT '{}'
  )`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureTables(sql);

    if (req.method === 'GET') {
      const teams   = await sql`SELECT * FROM kervone_team        ORDER BY team_id`;
      const members = await sql`SELECT * FROM kervone_team_member ORDER BY team_member_id`;
      const domains = await sql`SELECT * FROM kervone_domain      ORDER BY domain_id`;
      return res.status(200).json({ teams, members, domains });
    }

    if (req.method === 'POST') {
      const { team_name, team_description, team_member_ids, dotted } = req.body || {};
      if (!team_name) return res.status(400).json({ error: 'team_name required' });
      const ids = Array.isArray(team_member_ids) ? team_member_ids.map(Number) : [];
      const rows = await sql`
        INSERT INTO kervone_team (team_name, team_description, team_member_ids, dotted)
        VALUES (${team_name}, ${team_description || null}, ${ids}, ${dotted ? true : false})
        RETURNING *`;
      return res.status(200).json({ team: rows[0] });
    }

    if (req.method === 'PUT') {
      const { team_id, team_name, team_description, team_member_ids, dotted } = req.body || {};
      if (!team_id) return res.status(400).json({ error: 'team_id required' });
      const ids = Array.isArray(team_member_ids) ? team_member_ids.map(Number) : [];
      const rows = await sql`
        UPDATE kervone_team
        SET team_name        = ${team_name},
            team_description = ${team_description || null},
            team_member_ids  = ${ids},
            dotted           = ${dotted ? true : false}
        WHERE team_id = ${parseInt(team_id)}
        RETURNING *`;
      return res.status(200).json({ team: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { team_id } = req.query;
      if (!team_id) return res.status(400).json({ error: 'team_id required' });
      await sql`DELETE FROM kervone_team WHERE team_id = ${parseInt(team_id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
