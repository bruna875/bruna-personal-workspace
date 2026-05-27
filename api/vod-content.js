import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  try {
    // ── GET ─────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { vod_content_id, client_org_id } = req.query;

      // Single record by ID
      if (vod_content_id) {
        const rows = await sql`
          SELECT
            v.vod_content_id,
            v.vod_content_name,
            v.vod_content_category,
            v.client_org_id,
            o.client_name   AS client_org_name,
            v.content_s3_link,
            v.content_yt_link,
            v.tier_0_analysis,
            v.tier_1_analysis,
            v.tier_2_analysis,
            v.tier_3_analysis,
            v.created_at,
            v.updated_at
          FROM vod_content v
          LEFT JOIN client_organizations o ON o.client_org_id = v.client_org_id
          WHERE v.vod_content_id = ${vod_content_id}
        `;
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ vod_content: rows[0] });
      }

      // List — optional filter by client org
      const rows = client_org_id
        ? await sql`
            SELECT
              v.vod_content_id,
              v.vod_content_name,
              v.vod_content_category,
              v.client_org_id,
              o.client_name   AS client_org_name,
              v.content_s3_link,
              v.content_yt_link,
              CASE WHEN v.tier_0_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_0,
              CASE WHEN v.tier_1_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_1,
              CASE WHEN v.tier_2_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_2,
              CASE WHEN v.tier_3_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_3,
              v.created_at,
              v.updated_at
            FROM vod_content v
            LEFT JOIN client_organizations o ON o.client_org_id = v.client_org_id
            WHERE v.client_org_id = ${client_org_id}
            ORDER BY v.vod_content_id DESC
          `
        : await sql`
            SELECT
              v.vod_content_id,
              v.vod_content_name,
              v.vod_content_category,
              v.client_org_id,
              o.client_name   AS client_org_name,
              v.content_s3_link,
              v.content_yt_link,
              CASE WHEN v.tier_0_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_0,
              CASE WHEN v.tier_1_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_1,
              CASE WHEN v.tier_2_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_2,
              CASE WHEN v.tier_3_analysis IS NOT NULL THEN TRUE ELSE FALSE END AS has_tier_3,
              v.created_at,
              v.updated_at
            FROM vod_content v
            LEFT JOIN client_organizations o ON o.client_org_id = v.client_org_id
            ORDER BY v.vod_content_id DESC
          `;

      return res.status(200).json({ vod_content: rows });
    }

    // ── POST — create ────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const {
        vod_content_name, vod_content_category,
        client_org_id,
        content_s3_link, content_yt_link,
        tier_0_analysis, tier_1_analysis, tier_2_analysis, tier_3_analysis,
      } = req.body || {};

      if (!vod_content_name) return res.status(400).json({ error: 'vod_content_name is required' });

      const rows = await sql`
        INSERT INTO vod_content (
          vod_content_name, vod_content_category,
          client_org_id,
          content_s3_link, content_yt_link,
          tier_0_analysis, tier_1_analysis, tier_2_analysis, tier_3_analysis
        ) VALUES (
          ${vod_content_name},
          ${vod_content_category || null},
          ${client_org_id || null},
          ${content_s3_link || null},
          ${content_yt_link || null},
          ${tier_0_analysis ? JSON.stringify(tier_0_analysis) : null},
          ${tier_1_analysis ? JSON.stringify(tier_1_analysis) : null},
          ${tier_2_analysis ? JSON.stringify(tier_2_analysis) : null},
          ${tier_3_analysis ? JSON.stringify(tier_3_analysis) : null}
        )
        RETURNING vod_content_id
      `;

      return res.status(201).json({ vod_content_id: rows[0].vod_content_id });
    }

    // ── PATCH — update fields / upload tier analysis ─────────────────────────
    if (req.method === 'PATCH') {
      const { vod_content_id } = req.query;
      if (!vod_content_id) return res.status(400).json({ error: 'vod_content_id query param required' });

      const allowed = [
        'vod_content_name', 'vod_content_category',
        'client_org_id', 'content_s3_link', 'content_yt_link',
        'tier_0_analysis', 'tier_1_analysis', 'tier_2_analysis', 'tier_3_analysis',
      ];
      const body = req.body || {};
      const jsonbFields = new Set(['tier_0_analysis','tier_1_analysis','tier_2_analysis','tier_3_analysis']);

      for (const field of allowed) {
        if (!(field in body)) continue;
        const value = jsonbFields.has(field)
          ? (body[field] ? JSON.stringify(body[field]) : null)
          : (body[field] ?? null);
        await sql.unsafe(
          `UPDATE vod_content SET ${field} = $1 WHERE vod_content_id = $2`,
          [value, vod_content_id]
        );
      }

      return res.status(200).json({ ok: true });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { vod_content_id } = req.query;
      if (!vod_content_id) return res.status(400).json({ error: 'vod_content_id query param required' });

      await sql`DELETE FROM vod_content WHERE vod_content_id = ${vod_content_id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('vod-content API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
