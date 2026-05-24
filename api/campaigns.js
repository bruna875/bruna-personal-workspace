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
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        c.campaign_id,
        c.campaign_name,
        c.geo,
        c.status,
        c.impression_goal,
        c.impression_goal_max,
        c.budget,
        c.budget_max,
        c.start_date,
        c.end_date,
        c.partner,
        c.created_by,
        c.created_at,
        c.client_org_id,
        o.client_name,
        a.advertiser_name
      FROM campaigns c
      LEFT JOIN advertisers        a ON c.advertiser_id  = a.advertiser_id
      LEFT JOIN client_organizations o ON c.client_org_id = o.client_org_id
      ORDER BY c.campaign_id
    `;

    const campaigns = rows.map(r => ({
      id:          'db' + r.campaign_id,
      dbId:        r.campaign_id,
      name:        r.campaign_name || '—',
      client:      r.client_name || '—',
      advertiser:  r.advertiser_name || '—',
      geography:   r.geo ? r.geo.split(',').map(g => g.trim()) : [],
      status:      r.status || 'draft',
      pacing:      null,
      impressions: '—',
      goal:        fmtGoal(r.impression_goal, r.impression_goal_max),
      budget:      fmtBudgetRange(r.budget, r.budget_max),
      spent:       '—',
      start:       fmtDate(r.start_date),
      end:         fmtDate(r.end_date),
      creatives:   0,
      moments:     0,
      partners:    r.partner ? r.partner.split(',').map(p => p.trim()) : [],
      createdBy:   r.created_by || '—',
      createdOn:   fmtDate(r.created_at),
    }));

    return res.status(200).json({ campaigns });
  } catch (err) {
    console.error('campaigns API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
