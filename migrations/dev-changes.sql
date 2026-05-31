-- ============================================================
-- DEV → PROD migration log
-- ============================================================
-- Every schema change made on the dev DB goes here.
-- When ready to deploy to prod, run these queries in order
-- on the production Neon branch (SQL Editor on console.neon.tech).
-- ============================================================


-- ── 2026-05-31: Migrate old campaigns → campaigns_v2 ─────────────────────────
-- Copies all rows from the old `campaigns` table into `campaigns_v2`,
-- keeping the same campaign_id so FK references in moments_match /
-- creatives / creatives_v2 stay valid.
-- Skips any campaign_id that already exists in campaigns_v2 (safe to re-run).

INSERT INTO campaigns_v2 (
  campaign_id,
  campaign_name,
  client_org_id,
  advertiser_id,
  campaign_status,
  campaign_details,
  line_items,
  created_at
)
SELECT
  c.campaign_id,
  c.campaign_name,
  c.client_org_id,
  c.advertiser_id,
  c.status,
  jsonb_strip_nulls(jsonb_build_object(
    'geo',        c.geo,
    'impr',       c.impression_goal,
    'impr_max',   c.impression_goal_max,
    'budget',     c.budget,
    'budget_max', c.budget_max,
    'start_date', c.start_date::text,
    'end_date',   c.end_date::text,
    'partner_ids', COALESCE(c.partner_ids, ARRAY[]::integer[]),
    'created_by', c.created_by
  )),
  '[]'::jsonb,
  c.created_at
FROM campaigns c
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns_v2 cv WHERE cv.campaign_id = c.campaign_id
);

-- Advance the sequence so new campaigns don't clash with migrated IDs
SELECT setval(
  pg_get_serial_sequence('campaigns_v2', 'campaign_id'),
  GREATEST(
    (SELECT COALESCE(MAX(campaign_id), 0) FROM campaigns_v2),
    (SELECT COALESCE(MAX(campaign_id), 0) FROM campaigns)
  ) + 1
);


-- ── 2026-05-31: Rename ad_group_id / ad_group_name → moments_group_id / moments_group_name ──
-- Renames the JSONB keys inside moments_match.moments_groups for naming consistency.
-- Safe to re-run: if keys already renamed, the operation is a no-op per row.

UPDATE moments_match
SET moments_groups = (
  SELECT jsonb_agg(
    (elem - 'ad_group_id' - 'ad_group_name')
    || jsonb_build_object(
         'moments_group_id',   elem->'ad_group_id',
         'moments_group_name', elem->'ad_group_name'
       )
  )
  FROM jsonb_array_elements(moments_groups) AS elem
)
WHERE moments_groups IS NOT NULL
  AND jsonb_typeof(moments_groups) = 'array'
  AND jsonb_array_length(moments_groups) > 0
  AND (moments_groups->0) ? 'ad_group_id';
