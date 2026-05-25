import { neon } from '@neondatabase/serverless';

function fmtImpr(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'K';
  return String(n);
}

function fmtDollar(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '$' + Math.round(n / 1000) + 'K';
  return '$' + parseFloat(n).toFixed(2);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        mp.media_plan_name,
        mp.campaign_id,
        c.campaign_name,
        o.client_name,
        a.advertiser_name,
        COUNT(*)                                          AS moment_count,
        SUM(mp.est_impressions)                           AS total_impressions,
        ROUND(AVG(mp.est_cpm)::numeric, 2)               AS avg_cpm,
        SUM(mp.est_dollar_value)                          AS total_dollar_value,
        MAX(mp.created_by)                                AS created_by,
        MAX(mp.created_at)                                AS last_updated
      FROM media_plans mp
      LEFT JOIN campaigns            c ON mp.campaign_id  = c.campaign_id
      LEFT JOIN advertisers          a ON c.advertiser_id = a.advertiser_id
      LEFT JOIN client_organizations o ON a.client_org_id = o.client_org_id
      GROUP BY mp.media_plan_name, mp.campaign_id, c.campaign_name, o.client_name, a.advertiser_name
      ORDER BY MAX(mp.created_at) DESC
    `;

    const plans = rows.map(r => ({
      media_plan_name:   r.media_plan_name  || null,
      campaign_id:       r.campaign_id      || null,
      campaign_name:     r.campaign_name    || null,
      client_name:       r.client_name      || null,
      advertiser_name:   r.advertiser_name  || null,
      moment_count:      Number(r.moment_count),
      total_impressions: fmtImpr(Number(r.total_impressions)),
      avg_cpm:           r.avg_cpm != null ? '$' + parseFloat(r.avg_cpm).toFixed(2) : '—',
      total_dollar_value: fmtDollar(Number(r.total_dollar_value)),
      created_by:        r.created_by || '—',
      last_updated:      fmtDate(r.last_updated),
    }));

    return res.status(200).json({ plans });
  } catch (err) {
    console.error('media-plans-summary error:', err);
    return res.status(500).json({ error: err.message });
  }
}
