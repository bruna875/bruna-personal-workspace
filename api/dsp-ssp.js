import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { client_org_id } = req.query;
      const library = await sql`
        SELECT library_id, name, type, category, description, preset_fields, status
        FROM dsp_ssp_library
        ORDER BY type DESC, name ASC
      `;
      const connections = client_org_id
        ? await sql`
            SELECT c.connection_id, c.library_id, c.client_org_id, c.advertiser_id,
                   c.seat_id, c.preset_values, c.status, c.connected_at, c.connected_by, c.notes
            FROM dsp_ssp_connections c
            WHERE c.client_org_id = ${parseInt(client_org_id)}
            ORDER BY c.connected_at DESC
          `
        : [];
      return res.status(200).json({ library, connections });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create connection ──────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { library_id, client_org_id, advertiser_id, seat_id, preset_values, connected_by } = req.body || {};
      if (!library_id || !client_org_id) return res.status(400).json({ error: 'Missing library_id or client_org_id' });
      const result = await sql`
        INSERT INTO dsp_ssp_connections
          (library_id, client_org_id, advertiser_id, seat_id, preset_values, status, connected_at, connected_by)
        VALUES (
          ${parseInt(library_id)},
          ${parseInt(client_org_id)},
          ${advertiser_id ? parseInt(advertiser_id) : null},
          ${seat_id || null},
          ${JSON.stringify(preset_values || {})}::jsonb,
          'active',
          NOW(),
          ${connected_by || null}
        )
        RETURNING connection_id, connected_at
      `;
      return res.status(201).json({ ok: true, connection_id: result[0].connection_id, connected_at: result[0].connected_at });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update connection ─────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { connection_id, status, seat_id, preset_values, notes } = req.body || {};
      if (!connection_id) return res.status(400).json({ error: 'Missing connection_id' });
      await sql`
        UPDATE dsp_ssp_connections SET
          status        = COALESCE(${status || null}, status),
          seat_id       = COALESCE(${seat_id || null}, seat_id),
          preset_values = COALESCE(${preset_values ? JSON.stringify(preset_values) + '::jsonb' : null}, preset_values),
          notes         = COALESCE(${notes || null}, notes)
        WHERE connection_id = ${parseInt(connection_id)}
      `;
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { connection_id } = req.query;
      if (!connection_id) return res.status(400).json({ error: 'Missing connection_id' });
      await sql`DELETE FROM dsp_ssp_connections WHERE connection_id = ${parseInt(connection_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
