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
  await sql`CREATE TABLE IF NOT EXISTS kervone_team (
    team_id          SERIAL PRIMARY KEY,
    team_name        TEXT        NOT NULL,
    team_description TEXT,
    team_member_ids  INTEGER[]   DEFAULT '{}'
  )`;
  await sql`ALTER TABLE kervone_team_member ADD COLUMN IF NOT EXISTS team_id INTEGER`;
  await sql`ALTER TABLE kervone_team_member ADD COLUMN IF NOT EXISTS reporting_to_lead_id INTEGER`;
}

// Sync team_member_ids array on the team after a member's team_id changes
async function syncTeamArrays(sql, memberId, oldTeamId, newTeamId) {
  if (oldTeamId && oldTeamId !== newTeamId) {
    await sql`
      UPDATE kervone_team
      SET team_member_ids = array_remove(team_member_ids, ${memberId})
      WHERE team_id = ${oldTeamId}`;
  }
  if (newTeamId) {
    await sql`
      UPDATE kervone_team
      SET team_member_ids = array_append(
        array_remove(team_member_ids, ${memberId}),
        ${memberId}
      )
      WHERE team_id = ${newTeamId}`;
  }
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
      const { team_member_name, team_member_role, team_member_title, team_member_description, team_id, reporting_to_lead_id, domain_id } = req.body || {};
      if (!team_member_name) return res.status(400).json({ error: 'team_member_name required' });
      const tid    = team_id              ? parseInt(team_id)              : null;
      const leadId = reporting_to_lead_id ? parseInt(reporting_to_lead_id) : null;
      const rows = await sql`
        INSERT INTO kervone_team_member (team_member_name, team_member_role, team_member_title, team_member_description, team_id, reporting_to_lead_id)
        VALUES (${team_member_name}, ${team_member_role || null}, ${team_member_title || null}, ${team_member_description || null}, ${tid}, ${leadId})
        RETURNING *`;
      const member = rows[0];
      if (tid) await syncTeamArrays(sql, member.team_member_id, null, tid);
      if (team_member_role === 'product_lead' || team_member_role === 'engineering_lead') {
        await sql`UPDATE kervone_domain SET reporting_to_lead_id = NULL WHERE reporting_to_lead_id = ${member.team_member_id}`;
        if (domain_id) await sql`UPDATE kervone_domain SET reporting_to_lead_id = ${member.team_member_id} WHERE domain_id = ${parseInt(domain_id)}`;
      }
      return res.status(200).json({ member });
    }

    if (req.method === 'PUT') {
      const { team_member_id, team_member_name, team_member_role, team_member_title, team_member_description, team_id, reporting_to_lead_id, domain_id } = req.body || {};
      if (!team_member_id) return res.status(400).json({ error: 'team_member_id required' });
      const mid    = parseInt(team_member_id);
      const newTid = team_id              ? parseInt(team_id)              : null;
      const leadId = reporting_to_lead_id ? parseInt(reporting_to_lead_id) : null;

      const prev = await sql`SELECT team_id FROM kervone_team_member WHERE team_member_id = ${mid}`;
      const oldTid = prev[0] ? prev[0].team_id : null;

      const rows = await sql`
        UPDATE kervone_team_member
        SET team_member_name        = ${team_member_name},
            team_member_role        = ${team_member_role || null},
            team_member_title       = ${team_member_title || null},
            team_member_description = ${team_member_description || null},
            team_id                 = ${newTid},
            reporting_to_lead_id    = ${leadId}
        WHERE team_member_id = ${mid}
        RETURNING *`;

      await syncTeamArrays(sql, mid, oldTid, newTid);
      if (team_member_role === 'product_lead' || team_member_role === 'engineering_lead') {
        await sql`UPDATE kervone_domain SET reporting_to_lead_id = NULL WHERE reporting_to_lead_id = ${mid}`;
        if (domain_id) await sql`UPDATE kervone_domain SET reporting_to_lead_id = ${mid} WHERE domain_id = ${parseInt(domain_id)}`;
      }
      return res.status(200).json({ member: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { team_member_id } = req.query;
      if (!team_member_id) return res.status(400).json({ error: 'team_member_id required' });
      const mid = parseInt(team_member_id);
      await sql`
        UPDATE kervone_team
        SET team_member_ids = array_remove(team_member_ids, ${mid})`;
      await sql`DELETE FROM kervone_team_member WHERE team_member_id = ${mid}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
