// migrate-media-plans-to-moments-match.mjs
// Migrates all existing media_plans rows into moments_match.media_plans JSONB.
// Groups by (campaign_id, media_plan_name) → one moments_match row per group,
// with a single media plan object containing all its moments.

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_KMCBm9Opyl2R@ep-rapid-bread-apo83i3o-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
const sql = neon(DATABASE_URL);

function slug(str) {
  return (str || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function run() {
  console.log('Reading media_plans…');

  const rows = await sql`
    SELECT
      media_plan_id,
      media_plan_name,
      campaign_id,
      client_org_id,
      advertiser_id,
      moment_id,
      est_impressions,
      est_cpm,
      est_dollar_value,
      moment_details,
      moment_taxonomies,
      created_by,
      created_at
    FROM media_plans
    ORDER BY campaign_id, media_plan_name, created_at
  `;

  console.log('Rows fetched:', rows.length);

  // Group by campaign_id + media_plan_name
  const groups = {};
  for (const r of rows) {
    const key = (r.campaign_id ?? 'null') + '||' + (r.media_plan_name ?? 'unnamed');
    if (!groups[key]) {
      groups[key] = {
        campaign_id:      r.campaign_id,
        client_org_id:    r.client_org_id,
        advertiser_id:    r.advertiser_id,
        media_plan_name:  r.media_plan_name,
        created_by:       r.created_by,
        created_at:       r.created_at,
        moments:          [],
      };
    }
    const det = r.moment_details || {};
    const impr  = Number(r.est_impressions)  || null;
    const cpm   = parseFloat(r.est_cpm)      || null;
    const dollar = r.est_dollar_value != null
      ? parseFloat(r.est_dollar_value)
      : (impr && cpm ? parseFloat(((impr * cpm) / 1000).toFixed(2)) : null);

    groups[key].moments.push({
      moment_id:               r.moment_id                    || null,
      moment_name:             det.moment_name                || null,
      moment_type:             det.moment_type                || null,
      moment_est_impr:         impr,
      moment_est_cpm:          cpm,
      moment_est_dollar_value: dollar,
      moment_pods:             det.pods                       ?? null,
      moment_channels:         det.channels                   || [],
      moment_taxonomies:       r.moment_taxonomies            || null,
    });
  }

  const keys = Object.keys(groups);
  console.log('\nGroups (one moments_match row each):', keys.length);

  for (const key of keys) {
    const g = groups[key];

    // Build the media_plans JSONB — one plan per group
    const planId = 'plan-' + slug(g.media_plan_name) + '-' + Date.now();
    const mediaPlansJson = JSON.stringify([{
      media_plan_id:   planId,
      media_plan_name: g.media_plan_name || null,
      moments:         g.moments,
    }]);

    const result = await sql`
      INSERT INTO moments_match (
        campaign_id,
        client_org_id,
        advertiser_id,
        analysis_name,
        status,
        media_plans,
        created_by,
        created_at
      ) VALUES (
        ${g.campaign_id    ?? null},
        ${g.client_org_id  ?? null},
        ${g.advertiser_id  ?? null},
        ${g.media_plan_name ?? null},
        'planned',
        ${mediaPlansJson}::jsonb,
        ${g.created_by     ?? null},
        ${g.created_at     ?? null}
      )
      RETURNING analysis_id
    `;

    const aid = result[0].analysis_id;
    console.log(
      '✓ Inserted analysis_id=' + aid +
      ' | campaign=' + (g.campaign_id ?? 'null') +
      ' | plan="' + g.media_plan_name + '"' +
      ' | moments=' + g.moments.length
    );
  }

  console.log('\nVerifying…');
  const check = await sql`
    SELECT analysis_id, analysis_name, campaign_id, status,
           jsonb_array_length(media_plans) AS plans,
           jsonb_array_length(media_plans->0->'moments') AS moments
    FROM moments_match
    ORDER BY analysis_id
  `;
  check.forEach(r =>
    console.log(
      '  analysis_id=' + r.analysis_id +
      ' | ' + r.analysis_name +
      ' | campaign=' + r.campaign_id +
      ' | plans=' + r.plans +
      ' | moments=' + r.moments
    )
  );

  console.log('\nDone. Total rows in moments_match:', check.length);
}

run().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
