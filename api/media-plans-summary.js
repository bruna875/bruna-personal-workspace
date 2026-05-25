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
    const { client_org_id } = req.query;

    const rows = client_org_id
      ? await sql`
          SELECT mm.analysis_id, mm.campaign_id, mm.client_org_id, mm.advertiser_id,
                 mm.media_plans, mm.created_by, mm.created_at,
                 c.campaign_name, o.client_name, a.advertiser_name
          FROM moments_match mm
          LEFT JOIN campaigns            c ON mm.campaign_id   = c.campaign_id
          LEFT JOIN advertisers          a ON mm.advertiser_id = a.advertiser_id
          LEFT JOIN client_organizations o ON mm.client_org_id = o.client_org_id
          WHERE mm.client_org_id = ${parseInt(client_org_id)}
            AND mm.media_plans IS NOT NULL
          ORDER BY mm.created_at DESC
        `
      : await sql`
          SELECT mm.analysis_id, mm.campaign_id, mm.client_org_id, mm.advertiser_id,
                 mm.media_plans, mm.created_by, mm.created_at,
                 c.campaign_name, o.client_name, a.advertiser_name
          FROM moments_match mm
          LEFT JOIN campaigns            c ON mm.campaign_id   = c.campaign_id
          LEFT JOIN advertisers          a ON mm.advertiser_id = a.advertiser_id
          LEFT JOIN client_organizations o ON mm.client_org_id = o.client_org_id
          WHERE mm.media_plans IS NOT NULL
          ORDER BY mm.created_at DESC
        `;

    // Expand: one summary row per media_plan (not per moment)
    const plans = [];
    for (const row of rows) {
      const mediaPlans = row.media_plans || [];
      for (const plan of mediaPlans) {
        const moments = plan.moments || [];
        let totalImpr  = 0;
        let totalCpm   = 0;
        let cpmCount   = 0;
        let totalDollar = 0;

        for (const m of moments) {
          const impr  = Number(m.moment_est_impr)  || 0;
          const cpm   = Number(m.moment_est_cpm)   || 0;
          const dollar = Number(m.moment_est_dollar_value) || 0;
          totalImpr   += impr;
          totalDollar += dollar;
          if (cpm > 0) { totalCpm += cpm; cpmCount++; }
        }

        const avgCpm = cpmCount > 0 ? totalCpm / cpmCount : 0;

        plans.push({
          media_plan_id:     plan.media_plan_id   || null,
          media_plan_name:   plan.media_plan_name  || null,
          analysis_id:       row.analysis_id,
          campaign_id:       row.campaign_id       || null,
          campaign_name:     row.campaign_name     || null,
          client_name:       row.client_name       || null,
          advertiser_name:   row.advertiser_name   || null,
          moment_count:      moments.length,
          total_impressions: fmtImpr(totalImpr),
          avg_cpm:           avgCpm > 0 ? '$' + avgCpm.toFixed(2) : '—',
          total_dollar_value: fmtDollar(totalDollar),
          created_by:        row.created_by        || '—',
          last_updated:      fmtDate(row.created_at),
        });
      }
    }

    return res.status(200).json({ plans });
  } catch (err) {
    console.error('media-plans-summary error:', err);
    return res.status(500).json({ error: err.message });
  }
}
