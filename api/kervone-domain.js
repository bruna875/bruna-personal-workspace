import { neon } from '@neondatabase/serverless';

async function ensureTable(sql) {
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
    await ensureTable(sql);

    if (req.method === 'GET') {
      const domains = await sql`SELECT * FROM kervone_domain ORDER BY domain_id`;
      return res.status(200).json({ domains });
    }

    if (req.method === 'POST') {
      const { domain_name, team_ids } = req.body || {};
      if (!domain_name) return res.status(400).json({ error: 'domain_name required' });
      const ids = Array.isArray(team_ids) ? team_ids.map(Number) : [];
      // Remove these teams from any other domain to enforce one-domain-per-team
      if (ids.length) {
        await sql`
          UPDATE kervone_domain
          SET team_ids = array(
            SELECT unnest(team_ids) EXCEPT SELECT unnest(${ids}::integer[])
          )`;
      }
      const rows = await sql`
        INSERT INTO kervone_domain (domain_name, team_ids)
        VALUES (${domain_name}, ${ids})
        RETURNING *`;
      return res.status(200).json({ domain: rows[0] });
    }

    if (req.method === 'PUT') {
      const { domain_id, domain_name, team_ids } = req.body || {};
      if (!domain_id) return res.status(400).json({ error: 'domain_id required' });
      const did = parseInt(domain_id);
      const ids = Array.isArray(team_ids) ? team_ids.map(Number) : [];
      // Remove these teams from other domains (not this one)
      if (ids.length) {
        await sql`
          UPDATE kervone_domain
          SET team_ids = array(
            SELECT unnest(team_ids) EXCEPT SELECT unnest(${ids}::integer[])
          )
          WHERE domain_id != ${did}`;
      }
      const rows = await sql`
        UPDATE kervone_domain
        SET domain_name = ${domain_name},
            team_ids    = ${ids}
        WHERE domain_id = ${did}
        RETURNING *`;
      return res.status(200).json({ domain: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { domain_id } = req.query;
      if (!domain_id) return res.status(400).json({ error: 'domain_id required' });
      await sql`DELETE FROM kervone_domain WHERE domain_id = ${parseInt(domain_id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
