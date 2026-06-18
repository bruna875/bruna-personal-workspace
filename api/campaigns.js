import { neon } from '@neondatabase/serverless';

function fmtNumber(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function fmtBudget(n) {
  if (!n) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n;
}

function fmtGoal(min, max) {
  if (!min) return '—';
  if (!max) return fmtNumber(min);
  return fmtNumber(min) + ' – ' + fmtNumber(max);
}

function fmtBudgetRange(min, max) {
  if (!min) return '—';
  if (!max) return fmtBudget(min);
  return fmtBudget(min) + ' – ' + fmtBudget(max);
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { campaign_id } = req.query;
      if (!campaign_id) return res.status(400).json({ error: 'Missing campaign_id' });
      await sql`DELETE FROM campaigns WHERE campaign_id = ${parseInt(campaign_id)}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('campaigns DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { campaign_id, client_org_id } = req.query;

    const rows = campaign_id ? await sql`
      SELECT
        c.campaign_id, c.campaign_name, c.geo, c.status,
        c.impression_goal, c.impression_goal_max, c.budget, c.budget_max,
        c.start_date, c.end_date, c.partner_ids, c.created_by, c.created_at,
        c.client_org_id, c.advertiser_id, c.creative_ids, o.client_name, a.advertiser_name,
        c.impressions_delivered, c.dollars_spent, c.pacing_pct
      FROM campaigns c
      LEFT JOIN advertisers          a ON c.advertiser_id  = a.advertiser_id
      LEFT JOIN client_organizations o ON c.client_org_id  = o.client_org_id
      WHERE c.campaign_id = ${parseInt(campaign_id)}
      ORDER BY c.campaign_id
    ` : client_org_id ? await sql`
      SELECT
        c.campaign_id, c.campaign_name, c.geo, c.status,
        c.impression_goal, c.impression_goal_max, c.budget, c.budget_max,
        c.start_date, c.end_date, c.partner_ids, c.created_by, c.created_at,
        c.client_org_id, c.advertiser_id, c.creative_ids, o.client_name, a.advertiser_name,
        c.impressions_delivered, c.dollars_spent, c.pacing_pct
      FROM campaigns c
      LEFT JOIN advertisers          a ON c.advertiser_id  = a.advertiser_id
      LEFT JOIN client_organizations o ON c.client_org_id  = o.client_org_id
      WHERE c.client_org_id = ${parseInt(client_org_id)}
      ORDER BY c.campaign_id
    ` : await sql`
      SELECT
        c.campaign_id, c.campaign_name, c.geo, c.status,
        c.impression_goal, c.impression_goal_max, c.budget, c.budget_max,
        c.start_date, c.end_date, c.partner_ids, c.created_by, c.created_at,
        c.client_org_id, c.advertiser_id, c.creative_ids, o.client_name, a.advertiser_name,
        c.impressions_delivered, c.dollars_spent, c.pacing_pct
      FROM campaigns c
      LEFT JOIN advertisers          a ON c.advertiser_id  = a.advertiser_id
      LEFT JOIN client_organizations o ON c.client_org_id  = o.client_org_id
      ORDER BY c.campaign_id
    `;

    // Resolve partner names from partner_ids via dsp_ssp_connections + library
    const allPartnerIds = [...new Set(rows.flatMap(r => r.partner_ids || []))];
    let partnerMap = {}; // connection_id → { name, type }
    if (allPartnerIds.length) {
      const pRows = await sql`
        SELECT conn.connection_id, lib.name, lib.type
        FROM dsp_ssp_connections conn
        JOIN dsp_ssp_library lib ON lib.library_id = conn.library_id
        WHERE conn.connection_id = ANY(${allPartnerIds})
      `;
      pRows.forEach(p => { partnerMap[p.connection_id] = { name: p.name, type: p.type }; });
    }

    const campaigns = rows.map(r => {
      const pIds = r.partner_ids || [];
      return {
        id:           'db' + r.campaign_id,
        dbId:         r.campaign_id,
        clientOrgId:  r.client_org_id  || null,
        advertiserId: r.advertiser_id  || null,
        name:         r.campaign_name  || '—',
        client:       r.client_name    || '—',
        advertiser:   r.advertiser_name || '—',
        geography:    r.geo ? r.geo.split(',').map(g => g.trim()) : [],
        status:       r.status || 'draft',
        pacing:       r.pacing_pct ?? null,
        impressions:  r.impressions_delivered || '—',
        goal:         fmtGoal(r.impression_goal, r.impression_goal_max),
        budget:       fmtBudgetRange(r.budget, r.budget_max),
        spent:        r.dollars_spent || '—',
        start:        fmtDate(r.start_date),
        end:          fmtDate(r.end_date),
        creatives:    (r.creative_ids || []).length,
        moments:      0,
        partnerIds:   pIds,
        partners:     pIds.map(id => partnerMap[id] ? partnerMap[id].name : String(id)),
        createdBy:    r.created_by || '—',
        createdOn:    fmtDate(r.created_at),
      };
    });

    return res.status(200).json({ campaigns });
  } catch (err) {
    console.error('campaigns API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
