import { neon } from '@neondatabase/serverless';

const VALID_STATUSES = ['draft','planned','pacing','underpacing','failed','completed'];

function fmtNumber(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'K';
  return String(n);
}
function fmtBudget(n) {
  if (!n) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n;
}
function fmtRange(min, max, fmt) {
  if (!min) return '—';
  if (!max)  return fmt(min);
  return fmt(min) + ' – ' + fmt(max);
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET ───────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { campaign_id, client_org_id, advertiser_id } = req.query;
      const conditions = [], params = [];
      if (campaign_id)   { conditions.push(`cv.campaign_id   = $${params.length + 1}`); params.push(parseInt(campaign_id));   }
      if (client_org_id) { conditions.push(`cv.client_org_id = $${params.length + 1}`); params.push(parseInt(client_org_id)); }
      if (advertiser_id) { conditions.push(`cv.advertiser_id = $${params.length + 1}`); params.push(parseInt(advertiser_id)); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // ── Query campaigns_v2 (new table) ───────────────────────────────────────
      const rows = await sql.query(`
        SELECT
          cv.*,
          o.client_name,
          a.advertiser_name,
          (SELECT COUNT(*) FROM creatives_v2 cr WHERE cr.campaign_id = cv.campaign_id)::int AS creative_count,
          (SELECT COUNT(*) FROM moments_match mm WHERE mm.campaign_id = cv.campaign_id)::int AS analysis_count
        FROM campaigns_v2 cv
        LEFT JOIN client_organizations o ON cv.client_org_id = o.client_org_id
        LEFT JOIN advertisers          a ON cv.advertiser_id = a.advertiser_id
        ${where}
        ORDER BY cv.created_at DESC
      `, params);

      // ── Query campaigns (old table) — backward compat ────────────────────────
      let v1Rows = [];
      try {
        const v1Conditions = [], v1Params = [];
        if (campaign_id)   { v1Conditions.push(`c.campaign_id   = $${v1Params.length + 1}`); v1Params.push(parseInt(campaign_id));   }
        if (client_org_id) { v1Conditions.push(`c.client_org_id = $${v1Params.length + 1}`); v1Params.push(parseInt(client_org_id)); }
        if (advertiser_id) { v1Conditions.push(`c.advertiser_id = $${v1Params.length + 1}`); v1Params.push(parseInt(advertiser_id)); }
        const v1Where = v1Conditions.length ? `WHERE ${v1Conditions.join(' AND ')}` : '';
        v1Rows = await sql.query(`
          SELECT
            c.campaign_id, c.campaign_name, c.status AS campaign_status,
            c.geo, c.impression_goal, c.impression_goal_max, c.budget, c.budget_max,
            c.start_date, c.end_date, c.partner_ids, c.created_by, c.created_at,
            c.client_org_id, c.advertiser_id,
            o.client_name, a.advertiser_name,
            NULL::jsonb AS line_items,
            (SELECT COUNT(*) FROM creatives    cr WHERE cr.campaign_id = c.campaign_id)::int AS creative_count,
            (SELECT COUNT(*) FROM moments_match mm WHERE mm.campaign_id = c.campaign_id)::int AS analysis_count
          FROM campaigns c
          LEFT JOIN client_organizations o ON c.client_org_id = o.client_org_id
          LEFT JOIN advertisers          a ON c.advertiser_id = a.advertiser_id
          ${v1Where}
          ORDER BY c.created_at DESC
        `, v1Params);
      } catch (v1Err) {
        console.warn('campaigns-v2 GET: old campaigns table query failed (non-fatal):', v1Err.message);
      }

      // ── Collect all partner IDs for name resolution ──────────────────────────
      const allPartnerIds = [...new Set([
        ...rows.flatMap(r => { const d = r.campaign_details || {}; return Array.isArray(d.partner_ids) ? d.partner_ids : []; }),
        ...v1Rows.flatMap(r => Array.isArray(r.partner_ids) ? r.partner_ids : []),
      ])];
      let partnerMap = {};
      if (allPartnerIds.length) {
        const pRows = await sql`
          SELECT conn.connection_id, lib.name
          FROM dsp_ssp_connections conn
          JOIN dsp_ssp_library lib ON lib.library_id = conn.library_id
          WHERE conn.connection_id = ANY(${allPartnerIds})
        `;
        pRows.forEach(p => { partnerMap[p.connection_id] = p.name; });
      }

      // ── Map campaigns_v2 rows ────────────────────────────────────────────────
      const v2Campaigns = rows.map(r => {
        const d        = r.campaign_details || {};
        const pIds     = Array.isArray(d.partner_ids) ? d.partner_ids : [];
        const geo      = d.geo ? d.geo.split(',').map(g => g.trim()).filter(Boolean) : [];
        return {
          id:            'db' + r.campaign_id,
          dbId:          r.campaign_id,
          _source:       'v2',
          clientOrgId:   r.client_org_id   || null,
          advertiserId:  r.advertiser_id   || null,
          name:          r.campaign_name   || '—',
          client:        r.client_name     || '—',
          advertiser:    r.advertiser_name || '—',
          geography:     geo,
          status:        r.campaign_status || 'draft',
          pacing:        null,
          impressions:   '—',
          goal:          fmtRange(d.impr || d.impression_goal, d.impr_max || d.impression_goal_max, fmtNumber),
          budget:        fmtRange(d.budget, d.budget_max, fmtBudget),
          spent:         '—',
          start:         fmtDate(d.flight_start || d.start_date),
          end:           fmtDate(d.flight_end   || d.end_date),
          creatives:     r.creative_count  || 0,
          analysisCount: r.analysis_count  || 0,
          moments:       0,
          partnerIds:    pIds,
          partners:      pIds.map(id => partnerMap[id] || String(id)),
          createdBy:     d.created_by || r.created_by || '—',
          createdOn:     fmtDate(r.created_at),
          campaign_details: r.campaign_details,
          line_items:       r.line_items,
          moments_match_analysis_id: d.moments_match_analysis_id || null,
        };
      });

      // ── Map old campaigns rows ───────────────────────────────────────────────
      // Exclude any old campaign whose ID already exists in campaigns_v2
      const v2Ids = new Set(rows.map(r => r.campaign_id));
      const v1Campaigns = v1Rows
        .filter(r => !v2Ids.has(r.campaign_id))
        .map(r => {
          const pIds = Array.isArray(r.partner_ids) ? r.partner_ids : [];
          const geo  = r.geo ? r.geo.split(',').map(g => g.trim()).filter(Boolean) : [];
          return {
            id:            'v1' + r.campaign_id,
            dbId:          r.campaign_id,
            _source:       'v1',
            clientOrgId:   r.client_org_id   || null,
            advertiserId:  r.advertiser_id   || null,
            name:          r.campaign_name   || '—',
            client:        r.client_name     || '—',
            advertiser:    r.advertiser_name || '—',
            geography:     geo,
            status:        r.campaign_status || 'draft',
            pacing:        null,
            impressions:   '—',
            goal:          fmtRange(r.impression_goal, r.impression_goal_max, fmtNumber),
            budget:        fmtRange(r.budget, r.budget_max, fmtBudget),
            spent:         '—',
            start:         fmtDate(r.start_date),
            end:           fmtDate(r.end_date),
            creatives:     r.creative_count  || 0,
            analysisCount: r.analysis_count  || 0,
            moments:       0,
            partnerIds:    pIds,
            partners:      pIds.map(id => partnerMap[id] || String(id)),
            createdBy:     r.created_by || '—',
            createdOn:     fmtDate(r.created_at),
            campaign_details: null,
            line_items:       null,
            moments_match_analysis_id: null,
          };
        });

      const campaigns = [...v2Campaigns, ...v1Campaigns];
      return res.status(200).json({ campaigns });
    } catch (err) {
      console.error('campaigns-v2 GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { campaign_name, client_org_id, advertiser_id,
              campaign_status, campaign_details, line_items } = req.body || {};

      const statusVal = VALID_STATUSES.includes(campaign_status) ? campaign_status : 'draft';

      const result = await sql`
        INSERT INTO campaigns_v2
          (campaign_name, client_org_id, advertiser_id, campaign_status, campaign_details, line_items)
        VALUES (
          ${campaign_name || null},
          ${client_org_id ? parseInt(client_org_id) : null},
          ${advertiser_id ? parseInt(advertiser_id) : null},
          ${statusVal},
          ${campaign_details !== undefined ? JSON.stringify(campaign_details) : null}::jsonb,
          ${JSON.stringify(line_items || [])}::jsonb
        )
        RETURNING campaign_id, created_at
      `;

      return res.status(201).json({
        ok: true,
        campaign_id: result[0].campaign_id,
        created_at:  result[0].created_at,
      });
    } catch (err) {
      console.error('campaigns-v2 POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update (merges only provided fields) ──────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { campaign_id } = req.query;
      if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
      const cid = parseInt(campaign_id);

      const current = await sql`SELECT * FROM campaigns_v2 WHERE campaign_id = ${cid}`;
      if (!current.length) return res.status(404).json({ error: 'Campaign not found' });
      const c   = current[0];
      const b   = req.body || {};

      const newName    = b.campaign_name     !== undefined ? (b.campaign_name || null)                              : c.campaign_name;
      const newClient  = b.client_org_id     !== undefined ? (b.client_org_id ? parseInt(b.client_org_id) : null)  : c.client_org_id;
      const newAdv     = b.advertiser_id     !== undefined ? (b.advertiser_id ? parseInt(b.advertiser_id) : null)  : c.advertiser_id;
      const newStatus  = b.campaign_status   !== undefined && VALID_STATUSES.includes(b.campaign_status)
                           ? b.campaign_status : c.campaign_status;
      const newDetails = b.campaign_details  !== undefined ? JSON.stringify(b.campaign_details)
                           : (c.campaign_details ? JSON.stringify(c.campaign_details) : null);
      const newItems   = b.line_items        !== undefined ? JSON.stringify(b.line_items)
                           : JSON.stringify(c.line_items || []);

      await sql`
        UPDATE campaigns_v2 SET
          campaign_name    = ${newName},
          client_org_id    = ${newClient},
          advertiser_id    = ${newAdv},
          campaign_status  = ${newStatus},
          campaign_details = ${newDetails}::jsonb,
          line_items       = ${newItems}::jsonb,
          updated_at       = now()
        WHERE campaign_id  = ${cid}
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('campaigns-v2 PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { campaign_id, source } = req.query;
      if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
      const id = parseInt(campaign_id);
      // Clear FK references (shared across both tables)
      await sql`UPDATE moments_match SET campaign_id = NULL WHERE campaign_id = ${id}`;
      if (source === 'v1') {
        // Old campaigns table
        await sql`UPDATE creatives SET campaign_id = NULL WHERE campaign_id = ${id}`;
        await sql`DELETE FROM campaigns WHERE campaign_id = ${id}`;
      } else {
        // New campaigns_v2 table (default)
        await sql`UPDATE creatives_v2 SET campaign_id = NULL WHERE campaign_id = ${id}`;
        await sql`DELETE FROM campaigns_v2 WHERE campaign_id = ${id}`;
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('campaigns-v2 DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
